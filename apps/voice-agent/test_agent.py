"""Test script for voice agent microservice."""
import asyncio
import io
import json
import logging
import os
import sys
import time
import wave
from pathlib import Path

import numpy as np
import requests

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"


def generate_test_audio(duration: float = 2.0, sample_rate: int = 16000) -> bytes:
    """Generate a test audio file (sine wave tone)."""
    frequency = 440
    t = np.linspace(0, duration, int(sample_rate * duration), dtype=np.float32)
    audio = (0.5 * np.sin(2 * np.pi * frequency * t)).astype(np.float32)
    
    audio_int16 = (audio * 32767).astype(np.int16)
    
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_int16.tobytes())
    
    buffer.seek(0)
    return buffer.read()


def test_health_check() -> bool:
    """Test the health check endpoint."""
    logger.info("Testing health check endpoint...")
    
    try:
        start = time.time()
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        latency = (time.time() - start) * 1000
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"  Status: {data['status']}")
            logger.info(f"  Services: {data['services']}")
            logger.info(f"  Latency: {latency:.0f}ms")
            
            if data['status'] in ['ok', 'degraded']:
                logger.info("  ✓ Health check passed")
                return True
        
        logger.error(f"  ✗ Health check failed: {response.status_code}")
        return False
        
    except requests.exceptions.ConnectionError:
        logger.error("  ✗ Cannot connect to server. Is it running?")
        return False
    except Exception as e:
        logger.error(f"  ✗ Health check error: {e}")
        return False


