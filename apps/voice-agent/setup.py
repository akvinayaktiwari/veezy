"""Setup script to download required ML models on first run."""
import logging
import os
import sys
import zipfile
from pathlib import Path

import requests
from tqdm import tqdm

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

VOSK_MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-in-0.4.zip"
VOSK_MODEL_NAME = "vosk-model-small-en-in-0.4"
MODELS_DIR = Path(__file__).parent / "models"


def download_file(url: str, dest_path: Path, description: str = "Downloading") -> None:
    """Download file with progress bar."""
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    total_size = int(response.headers.get("content-length", 0))
    
    with open(dest_path, "wb") as f:
        with tqdm(
            total=total_size, 
            unit="B", 
            unit_scale=True, 
            desc=description,
            ncols=80
        ) as pbar:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                pbar.update(len(chunk))


def extract_zip(zip_path: Path, extract_to: Path) -> None:
    """Extract zip archive with progress."""
    logger.info(f"Extracting {zip_path.name}")
    
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        members = zip_ref.namelist()
        with tqdm(total=len(members), desc="Extracting", ncols=80) as pbar:
            for member in members:
                zip_ref.extract(member, extract_to)
                pbar.update(1)


def setup_vosk_model() -> bool:
    """Download and setup Vosk speech recognition model."""
    model_path = MODELS_DIR / VOSK_MODEL_NAME
    
    if model_path.exists():
        logger.info(f"✓ Vosk model already exists at {model_path}")
        return True
    
    logger.info("Setting up Vosk speech recognition model...")
    logger.info(f"Model: {VOSK_MODEL_NAME}")
    logger.info(f"Size: ~50MB")
    logger.info(f"Language: English (Indian accent optimized)")
    
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    zip_path = MODELS_DIR / f"{VOSK_MODEL_NAME}.zip"
    
    try:
        logger.info(f"Downloading from {VOSK_MODEL_URL}")
        download_file(VOSK_MODEL_URL, zip_path, "Vosk Model")
        
        extract_zip(zip_path, MODELS_DIR)
        
        zip_path.unlink()
        
        if model_path.exists():
            logger.info(f"✓ Vosk model ready at {model_path}")
            return True
        else:
            logger.error("Model extraction failed")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Download failed: {e}")
        return False
    except zipfile.BadZipFile as e:
        logger.error(f"Invalid zip file: {e}")
        if zip_path.exists():
            zip_path.unlink()
        return False
    except Exception as e:
        logger.error(f"Setup failed: {e}")
        return False


def setup_coqui_tts() -> bool:
    """Initialize Coqui TTS (downloads model on first use)."""
    logger.info("Coqui TTS model will be downloaded on first use")
    logger.info("Model: tts_models/en/ljspeech/tacotron2-DDC")
    logger.info("This happens automatically when the service starts")
    return True


def verify_dependencies() -> bool:
    """Check that required Python packages are installed."""
    logger.info("Verifying dependencies...")
    
    required_packages = [
        ("vosk", "Vosk"),
        ("google.generativeai", "google-generativeai"),
        ("TTS", "Coqui TTS"),
        ("fastapi", "FastAPI"),
        ("livekit", "LiveKit"),
    ]
    
    missing = []
    
    for module, name in required_packages:
        try:
            __import__(module)
            logger.info(f"  ✓ {name}")
        except ImportError:
            logger.warning(f"  ✗ {name} not found")
            missing.append(name)
    
    if missing:
        logger.error(f"Missing packages: {', '.join(missing)}")
        logger.info("Run: pip install -r requirements.txt")
        return False
    
    return True


def check_env_file() -> bool:
    """Check if .env file exists with required variables."""
    env_path = Path(__file__).parent / ".env"
    env_example_path = Path(__file__).parent / ".env.example"
    
    if not env_path.exists():
        logger.warning("No .env file found")
        if env_example_path.exists():
            logger.info("Copy .env.example to .env and fill in your API keys")
        return False
    
    logger.info("✓ .env file exists")
    
    required_vars = ["LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "GEMINI_API_KEY"]
    
    with open(env_path, "r") as f:
        content = f.read()
    
    missing_vars = []
    for var in required_vars:
        if var not in content or f"{var}=your_" in content or f"{var}=" not in content:
            missing_vars.append(var)
    
    if missing_vars:
        logger.warning(f"Missing or placeholder values in .env: {', '.join(missing_vars)}")
        return False
    
    return True


def main() -> int:
    """Run setup for voice agent microservice."""
    logger.info("=" * 60)
    logger.info("Voice Agent Setup")
    logger.info("=" * 60)
    
    all_success = True
    
    print()
    logger.info("Step 1: Verifying Python dependencies")
    if not verify_dependencies():
        logger.warning("Some dependencies are missing")
        all_success = False
    
    print()
    logger.info("Step 2: Setting up Vosk STT model")
    if not setup_vosk_model():
        logger.error("Vosk model setup failed")
        all_success = False
    
    print()
    logger.info("Step 3: Coqui TTS setup info")
    setup_coqui_tts()
    
    print()
    logger.info("Step 4: Checking environment configuration")
    check_env_file()
    
    print()
    logger.info("=" * 60)
    
    if all_success:
        logger.info("✓ Setup complete!")
        logger.info("")
        logger.info("Next steps:")
        logger.info("  1. Copy .env.example to .env")
        logger.info("  2. Fill in your API keys (LiveKit, Gemini)")
        logger.info("  3. Run: python main.py")
        logger.info("  4. Test: curl http://localhost:8000/health")
        return 0
    else:
        logger.warning("Setup completed with warnings")
        logger.info("Some components may need manual configuration")
        return 1


if __name__ == "__main__":
    sys.exit(main())
