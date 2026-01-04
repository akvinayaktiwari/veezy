"""Coqui TTS service for text-to-speech synthesis."""
import asyncio
import io
import logging
import re
from typing import AsyncGenerator, Optional

import numpy as np
import soundfile as sf

# Try to import TTS, fall back to mock if import fails
try:
    from TTS.api import TTS  # type: ignore
    TTS_AVAILABLE = True
except Exception as e:
    logging.warning(f"Coqui TTS import failed: {e}. Using mock TTS.")
    TTS_AVAILABLE = False
    TTS = None

logger = logging.getLogger(__name__)


class CoquiTTS:
    """Streaming text-to-speech using Coqui TTS."""

    def __init__(self, model_name: str = "tts_models/en/ljspeech/tacotron2-DDC"):
        """Load TTS model."""
        self.model_name = model_name
        self.tts: Optional[TTS] = None 
        self.sample_rate = 22050
        self.output_sample_rate = 16000
        if TTS_AVAILABLE:
            self._load_model()
        else:
            logger.warning("Running in mock TTS mode - no audio synthesis available")

    def _load_model(self) -> None:
        """Initialize the Coqui TTS model."""
        logger.info(f"Loading Coqui TTS model: {self.model_name}")
        try:
            self.tts = TTS(model_name=self.model_name, progress_bar=True)
            logger.info("Coqui TTS model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load TTS model: {e}")
            raise

    def _resample_audio(self, audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
        """Resample audio to target sample rate."""
        if orig_sr == target_sr:
            return audio
        
        duration = len(audio) / orig_sr
        new_length = int(duration * target_sr)
        indices = np.linspace(0, len(audio) - 1, new_length)
        return np.interp(indices, np.arange(len(audio)), audio)

    def synthesize(self, text: str) -> bytes:
        """Convert text to audio WAV bytes."""
        if not TTS_AVAILABLE or self.tts is None:
            logger.debug(f"Mock TTS: Would synthesize: {text[:50]}...")
            return self._generate_silence(1.0)
        
        if not text or not text.strip():
            return self._generate_silence(0.1)
        
        try:
            audio = self.tts.tts(text=text.strip())
            audio_array = np.array(audio, dtype=np.float32)
            
            resampled = self._resample_audio(
                audio_array, 
                self.sample_rate, 
                self.output_sample_rate
            )
            
            buffer = io.BytesIO()
            sf.write(buffer, resampled, self.output_sample_rate, format="WAV")
            buffer.seek(0)
            
            return buffer.read()
            
        except Exception as e:
            logger.error(f"TTS synthesis error: {e}")
            return self._generate_silence(0.5)

    def _generate_silence(self, duration: float) -> bytes:
        """Generate silent audio for error cases."""
        samples = int(self.output_sample_rate * duration)
        silence = np.zeros(samples, dtype=np.float32)
        
        buffer = io.BytesIO()
        sf.write(buffer, silence, self.output_sample_rate, format="WAV")
        buffer.seek(0)
        
        return buffer.read()

    def _split_into_sentences(self, text: str) -> list[str]:
        """Split text into sentences for incremental synthesis."""
        sentence_endings = r'(?<=[.!?])\s+'
        sentences = re.split(sentence_endings, text.strip())
        return [s.strip() for s in sentences if s.strip()]

    async def synthesize_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        """Async generator yielding audio chunks for streaming."""
        if not text or not text.strip():
            yield self._generate_silence(0.1)
            return
        
        sentences = self._split_into_sentences(text)
        
        if not sentences:
            sentences = [text]
        
        for sentence in sentences:
            try:
                audio_bytes = await asyncio.to_thread(self.synthesize, sentence)
                yield audio_bytes
            except Exception as e:
                logger.error(f"Error synthesizing sentence: {e}")
                yield self._generate_silence(0.2)

    def synthesize_pcm(self, text: str) -> tuple[bytes, int]:
        """Convert text to raw PCM audio bytes (no WAV header)."""
        if not TTS_AVAILABLE or self.tts is None:
            logger.debug(f"Mock TTS PCM: Would synthesize: {text[:50]}...")
            samples = int(self.output_sample_rate * 1.0)
            silence = np.zeros(samples, dtype=np.int16)
            return silence.tobytes(), self.output_sample_rate
        
        if not text or not text.strip():
            samples = int(self.output_sample_rate * 0.1)
            silence = np.zeros(samples, dtype=np.int16)
            return silence.tobytes(), self.output_sample_rate
        
        try:
            audio = self.tts.tts(text=text.strip())
            audio_array = np.array(audio, dtype=np.float32)
            
            resampled = self._resample_audio(
                audio_array,
                self.sample_rate,
                self.output_sample_rate
            )
            
            pcm_audio = (resampled * 32767).astype(np.int16)
            
            return pcm_audio.tobytes(), self.output_sample_rate
            
        except Exception as e:
            logger.error(f"PCM synthesis error: {e}")
            samples = int(self.output_sample_rate * 0.5)
            silence = np.zeros(samples, dtype=np.int16)
            return silence.tobytes(), self.output_sample_rate

    def is_ready(self) -> bool:
        """Check if the TTS service is ready."""
        return TTS_AVAILABLE and self.tts is not None

