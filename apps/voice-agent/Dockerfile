# ============================================
# PRODUCTION DOCKERFILE - Python Voice Agent
# Platform: linux/amd64 (AWS ECS Fargate)
# FastAPI + LiveKit + Vosk STT + Piper TTS
# ============================================

FROM --platform=linux/amd64 python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies for audio processing + ML models
# - libsndfile1: Audio file I/O for Vosk
# - portaudio19-dev: Real-time audio streaming
# - ffmpeg: Audio format conversion
# - curl: Health checks + model downloads
# - build-essential: Compile Python wheels if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    portaudio19-dev \
    ffmpeg \
    curl \
    wget \
    unzip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security (AWS ECS best practice)
RUN groupadd --gid 1001 veezy && \
    useradd --uid 1001 --gid veezy --shell /bin/bash --create-home veezy

# Copy requirements first (layer caching optimization)
COPY --chown=veezy:veezy apps/voice-agent/requirements.txt .

# Install Python dependencies
# Key packages: vosk, piper-tts, livekit, fastapi, uvicorn, google-generativeai
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=veezy:veezy apps/voice-agent/ .

# Create models directory structure
RUN mkdir -p models/vosk-model-small-en-us-0.4 models/piper && \
    chown -R veezy:veezy models/

# Download Vosk small English model (~40MB, optimized for real-time)
RUN wget -q https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.4.zip -O /tmp/vosk.zip && \
    unzip -q /tmp/vosk.zip -d models/ && \
    rm /tmp/vosk.zip && \
    chown -R veezy:veezy models/vosk-model-small-en-us-0.4

# Download Piper TTS voice model (en_US-lessac-medium for natural speech)
RUN wget -q https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx -O models/piper/en_US-lessac-medium.onnx && \
    wget -q https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json -O models/piper/en_US-lessac-medium.onnx.json && \
    chown -R veezy:veezy models/piper

# Switch to non-root user
USER veezy

# Expose port for FastAPI + LiveKit agent
EXPOSE 8000

# Health check for ECS/ALB
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start FastAPI server with uvicorn
# --host 0.0.0.0: Listen on all interfaces (container networking)
# --port 8000: Default voice agent port
# --workers 1: Single worker (LiveKit connection per instance)
# --log-level info: Production logging
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--log-level", "info"]
