"""FastAPI REST server for voice agent microservice."""
import asyncio
import logging
import os
import sys
import time
import uuid
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from livekit import api

from config import Config, load_config, validate_config
from agent import VoiceAgent, AgentConfig
from stt import VoskSTT
from llm import GeminiLLM
from tts import CoquiTTS

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

config: Optional[Config] = None
active_sessions: dict[str, VoiceAgent] = {}
services_status = {"stt": False, "llm": False, "tts": False}


class StartSessionRequest(BaseModel):
    """Request body for starting a voice session."""
    agent_name: str = Field(default="Assistant", description="Name of the AI agent")
    agent_knowledge: str = Field(default="", description="Agent knowledge/context")
    room_name: Optional[str] = Field(default=None, description="LiveKit room name")


class StartSessionResponse(BaseModel):
    """Response after starting a voice session."""
    room_name: str
    participant_token: str
    agent_token: str
    session_id: str


class SessionStatusResponse(BaseModel):
    """Response with session status information."""
    active: bool
    duration_seconds: int
    partial_transcript: str


class EndSessionResponse(BaseModel):
    """Response after ending a voice session."""
    success: bool
    transcript: str
    duration: int


class RejoinTokenResponse(BaseModel):
    """Response for rejoin token request."""
    participant_token: str
    room_name: str
    session_id: str


class HealthResponse(BaseModel):
    """Response for health check endpoint."""
    status: str
    services: dict[str, bool]


def generate_livekit_token(
    room_name: str, 
    participant_identity: str, 
    is_agent: bool = False
) -> str:
    """Generate LiveKit access token for participant."""
    if config is None:
        raise RuntimeError("Configuration not loaded")
    
    token = api.AccessToken(
        config.livekit_api_key,
        config.livekit_api_secret
    )
    
    token.with_identity(participant_identity)
    token.with_name(participant_identity)
    
    grants = api.VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=True,
        can_subscribe=True,
        can_publish_data=True
    )
    
    if is_agent:
        grants.agent = True
    
    token.with_grants(grants)
    
    return token.to_jwt()


def check_services() -> dict[str, bool]:
    """Verify all services are operational."""
    global services_status
    
    if config is None:
        return {"stt": False, "llm": False, "tts": False}
    
    try:
        stt_check = os.path.exists(config.vosk_model_path)
        services_status["stt"] = stt_check
    except Exception:
        services_status["stt"] = False
    
    try:
        services_status["llm"] = bool(config.gemini_api_key)
    except Exception:
        services_status["llm"] = False
    
    try:
        services_status["tts"] = True
    except Exception:
        services_status["tts"] = False
    
    return services_status


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    global config
    
    logger.info("Starting Voice Agent Service")
    
    try:
        config = load_config()
        validate_config(config)
        logger.info("Configuration loaded successfully")
    except Exception as e:
        logger.error(f"Configuration error: {e}")
        sys.exit(1)
    
    log_level = getattr(logging, config.log_level, logging.INFO)
    logging.getLogger().setLevel(log_level)
    
    if not os.path.exists(config.vosk_model_path):
        logger.warning(f"Vosk model not found at {config.vosk_model_path}")
        logger.info("Run 'python setup.py' to download the model")
    
    check_services()
    logger.info(f"Services status: {services_status}")
    
    yield
    
    logger.info("Shutting down Voice Agent Service")
    
    for session_id, agent in list(active_sessions.items()):
        try:
            await agent.stop()
        except Exception as e:
            logger.error(f"Error stopping session {session_id}: {e}")
    
    active_sessions.clear()


app = FastAPI(
    title="Voice Agent Service",
    description="Real-time voice agent microservice using LiveKit, Vosk, Gemini, and Coqui TTS",
    version="1.0.0",
    lifespan=lifespan
)


