"""Faster-Whisper speech-to-text service with streaming support."""
import io
import logging
import wave
from typing import Optional

import numpy as np
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)


class FasterWhisperSTT:
    """Streaming speech-to-text using Faster-Whisper (OpenAI Whisper optimized)."""

    def __init__(self, model_size: str = "base", device: str = "cpu", compute_type: str = "int8"):
        """
        Initialize Faster-Whisper model.
        
        Args:
            model_size: Model size (tiny, base, small, medium, large-v2, large-v3)
                       - tiny: Fastest, least accurate (~1GB RAM)
                       - base: Good balance (~1GB RAM) - RECOMMENDED
                       - small: Better accuracy (~2GB RAM)
                       - medium: High accuracy (~5GB RAM)
                       - large-v3: Best accuracy (~10GB RAM)
            device: "cpu" or "cuda" (GPU)
            compute_type: "int8" (faster, less memory) or "float16" (more accurate, needs GPU)
        """
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type if device == "cuda" else "int8"
        self.sample_rate = 16000
        self.model: Optional[WhisperModel] = None
        
        self._load_model()

    def _load_model(self) -> None:
        """Load the Faster-Whisper model."""
        logger.info(f"Loading Faster-Whisper model: {self.model_size} on {self.device}")
        
        try:
            self.model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type,
                download_root="models/whisper"
            )
            logger.info(f"Faster-Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Faster-Whisper model: {e}")
            raise

    def transcribe_stream(self, audio_chunk: bytes) -> dict:
        """
        Transcribe audio chunk to text.
        
        Args:
            audio_chunk: Raw audio bytes (16kHz, 16-bit PCM, mono)
            
        Returns:
            Dict with 'final' text (Whisper doesn't provide partials)
        """
        if self.model is None:
            return {"partial": "", "final": ""}

        try:
            # Convert bytes to numpy array (16-bit PCM)
            audio_np = np.frombuffer(audio_chunk, dtype=np.int16)
            
            # Convert to float32 in range [-1.0, 1.0]
            audio_float = audio_np.astype(np.float32) / 32768.0
            
            # Transcribe with Faster-Whisper
            segments, info = self.model.transcribe(
                audio_float,
                language="en",
                beam_size=1,  # Faster inference
                vad_filter=True,  # Filter silence
                vad_parameters=dict(
                    threshold=0.5,
                    min_speech_duration_ms=250,
                    min_silence_duration_ms=500
                )
            )
            
            # Collect all segments
            text = " ".join([segment.text.strip() for segment in segments])
            
            # Whisper gives complete transcriptions, not partials
            return {"partial": "", "final": text}
            
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return {"partial": "", "final": ""}

    def reset(self) -> None:
        """Reset the recognizer state (no-op for Whisper)."""
        pass
