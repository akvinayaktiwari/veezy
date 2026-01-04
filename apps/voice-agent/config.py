"""Configuration loader for voice agent microservice."""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Config(BaseSettings):
    """Configuration settings loaded from environment variables."""
    
    livekit_url: str = Field(
        default="wss://localhost:7880",
        alias="LIVEKIT_URL",
        description="LiveKit server WebSocket URL"
    )
    livekit_api_key: str = Field(
        alias="LIVEKIT_API_KEY",
        description="LiveKit API key"
    )
    livekit_api_secret: str = Field(
        alias="LIVEKIT_API_SECRET",
        description="LiveKit API secret"
    )
    gemini_api_key: str = Field(
        alias="GEMINI_API_KEY",
        description="Google Gemini API key"
    )
    gemini_model: str = Field(
        default="gemini-1.5-flash",
        alias="GEMINI_MODEL",
        description="Gemini model name"
    )
    vosk_model_path: str = Field(
        default="models/vosk-model-small-en-in-0.4",
        alias="VOSK_MODEL_PATH",
        description="Path to Vosk model directory"
    )
    tts_model: str = Field(
        default="tts_models/en/ljspeech/tacotron2-DDC",
        alias="TTS_MODEL",
        description="Coqui TTS model name"
    )
    port: int = Field(
        default=8000,
        alias="PORT",
        description="Server port"
    )
    log_level: str = Field(
        default="INFO",
        alias="LOG_LEVEL",
        description="Logging level"
    )
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:4000",
        alias="CORS_ORIGINS",
        description="Comma-separated CORS allowed origins"
    )

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore"
    }

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level is a valid Python logging level."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"Invalid log level: {v}. Must be one of {valid_levels}")
        return v.upper()

    def get_cors_origins_list(self) -> list[str]:
        """Return CORS origins as a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


def load_config() -> Config:
    """Load and validate configuration from environment."""
    return Config()  # type: ignore


def validate_config(config: Config) -> bool:
    """Check that all required configuration is present and valid."""
    required_fields = [
        "livekit_api_key",
        "livekit_api_secret", 
        "gemini_api_key"
    ]
    
    for field in required_fields:
        value = getattr(config, field, None)
        if not value or value.strip() == "":
            raise ValueError(f"Required configuration missing: {field}")
    
    return True
