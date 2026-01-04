"""Vosk speech-to-text service with streaming support."""
import json
import logging
import os
import zipfile
from pathlib import Path
from typing import Optional

import requests
from tqdm import tqdm
from vosk import Model, KaldiRecognizer

logger = logging.getLogger(__name__)

VOSK_MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-in-0.4.zip"
VOSK_MODEL_NAME = "vosk-model-small-en-in-0.4"


class VoskSTT:
    """Streaming speech-to-text using Vosk with Indian English model."""

    def __init__(self, model_path: str):
        """Load Vosk model from disk, raise error if not found."""
        self.model_path = Path(model_path)
        self.model: Optional[Model] = None
        self.recognizer: Optional[KaldiRecognizer] = None
        self.sample_rate = 16000
        self._load_model()

    def _load_model(self) -> None:
        """Load the Vosk model from the specified path."""
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Vosk model not found at {self.model_path}. "
                f"Run 'python setup.py' to download the model."
            )
        
        logger.info(f"Loading Vosk model from {self.model_path}")
        self.model = Model(str(self.model_path))
        self.recognizer = KaldiRecognizer(self.model, self.sample_rate)
        self.recognizer.SetWords(True)
        logger.info("Vosk model loaded successfully")

    @staticmethod
    def initialize(model_path: str = f"models/{VOSK_MODEL_NAME}") -> None:
        """Download model if not present from alphacep servers."""
        model_dir = Path(model_path)
        
        if model_dir.exists():
            logger.info(f"Vosk model already exists at {model_dir}")
            return
        
        models_dir = model_dir.parent
        models_dir.mkdir(parents=True, exist_ok=True)
        
        zip_path = models_dir / f"{VOSK_MODEL_NAME}.zip"
        
        logger.info(f"Downloading Vosk model from {VOSK_MODEL_URL}")
        response = requests.get(VOSK_MODEL_URL, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get("content-length", 0))
        
        with open(zip_path, "wb") as f:
            with tqdm(total=total_size, unit="B", unit_scale=True, desc="Downloading") as pbar:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    pbar.update(len(chunk))
        
        logger.info("Extracting model archive")
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(models_dir)
        
        zip_path.unlink()
        logger.info(f"Vosk model ready at {model_dir}")

    def transcribe_stream(self, audio_chunk: bytes) -> dict:
        """Process audio chunk, return partial/final text."""
        if self.recognizer is None:
            raise RuntimeError("Recognizer not initialized")
        
        result = {"partial": "", "final": ""}
        
        try:
            if self.recognizer.AcceptWaveform(audio_chunk):
                final_result = json.loads(self.recognizer.Result())
                result["final"] = final_result.get("text", "")
            else:
                partial_result = json.loads(self.recognizer.PartialResult())
                result["partial"] = partial_result.get("partial", "")
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
        
        return result

    def get_final_result(self) -> str:
        """Get final transcription result after processing all audio."""
        if self.recognizer is None:
            return ""
        
        final_result = json.loads(self.recognizer.FinalResult())
        return final_result.get("text", "")

    def reset(self) -> None:
        """Reset recognizer state for new conversation."""
        if self.model is not None:
            self.recognizer = KaldiRecognizer(self.model, self.sample_rate)
            self.recognizer.SetWords(True)
            logger.debug("Recognizer state reset")

    def is_ready(self) -> bool:
        """Check if the STT service is ready."""
        return self.model is not None and self.recognizer is not None