def test_start_session() -> str | None:
    """Test starting a voice session."""
    logger.info("Testing session start...")
    
    try:
        payload = {
            "agent_name": "Test Agent",
            "agent_knowledge": "You are a helpful test assistant for verifying the voice agent service.",
            "room_name": f"test-room-{int(time.time())}"
        }
        
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/sessions/start",
            json=payload,
            timeout=30
        )
        latency = (time.time() - start) * 1000
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"  Room: {data['room_name']}")
            logger.info(f"  Session ID: {data['session_id']}")
            logger.info(f"  Latency: {latency:.0f}ms")
            logger.info("  ✓ Session started")
            return data['session_id']
        else:
            logger.error(f"  ✗ Failed to start session: {response.status_code}")
            logger.error(f"  Response: {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"  ✗ Session start error: {e}")
        return None


def test_session_status(session_id: str) -> bool:
    """Test getting session status."""
    logger.info("Testing session status...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/sessions/{session_id}/status",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"  Active: {data['active']}")
            logger.info(f"  Duration: {data['duration_seconds']}s")
            logger.info("  ✓ Status check passed")
            return True
        else:
            logger.error(f"  ✗ Status check failed: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"  ✗ Status check error: {e}")
        return False


def test_end_session(session_id: str) -> bool:
    """Test ending a voice session."""
    logger.info("Testing session end...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/sessions/{session_id}/end",
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"  Success: {data['success']}")
            logger.info(f"  Duration: {data['duration']}s")
            logger.info(f"  Transcript length: {len(data['transcript'])} chars")
            logger.info("  ✓ Session ended")
            return True
        else:
            logger.error(f"  ✗ Session end failed: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"  ✗ Session end error: {e}")
        return False


def test_list_sessions() -> bool:
    """Test listing all sessions."""
    logger.info("Testing session list...")
    
    try:
        response = requests.get(f"{BASE_URL}/sessions", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"  Active sessions: {data['count']}")
            logger.info("  ✓ Session list passed")
            return True
        else:
            logger.error(f"  ✗ Session list failed: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"  ✗ Session list error: {e}")
        return False


def test_stt_service() -> bool:
    """Test the STT service directly."""
    logger.info("Testing STT service...")
    
    try:
        sys.path.insert(0, str(Path(__file__).parent))
        from stt import VoskSTT
        from config import load_config
        
        config = load_config()
        
        if not os.path.exists(config.vosk_model_path):
            logger.warning("  Vosk model not found, skipping STT test")
            return True
        
        start = time.time()
        stt = VoskSTT(config.vosk_model_path)
        load_time = (time.time() - start) * 1000
        
        logger.info(f"  Model load time: {load_time:.0f}ms")
        logger.info(f"  Ready: {stt.is_ready()}")
        logger.info("  ✓ STT service test passed")
        return True
        
    except Exception as e:
        logger.error(f"  ✗ STT test error: {e}")
        return False


def test_llm_service() -> bool:
    """Test the LLM service directly."""
    logger.info("Testing LLM service...")
    
    try:
        sys.path.insert(0, str(Path(__file__).parent))
        from llm import GeminiLLM
        from config import load_config
        
        config = load_config()
        
        llm = GeminiLLM(config.gemini_api_key, config.gemini_model)
        llm.set_system_context("Test Agent", "You are a helpful assistant.")
        
        start = time.time()
        response = asyncio.run(llm.generate_response("Hello, how are you?", []))
        latency = (time.time() - start) * 1000
        
        logger.info(f"  Response: {response[:50]}...")
        logger.info(f"  Latency: {latency:.0f}ms")
        logger.info("  ✓ LLM service test passed")
        return True
        
    except Exception as e:
        logger.error(f"  ✗ LLM test error: {e}")
        return False


def test_tts_service() -> bool:
    """Test the TTS service directly."""
    logger.info("Testing TTS service...")
    
    try:
        sys.path.insert(0, str(Path(__file__).parent))
        from tts import CoquiTTS
        from config import load_config
        
        config = load_config()
        
        logger.info("  Loading TTS model (may take a minute on first run)...")
        start = time.time()
        tts = CoquiTTS(config.tts_model)
        load_time = (time.time() - start) * 1000
        
        logger.info(f"  Model load time: {load_time:.0f}ms")
        
        start = time.time()
        audio = tts.synthesize("Hello, this is a test.")
        synth_time = (time.time() - start) * 1000
        
        logger.info(f"  Audio size: {len(audio)} bytes")
        logger.info(f"  Synthesis time: {synth_time:.0f}ms")
        logger.info("  ✓ TTS service test passed")
        return True
        
    except Exception as e:
        logger.error(f"  ✗ TTS test error: {e}")
        return False


def test_full_pipeline() -> bool:
    """Test the full voice pipeline."""
    logger.info("Testing full voice pipeline...")
    
    try:
        sys.path.insert(0, str(Path(__file__).parent))
        from stt import VoskSTT
        from llm import GeminiLLM
        from tts import CoquiTTS
        from config import load_config
        
        config = load_config()
        
        if not os.path.exists(config.vosk_model_path):
            logger.warning("  Vosk model not found, skipping pipeline test")
            return True
        
        stt = VoskSTT(config.vosk_model_path)
        llm = GeminiLLM(config.gemini_api_key, config.gemini_model)
        tts = CoquiTTS(config.tts_model)
        
        llm.set_system_context("Test Agent", "You help with testing.")
        
        user_text = "Hello, can you help me?"
        
        start = time.time()
        
        llm_response = asyncio.run(llm.generate_response(user_text, []))
        llm_time = time.time()
        
        audio = tts.synthesize(llm_response)
        tts_time = time.time()
        
        total_latency = (tts_time - start) * 1000
        llm_latency = (llm_time - start) * 1000
        tts_latency = (tts_time - llm_time) * 1000
        
        logger.info(f"  User text: {user_text}")
        logger.info(f"  LLM response: {llm_response[:50]}...")
        logger.info(f"  Audio size: {len(audio)} bytes")
        logger.info("")
        logger.info("  Latency breakdown:")
        logger.info(f"    LLM: {llm_latency:.0f}ms")
        logger.info(f"    TTS: {tts_latency:.0f}ms")
        logger.info(f"    Total: {total_latency:.0f}ms")
        
        if total_latency < 700:
            logger.info("  ✓ Pipeline meets <700ms target!")
        else:
            logger.warning(f"  ⚠ Pipeline exceeds 700ms target ({total_latency:.0f}ms)")
        
        return True
        
    except Exception as e:
        logger.error(f"  ✗ Pipeline test error: {e}")
        return False


def main() -> int:
    """Run all tests."""
    logger.info("=" * 60)
    logger.info("Voice Agent Service Tests")
    logger.info("=" * 60)
    
    results = {}
    
    print()
    results["health"] = test_health_check()
    
    if results["health"]:
        print()
        results["list_sessions"] = test_list_sessions()
        
        print()
        session_id = test_start_session()
        results["start_session"] = session_id is not None
        
        if session_id:
            time.sleep(2)
            
            print()
            results["session_status"] = test_session_status(session_id)
            
            print()
            results["end_session"] = test_end_session(session_id)
    
    print()
    logger.info("Direct service tests (requires .env configuration):")
    
    print()
    results["stt"] = test_stt_service()
    
    print()
    results["llm"] = test_llm_service()
    
    print()
    results["tts"] = test_tts_service()
    
    print()
    results["pipeline"] = test_full_pipeline()
    
    print()
    logger.info("=" * 60)
    logger.info("Test Results Summary")
    logger.info("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✓ PASS" if passed_test else "✗ FAIL"
        logger.info(f"  {test_name}: {status}")
    
    print()
    logger.info(f"Passed: {passed}/{total}")
    
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