@app.post("/sessions/start", response_model=StartSessionResponse)
async def start_session(request: StartSessionRequest) -> StartSessionResponse:
    """Create LiveKit room, spawn VoiceAgent, return room token."""
    if config is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service not initialized"
        )
    
    if not services_status.get("stt"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="STT service unavailable. Run 'python setup.py' to download models."
        )
    
    room_name = request.room_name or f"voice-session-{uuid.uuid4().hex[:8]}"
    session_id = str(uuid.uuid4())
    
    try:
        participant_token = generate_livekit_token(
            room_name=room_name,
            participant_identity=f"user-{uuid.uuid4().hex[:8]}",
            is_agent=False
        )
        
        agent_token = generate_livekit_token(
            room_name=room_name,
            participant_identity=f"agent-{session_id[:8]}",
            is_agent=True
        )
        
        agent_config = AgentConfig(
            agent_name=request.agent_name,
            agent_knowledge=request.agent_knowledge,
            room_name=room_name,
            debug_mode=(request.agent_knowledge == "__DEBUG_MODE__")  # Enable debug mode for testing
        )
        
        if agent_config.debug_mode:
            logger.info(f"Starting session in DEBUG MODE (no LLM calls)")
        
        voice_agent = VoiceAgent(config, agent_config)
        
        asyncio.create_task(voice_agent.start(room_name, agent_token))
        
        active_sessions[session_id] = voice_agent
        
        logger.info(f"Session started: {session_id} in room {room_name}")
        
        return StartSessionResponse(
            room_name=room_name,
            participant_token=participant_token,
            agent_token=agent_token,
            session_id=session_id
        )
        
    except Exception as e:
        logger.error(f"Failed to start session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start session: {str(e)}"
        )


@app.get("/sessions/{session_id}/status", response_model=SessionStatusResponse)
async def get_session_status(session_id: str) -> SessionStatusResponse:
    """Get current status of a voice session."""
    if session_id not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session not found: {session_id}"
        )
    
    agent = active_sessions[session_id]
    status_info = agent.get_status()
    
    transcript_entries = agent.get_transcript_json()
    recent_text = ""
    if transcript_entries:
        recent = transcript_entries[-3:]
        recent_text = " | ".join([f"{e['speaker']}: {e['text']}" for e in recent])
    
    return SessionStatusResponse(
        active=status_info["active"],
        duration_seconds=status_info["duration_seconds"],
        partial_transcript=recent_text
    )


@app.post("/sessions/{session_id}/end", response_model=EndSessionResponse)
async def end_session(session_id: str) -> EndSessionResponse:
    """Gracefully stop agent, return final transcript."""
    if session_id not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session not found: {session_id}"
        )
    
    agent = active_sessions[session_id]
    
    try:
        transcript = await agent.stop()
        duration = agent.get_duration()
        
        del active_sessions[session_id]
        
        logger.info(f"Session ended: {session_id}")
        
        return EndSessionResponse(
            success=True,
            transcript=transcript,
            duration=duration
        )
        
    except Exception as e:
        logger.error(f"Error ending session {session_id}: {e}")
        
        if session_id in active_sessions:
            del active_sessions[session_id]
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error ending session: {str(e)}"
        )


@app.get("/sessions/{session_id}/rejoin-token", response_model=RejoinTokenResponse)
async def get_rejoin_token(session_id: str) -> RejoinTokenResponse:
    """Get a new participant token to rejoin an existing session."""
    if session_id not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session not found: {session_id}"
        )
    
    agent = active_sessions[session_id]
    room_name = agent.room_name
    
    # Generate new participant token
    participant_id = f"user_{uuid.uuid4().hex[:8]}"
    participant_token = generate_livekit_token(room_name, participant_id, is_agent=False)
    
    logger.info(f"Generated rejoin token for session {session_id}, room {room_name}")
    
    return RejoinTokenResponse(
        participant_token=participant_token,
        room_name=room_name,
        session_id=session_id
    )


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Check health of all services."""
    current_status = check_services()
    
    all_healthy = all(current_status.values())
    
    return HealthResponse(
        status="ok" if all_healthy else "degraded",
        services=current_status
    )


@app.get("/sessions")
async def list_sessions() -> dict:
    """List all active sessions."""
    sessions = []
    for session_id, agent in active_sessions.items():
        status_info = agent.get_status()
        sessions.append({
            "session_id": session_id,
            "room_name": agent.agent_config.room_name,
            "agent_name": agent.agent_config.agent_name,
            "active": status_info["active"],
            "duration_seconds": status_info["duration_seconds"]
        })
    
    return {"sessions": sessions, "count": len(sessions)}


# ============================================================================
# STT Test Page
# ============================================================================

@app.get("/test")
async def serve_test_page():
    """Serve the STT test page."""
    test_html_path = os.path.join(os.path.dirname(__file__), "static", "test.html")
    if os.path.exists(test_html_path):
        return FileResponse(test_html_path, media_type="text/html")
    return {"error": "Test page not found"}


def setup_cors(app: FastAPI, config: Config) -> None:
    """Configure CORS middleware."""
    origins = config.get_cors_origins_list()
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


if __name__ == "__main__":
    import uvicorn
    
    temp_config = load_config()
    setup_cors(app, temp_config)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=temp_config.port,
        reload=True,
        log_level=temp_config.log_level.lower()
    )
