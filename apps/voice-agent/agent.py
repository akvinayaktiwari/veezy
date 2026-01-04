"""LiveKit voice agent core connecting STT, LLM, and TTS pipeline."""
import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from livekit import rtc
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli

from config import Config, load_config
from stt import VoskSTT
from llm import GeminiLLM
from tts import CoquiTTS

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


class VoiceAgent:
    """Core voice agent connecting STT, LLM, and TTS in LiveKit pipeline."""

    def __init__(self, config: Config, agent_config: AgentConfig):
        """Initialize voice agent with configuration and services."""
        self.config = config
        self.agent_config = agent_config
        self.session_id = str(uuid.uuid4())
        
        self.stt: Optional[VoskSTT] = None
        self.llm_service: Optional[GeminiLLM] = None
        self.tts: Optional[CoquiTTS] = None
        
        self.transcript: list[TranscriptEntry] = []
        self.conversation_history: list[dict] = []
        
        self.room: Optional[rtc.Room] = None
        self.audio_source: Optional[rtc.AudioSource] = None
        self.start_time: Optional[float] = None
        self.is_active = False
        self.is_speaking = False
        
        self._pending_audio: bytes = b""
        self._vad_silence_threshold = 0.5
        self._last_speech_time: Optional[float] = None
        
        self._initialize_services()

    def _initialize_services(self) -> None:
        """Load and initialize STT, LLM, and TTS services."""
        logger.info("Initializing voice agent services")
        
        self.stt = VoskSTT(self.config.vosk_model_path)
        
        self.llm_service = GeminiLLM(
            api_key=self.config.gemini_api_key,
            model=self.config.gemini_model
        )
        self.llm_service.set_system_context(
            agent_name=self.agent_config.agent_name,
            agent_knowledge=self.agent_config.agent_knowledge
        )
        
        self.tts = CoquiTTS(model_name=self.config.tts_model)
        
        logger.info("Voice agent services initialized")

    async def start(self, room_name: str, participant_token: str) -> None:
        """Connect to LiveKit room and start processing."""
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
            
            self.audio_source = rtc.AudioSource(16000, 1)
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
        audio_stream = rtc.AudioStream(track)
        
        async for event in audio_stream:
            if not self.is_active:
                break
            
            audio_bytes = event.frame.data.tobytes()
            await self._process_audio_chunk(audio_bytes)

    async def _process_audio_chunk(self, audio_chunk: bytes) -> None:
        """Process single audio chunk through speech recognition."""
        if self.stt is None:
            return
        
        result = self.stt.transcribe_stream(audio_chunk)
        
        if result.get("final"):
            text = result["final"].strip()
            if text:
                await self._on_speech_detected(text)
        elif result.get("partial"):
            self._last_speech_time = time.time()

    async def _on_speech_detected(self, text: str) -> None:
        """Triggered when user finishes speaking (VAD detected end)."""
        logger.info(f"User said: {text}")
        
        self.transcript.append(TranscriptEntry(speaker="User", text=text))
        self.conversation_history.append({"speaker": "User", "text": text})
        
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
            audio_array = np.frombuffer(audio_bytes[44:], dtype=np.int16)
            
            frame = rtc.AudioFrame(
                data=audio_array.tobytes(),
                sample_rate=16000,
                num_channels=1,
                samples_per_channel=len(audio_array)
            )
            
            await self.audio_source.capture_frame(frame)
            
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
