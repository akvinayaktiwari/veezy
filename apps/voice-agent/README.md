# Voice Agent Microservice

Real-time voice agent microservice using LiveKit Agents framework with Vosk STT, Gemini Flash LLM, and Coqui TTS for sub-700ms latency conversations.

## Overview

This Python microservice handles real-time voice conversations:

- Receives audio from users via LiveKit WebRTC
- Transcribes speech using Vosk (Indian English optimized)
- Generates responses with Google Gemini Flash
- Synthesizes speech with Coqui TTS
- Streams audio back to the user

Target latency: **< 700ms** (STT: 100ms + LLM: 300ms + TTS: 200ms)

## Prerequisites

- Python 3.11 or higher
- ffmpeg (for audio processing)
- ~500MB disk space for models

### Install ffmpeg

**Windows:**

```powershell
winget install ffmpeg
# or
choco install ffmpeg
```

**macOS:**

```bash
brew install ffmpeg
```

**Linux:**

```bash
sudo apt-get install ffmpeg
```

## Installation

### 1. Create Virtual Environment

```bash
cd apps/voice-agent
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your API keys
```

Required API keys:

- **LiveKit**: Get from [livekit.io/cloud](https://livekit.io/cloud)
- **Gemini**: Get from [makersuite.google.com](https://makersuite.google.com/app/apikey)

### 4. Download Models

```bash
python setup.py
```

This downloads:

- Vosk Indian English model (~50MB)
- Coqui TTS model (downloaded on first use)

## Running the Service

### Development

```bash
python main.py
```

Server starts at `http://localhost:8000`

### Production

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
```

Note: Use single worker due to ML model memory requirements.

## API Endpoints

### Health Check

```bash
curl http://localhost:8000/health
```

Response:

```json
{
  "status": "ok",
  "services": {
    "stt": true,
    "llm": true,
    "tts": true
  }
}
```

### Start Voice Session

```bash
curl -X POST http://localhost:8000/sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "Sales Assistant",
    "agent_knowledge": "You help customers with product questions",
    "room_name": "my-room"
  }'
```

Response:

```json
{
  "room_name": "my-room",
  "participant_token": "eyJ...",
  "agent_token": "eyJ...",
  "session_id": "abc123"
}
```

### Get Session Status

```bash
curl http://localhost:8000/sessions/{session_id}/status
```

Response:

```json
{
  "active": true,
  "duration_seconds": 45,
  "partial_transcript": "User: Hello | Agent: Hi there!"
}
```

### End Session

```bash
curl -X POST http://localhost:8000/sessions/{session_id}/end
```

Response:

```json
{
  "success": true,
  "transcript": "[10:30:01] User: Hello\n[10:30:02] Agent: Hi there!",
  "duration": 120
}
```

### List Active Sessions

```bash
curl http://localhost:8000/sessions
```

## Integration with NestJS Backend

The NestJS backend can call this service to create voice sessions:

```typescript
// Example NestJS service
async startVoiceSession(agentId: string) {
  const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });

  const response = await fetch('http://localhost:8000/sessions/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_name: agent.name,
      agent_knowledge: agent.knowledge,
    }),
  });

  return response.json();
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Voice Agent Service                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ FastAPI │────│  Agent  │────│ LiveKit │────│  User   │  │
│  │  REST   │    │  Core   │    │   SDK   │    │ Browser │  │
│  └─────────┘    └────┬────┘    └─────────┘    └─────────┘  │
│                      │                                       │
│         ┌────────────┼────────────┐                         │
│         ▼            ▼            ▼                         │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐                   │
│    │  Vosk   │  │ Gemini  │  │  Coqui  │                   │
│    │   STT   │  │   LLM   │  │   TTS   │                   │
│    └─────────┘  └─────────┘  └─────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Configuration Options

| Variable           | Default                              | Description                  |
| ------------------ | ------------------------------------ | ---------------------------- |
| LIVEKIT_URL        | -                                    | LiveKit server WebSocket URL |
| LIVEKIT_API_KEY    | -                                    | LiveKit API key              |
| LIVEKIT_API_SECRET | -                                    | LiveKit API secret           |
| GEMINI_API_KEY     | -                                    | Google Gemini API key        |
| GEMINI_MODEL       | gemini-1.5-flash                     | Gemini model name            |
| VOSK_MODEL_PATH    | models/vosk-model-small-en-in-0.4    | Path to Vosk model           |
| TTS_MODEL          | tts_models/en/ljspeech/tacotron2-DDC | Coqui TTS model              |
| PORT               | 8000                                 | Server port                  |
| LOG_LEVEL          | INFO                                 | Logging level                |
| CORS_ORIGINS       | localhost:3000,4000                  | Allowed CORS origins         |

## Troubleshooting

### "Vosk model not found"

Run the setup script:

```bash
python setup.py
```

Or manually download:

```bash
cd models
curl -O https://alphacephei.com/vosk/models/vosk-model-small-en-in-0.4.zip
unzip vosk-model-small-en-in-0.4.zip
```

### "Gemini API error"

1. Check your API key is correct in `.env`
2. Verify you have quota remaining
3. Check network connectivity to Google APIs

### "TTS synthesis error"

First run downloads the model (~200MB). Wait for completion.

If model download fails:

```bash
pip uninstall TTS
pip install TTS --no-cache-dir
```

### High Latency

1. Use `gemini-1.5-flash` (not `gemini-1.5-pro`)
2. Ensure Vosk model is local (not downloading each time)
3. Check network latency to LiveKit server
4. Consider using LiveKit Cloud in your region

### Out of Memory

- Use smaller Vosk model: `vosk-model-small-en-in-0.4`
- Reduce concurrent sessions
- Increase server RAM (4GB+ recommended)

## Testing

Run the test script:

```bash
python test_agent.py
```

This tests:

- Service health check
- STT transcription
- LLM response generation
- TTS synthesis
- Full pipeline latency

## Project Structure

```
apps/voice-agent/
├── requirements.txt      # Python dependencies
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
├── README.md             # This file
├── main.py               # FastAPI REST server
├── agent.py              # LiveKit voice agent core
├── config.py             # Configuration loader
├── setup.py              # Model download script
├── test_agent.py         # Test script
├── models/               # Downloaded ML models
│   └── vosk-model-*/     # Vosk model (gitignored)
├── stt/
│   ├── __init__.py
│   └── vosk_stt.py       # Vosk STT service
├── llm/
│   ├── __init__.py
│   └── gemini_llm.py     # Gemini LLM service
└── tts/
    ├── __init__.py
    └── coqui_tts.py      # Coqui TTS service
```

## License

Part of the Veezy project.
