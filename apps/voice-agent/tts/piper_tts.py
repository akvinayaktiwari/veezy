"""Piper TTS service - Fast, high-quality text-to-speech synthesis."""
import io
import logging
import wave
from pathlib import Path
from typing import Optional

import numpy as np
from piper import PiperVoice

logger = logging.getLogger(__name__)


class PiperTTS:
    """Text-to-speech using Piper (ONNX-based, very fast)."""

    def __init__(self, model_path: str):
        """
        Initialize Piper TTS with specified model.
        
        Args:
            model_path: Path to Piper .onnx model file
        """
        self.model_path = Path(model_path)
        self.config_path = self.model_path.with_suffix('.onnx.json')
        self.voice: Optional[PiperVoice] = None
        self.sample_rate = 22050  # Piper default sample rate
        
        self._load_model()

    def _load_model(self) -> None:
        """Load the Piper voice model."""
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Piper model not found at {self.model_path}. "
                f"Please download from https://github.com/rhasspy/piper"
            )
        
        if not self.config_path.exists():
            raise FileNotFoundError(
                f"Piper config not found at {self.config_path}. "
                f"Please download the .onnx.json file alongside the model."
            )
        
        logger.info(f"Loading Piper model from {self.model_path}")
        
        try:
            self.voice = PiperVoice.load(str(self.model_path), str(self.config_path))
            logger.info("Piper TTS model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Piper model: {e}")
            raise

    def synthesize(self, text: str) -> bytes:
        """
        Convert text to speech audio bytes.
        
        Args:
            text: Text to synthesize
            
        Returns:
            WAV audio bytes (22050 Hz, mono, PCM16)
        """
        if not self.voice:
            raise RuntimeError("Piper voice not loaded")
        
        if not text or not text.strip():
            return self._generate_silence(100)
        
        try:
            # Synthesize with Piper (returns generator of AudioChunk objects)
            audio_bytes = b''
            
            # Each AudioChunk has audio_int16_bytes property for raw PCM data
            for audio_chunk in self.voice.synthesize(text):
                audio_bytes += audio_chunk.audio_int16_bytes
            
            if not audio_bytes:
                logger.warning("No audio generated, returning silence")
                return self._generate_silence(100)
            
            # Convert raw PCM to WAV format
            wav_buffer = io.BytesIO()
            with wave.open(wav_buffer, 'wb') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(self.sample_rate)
                wav_file.writeframes(audio_bytes)
            
            logger.info(f"Synthesized {len(audio_bytes)} bytes of audio")
            return wav_buffer.getvalue()
            
        except Exception as e:
            logger.error(f"TTS synthesis error: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return self._generate_silence(500)

    def _generate_silence(self, duration_ms: int) -> bytes:
        """Generate silent WAV audio."""
        num_samples = int(self.sample_rate * duration_ms / 1000)
        silence = b'\x00' * (num_samples * 2)  # 16-bit = 2 bytes per sample
        
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(self.sample_rate)
            wav_file.writeframes(silence)
        
        return wav_buffer.getvalue()

    async def synthesize_stream(self, text: str):
        """
        Stream synthesized audio in chunks (async generator).
        
        Args:
            text: Text to synthesize
            
        Yields:
            Audio chunks as bytes
        """
        # Piper doesn't support true streaming, so we synthesize the full audio
        # and yield it as one chunk
        audio_bytes = self.synthesize(text)
        yield audio_bytes

    @property
    def output_sample_rate(self) -> int:
        """Get the output sample rate."""
        return self.sample_rate
