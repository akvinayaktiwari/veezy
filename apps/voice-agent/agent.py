"""LiveKit voice agent core connecting STT, LLM, and TTS pipeline."""
import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import webrtcvad
from livekit import rtc
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli

from config import Config, load_config
from stt import VoskSTT
from llm import GeminiLLM
from tts import PiperTTS

logger = logging.getLogger(__name__)


@dataclass
class TranscriptEntry:
    """Single entry in conversation transcript."""
    speaker: str
    text: str
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class AgentConfig:
    """Configuration for a voice agent session."""
    agent_name: str = "Assistant"
    agent_knowledge: str = ""
    room_name: str = ""
    debug_mode: bool = False  # If True, skip LLM and just echo STT results


class VoiceAgent:
    """Core voice agent connecting STT, LLM, and TTS in LiveKit pipeline."""

    def __init__(
        self, 
        config: Config, 
        agent_config: AgentConfig,
        stt_service: Optional[VoskSTT] = None,
        llm_service: Optional[GeminiLLM] = None,
        tts_service: Optional[PiperTTS] = None
    ):
        """Initialize voice agent with configuration and pre-loaded services."""
        self.config = config
        self.agent_config = agent_config
        self.session_id = str(uuid.uuid4())
        
        # Use pre-loaded services if provided (instant startup)
        # Otherwise fall back to loading per-session (slower)
        self.stt: Optional[VoskSTT] = stt_service
        self.llm_service: Optional[GeminiLLM] = llm_service
        self.tts: Optional[PiperTTS] = tts_service
        
        self.transcript: list[TranscriptEntry] = []
        self.conversation_history: list[dict] = []
        
        self.room: Optional[rtc.Room] = None
        self.audio_source: Optional[rtc.AudioSource] = None
        self.start_time: Optional[float] = None
        self.is_active = False
        self.is_speaking = False
        
        self._pending_audio: bytes = b""
        self._vad_silence_threshold = 1.8  # Wait 1.8s of silence before sending to LLM
        self._last_speech_time: Optional[float] = None
        self._speech_buffer: list[str] = []  # Buffer final results from Vosk
        self._silence_task: Optional[asyncio.Task] = None
        self._audio_buffer: bytes = b""  # Buffer for accumulating audio chunks
        self._buffer_size = 8000  # ~0.5 seconds at 16kHz (8000 bytes = 4000 samples)
        self._silence_count = 0  # Counter for silence logging
        
        # Voice Activity Detection to filter silence
        self.vad = webrtcvad.Vad(2)  # Aggressiveness: 0-3, 2 is balanced
        
        # Only initialize services if not already provided (backward compatibility)
        if self.stt is None or self.llm_service is None or self.tts is None:
            self._initialize_services()
        else:
            logger.info("Using pre-loaded services (instant startup)")

    def _initialize_services(self) -> None:
        """Load and initialize STT, LLM, and TTS services (fallback for per-session loading)."""
        logger.info("Initializing voice agent services (per-session loading)")
        
        if self.stt is None:
            self.stt = VoskSTT(self.config.vosk_model_path)
        
        if self.llm_service is None:
            self.llm_service = GeminiLLM(
                api_key=self.config.gemini_api_key,
                model=self.config.gemini_model
            )
        
        # Always set system context for this session (even if LLM is pre-loaded)
        self.llm_service.set_system_context(
            agent_name=self.agent_config.agent_name,
            agent_knowledge=self.agent_config.agent_knowledge
        )
        
        if self.tts is None:
            self.tts = PiperTTS(model_path=self.config.piper_model_path)
        
        logger.info("Voice agent services initialized")

    async def _send_data_message(self, message: dict) -> None:
        """Send a message via LiveKit data channel."""
        if self.room and self.room.local_participant:
            try:
                import json
                data = json.dumps(message).encode('utf-8')
                await self.room.local_participant.publish_data(data, reliable=True)
            except Exception as e:
                logger.debug(f"Failed to send data message: {e}")

    async def start(self, room_name: str, participant_token: str) -> None:
        """Connect to LiveKit room and start processing."""
        self.room_name = room_name  # Store room name for rejoin functionality
        self.start_time = time.time()
        self.is_active = True
        
        self.room = rtc.Room()
        
        self.room.on("track_subscribed", self._on_track_subscribed)
        self.room.on("disconnected", self._on_disconnected)
        
        try:
            await self.room.connect(
                self.config.livekit_url,
                participant_token,
                options=rtc.RoomOptions(
                    auto_subscribe=True
                )
            )
            
            self.audio_source = rtc.AudioSource(22050, 1)
            track = rtc.LocalAudioTrack.create_audio_track("agent-audio", self.audio_source)
            
            await self.room.local_participant.publish_track(track)
            
            logger.info(f"Voice agent connected to room: {room_name}")
            
        except Exception as e:
            logger.error(f"Failed to connect to room: {e}")
            self.is_active = False
            raise

    def _on_track_subscribed(
        self, 
        track: rtc.Track, 
        publication: rtc.RemoteTrackPublication,
        participant: rtc.RemoteParticipant
    ) -> None:
        """Handle incoming audio track from user."""
        if track.kind != rtc.TrackKind.KIND_AUDIO:
            return
        
        logger.info(f"Subscribed to audio track from {participant.identity}")
        
        asyncio.create_task(self._process_audio_track(track))

    async def _process_audio_track(self, track: rtc.Track) -> None:
        """Continuously process audio chunks through STT."""
        audio_stream = rtc.AudioStream(track, sample_rate=16000)  # Resample to 16kHz for Vosk
        
        chunk_count = 0
        async for event in audio_stream:
            if not self.is_active:
                break
            
            chunk_count += 1
            # Log every 100th chunk
            if chunk_count % 100 == 0:
                frame = event.frame
                logger.debug(f"Audio chunk #{chunk_count}: {len(frame.data)} bytes, "
                           f"rate={frame.sample_rate}, channels={frame.num_channels}, "
                           f"buffer size: {len(self._audio_buffer)} bytes")
            
            # Accumulate audio in buffer
            audio_bytes = event.frame.data.tobytes()
            self._audio_buffer += audio_bytes
            
            # Process when buffer reaches target size
            if len(self._audio_buffer) >= self._buffer_size:
                # Use VAD to check if buffer contains speech
                # VAD requires exactly 320 bytes (20ms at 16kHz)
                vad_chunk = self._audio_buffer[:320]
                is_speech = False
                try:
                    is_speech = self.vad.is_speech(vad_chunk, 16000)
                except Exception as e:
                    logger.warning(f"VAD error: {e}")
                    is_speech = True  # Process anyway if VAD fails
                
                if is_speech:
                    await self._process_audio_chunk(self._audio_buffer)
                    self._silence_count = 0  # Reset silence counter
                else:
                    self._silence_count += 1
                    # Only log silence occasionally to reduce spam
                    if self._silence_count % 50 == 0:
                        logger.debug(f"Silence detected ({self._silence_count} consecutive buffers)")
                
                self._audio_buffer = b""  # Clear buffer

    async def _process_audio_chunk(self, audio_chunk: bytes) -> None:
        """Process single audio chunk through speech recognition."""
        if self.stt is None:
            return
        
        result = self.stt.transcribe_stream(audio_chunk)
        
        # Check for both partial and final results
        partial_text = result.get("partial", "").strip()
        final_text = result.get("final", "").strip()
        
        # If we got a final result, use it (Vosk resets after final)
        if final_text:
            self._speech_buffer.append(final_text)
            self._last_speech_time = time.time()
            logger.info(f"Speech fragment: {final_text}")
            
            # Send to frontend via data channel
            await self._send_data_message({"type": "stt_final", "text": final_text})
            
            # Reset silence timer - wait for more speech
            if self._silence_task:
                self._silence_task.cancel()
            self._silence_task = asyncio.create_task(self._wait_for_silence())
        
        # Also track partial results for live updates (but don't log to reduce spam)
        elif partial_text:
            self._last_speech_time = time.time()
            # Only send to frontend, don't log every partial
            
            # Send partial to frontend
            await self._send_data_message({"type": "stt_partial", "text": partial_text})
            
            # Reset silence timer
            if self._silence_task:
                self._silence_task.cancel()
            self._silence_task = asyncio.create_task(self._wait_for_silence())
    
    async def _wait_for_silence(self) -> None:
        """Wait for silence threshold before finalizing speech."""
        try:
            await asyncio.sleep(self._vad_silence_threshold)
            # Silence threshold reached - finalize buffered speech
            if self._speech_buffer:
                full_text = " ".join(self._speech_buffer).strip()
                self._speech_buffer.clear()
                if full_text:
                    await self._on_speech_detected(full_text)
        except asyncio.CancelledError:
            # New speech detected, timer cancelled
            pass

    async def _on_speech_detected(self, text: str) -> None:
        """Triggered when user finishes speaking (VAD detected end)."""
        logger.info(f"User said: {text}")
        
        # Send user speech to frontend
        await self._send_data_message({"type": "user_speech", "text": text})
        
        self.transcript.append(TranscriptEntry(speaker="User", text=text))
        self.conversation_history.append({"speaker": "User", "text": text})
        
        # Debug mode: skip LLM, just echo what was heard
        if self.agent_config.debug_mode:
            logger.info(f"[DEBUG MODE] Skipping LLM, heard: {text}")
            await self._send_data_message({
                "type": "agent_response", 
                "text": f"[DEBUG] I heard: {text}"
            })
            return
        
        if self.is_speaking:
            await self._interrupt_speech()
        
        await self._generate_and_speak(text)

    async def _interrupt_speech(self) -> None:
        """Handle user interruption during agent speech."""
        logger.debug("User interrupted agent")
        self.is_speaking = False

    async def _generate_and_speak(self, user_text: str) -> None:
        """LLM generates response, TTS synthesizes, stream to room."""
        if self.llm_service is None or self.tts is None:
            return
        
        self.is_speaking = True
        
        try:
            response = await self.llm_service.generate_response(
                user_text, 
                self.conversation_history
            )
            
            logger.info(f"Agent response: {response}")
            
            self.transcript.append(TranscriptEntry(speaker="Agent", text=response))
            self.conversation_history.append({"speaker": "Agent", "text": response})
            
            async for audio_chunk in self.tts.synthesize_stream(response):
                if not self.is_speaking or not self.is_active:
                    break
                
                if self.audio_source is not None:
                    await self._send_audio_to_room(audio_chunk)
                    
        except Exception as e:
            logger.error(f"Error generating response: {e}")
        finally:
            self.is_speaking = False

    async def _send_audio_to_room(self, audio_bytes: bytes) -> None:
        """Send synthesized audio to LiveKit room."""
        if self.audio_source is None:
            return
        
        try:
            import numpy as np
            import io
            import soundfile as sf
            
            # Read WAV data properly using soundfile
            buffer = io.BytesIO(audio_bytes)
            audio_data, sample_rate = sf.read(buffer, dtype='int16')
            
            # Convert to mono if stereo
            if len(audio_data.shape) > 1:
                audio_data = audio_data[:, 0]
            
            # Ensure it's int16
            audio_array = audio_data.astype(np.int16)
            
            # Split into smaller chunks for smoother streaming (20ms chunks)
            chunk_samples = int(sample_rate * 0.02)  # 20ms chunks
            
            for i in range(0, len(audio_array), chunk_samples):
                if not self.is_speaking or not self.is_active:
                    break
                    
                chunk = audio_array[i:i + chunk_samples]
                
                frame = rtc.AudioFrame(
                    data=chunk.tobytes(),
                    sample_rate=sample_rate,
                    num_channels=1,
                    samples_per_channel=len(chunk)
                )
                
                try:
                    await self.audio_source.capture_frame(frame)
                    # Small delay to prevent overwhelming the buffer
                    await asyncio.sleep(0.015)
                except Exception as frame_error:
                    logger.warning(f"Error capturing frame: {frame_error}")
                
        except Exception as e:
            logger.error(f"Error sending audio: {e}")

    def _on_disconnected(self) -> None:
        """Cleanup and log when disconnected from room."""
        logger.info("Voice agent disconnected from room")
        self.is_active = False
        self._cleanup()

    async def stop(self) -> str:
        """Gracefully stop agent and return transcript."""
        logger.info("Stopping voice agent")
        self.is_active = False
        
        if self.room is not None:
            await self.room.disconnect()
        
        self._cleanup()
        
        return self.get_transcript()

    def _cleanup(self) -> None:
        """Release resources and reset state."""
        if self.stt is not None:
            self.stt.reset()
        
        self.room = None
        self.audio_source = None

    def get_transcript(self) -> str:
        """Return full conversation text as formatted string."""
        lines = []
        for entry in self.transcript:
            timestamp = entry.timestamp.strftime("%H:%M:%S")
            lines.append(f"[{timestamp}] {entry.speaker}: {entry.text}")
        return "\n".join(lines)

    def get_transcript_json(self) -> list[dict]:
        """Return transcript as list of dictionaries."""
        return [
            {
                "speaker": entry.speaker,
                "text": entry.text,
                "timestamp": entry.timestamp.isoformat()
            }
            for entry in self.transcript
        ]

    def get_duration(self) -> int:
        """Return session duration in seconds."""
        if self.start_time is None:
            return 0
        return int(time.time() - self.start_time)

    def get_status(self) -> dict:
        """Return current agent status."""
        return {
            "active": self.is_active,
            "speaking": self.is_speaking,
            "duration_seconds": self.get_duration(),
            "transcript_entries": len(self.transcript)
        }


async def entrypoint(ctx: JobContext) -> None:
    """LiveKit agent entrypoint for worker deployment."""
    config = load_config()
    
    agent_config = AgentConfig(
        agent_name=ctx.job.agent_name or "Assistant",
        agent_knowledge="",
        room_name=ctx.room.name
    )
    
    voice_agent = VoiceAgent(config, agent_config)
    
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    logger.info(f"Agent connected to room: {ctx.room.name}")
    
    async def process_participant(participant: rtc.RemoteParticipant) -> None:
        """Process audio from a participant."""
        for publication in participant.track_publications.values():
            if publication.track and publication.track.kind == rtc.TrackKind.KIND_AUDIO:
                asyncio.create_task(voice_agent._process_audio_track(publication.track))

    for participant in ctx.room.remote_participants.values():
        await process_participant(participant)

    @ctx.room.on("track_subscribed")
    def on_track_subscribed(
        track: rtc.Track,
        publication: rtc.RemoteTrackPublication,
        participant: rtc.RemoteParticipant
    ) -> None:
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            asyncio.create_task(voice_agent._process_audio_track(track))


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
