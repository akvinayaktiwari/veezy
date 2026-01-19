# Veezy Setup Guide for macOS

Complete setup instructions for running the Veezy AI Sales Agent platform on macOS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Setup](#system-setup)
3. [Project Installation](#project-installation)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **macOS**: 12 (Monterey) or higher
- **Xcode Command Line Tools**: For native compilation
- **Homebrew**: Package manager for macOS

---

## System Setup

### 1. Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, add Homebrew to your PATH (the installer will show the exact commands):

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### 2. Install Node.js (v20 or higher)

```bash
# Install Node.js via Homebrew
brew install node@20

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### 3. Install Python 3.11

```bash
# Install Python via Homebrew
brew install python@3.11

# Verify installation
python3.11 --version  # Should show Python 3.11.x

# Create a symlink for easier access (optional)
ln -s /opt/homebrew/bin/python3.11 /opt/homebrew/bin/python3
```

### 4. Install PostgreSQL Client (for Prisma)

```bash
brew install postgresql@15
```

### 5. Install FFmpeg (for Voice Agent)

```bash
brew install ffmpeg

# Verify installation
ffmpeg -version
```

### 6. Install Git (if not already installed)

```bash
brew install git
git --version
```

---

## Project Installation

### 1. Clone the Repository

```bash
# Navigate to your desired directory
cd ~/Documents  # or wherever you want the project

# Clone the repository
git clone https://github.com/akvinayaktiwari/veezy.git
cd veezy
```

### 2. Install Node Dependencies

```bash
# Install all dependencies for all apps
npm install

# This installs dependencies for:
# - Frontend (apps/web)
# - Backend (apps/api)
# - Shared packages
```

### 3. Setup Voice Agent (Python)

```bash
# Navigate to voice agent directory
cd apps/voice-agent

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Download AI models (Vosk STT + Piper TTS)
python setup.py

# This will download:
# - Vosk model (~50MB)
# - Piper TTS model (~60MB)

# Deactivate virtual environment for now
deactivate

# Return to project root
cd ../..
```

---

## Database Setup

### Option 1: Using Supabase Cloud (Recommended)

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account

2. **Create a New Project**
   - Click "New Project"
   - Choose a name and strong password
   - Select a region close to you
   - Wait for project to be provisioned (~2 minutes)

3. **Get Database Connection String**
   - Go to Project Settings → Database
   - Copy the "Connection String" under "Connection pooling"
   - Format: `postgresql://postgres.[project-ref]:[password]@[region].pooler.supabase.com:6543/postgres`

4. **Get Supabase Anon Key**
   - Go to Project Settings → API
   - Copy the "anon" "public" key

### Option 2: Local PostgreSQL (Advanced)

```bash
# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb veezy

# Connection string will be:
# postgresql://[your-username]@localhost:5432/veezy
```

---

## Environment Configuration

### Quick Option: Copy from Windows

If you already have configured `.env` files on your Windows machine, simply copy them to your Mac:

**From Windows:**
- `apps/api/.env`
- `apps/web/.env.local`
- `apps/voice-agent/.env`

**To Mac:** Same locations in the project

This preserves all your API keys, database connections, and configurations.

---

### Alternative: Manual Configuration

If you need to set up from scratch:

### 1. Backend Environment (.env)

```bash
# Create .env file in apps/api
cd apps/api
cp .env.example .env
```

Edit `apps/api/.env`:

```bash
# Database (from Supabase)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@[region].pooler.supabase.com:5432/postgres"

# Supabase
SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"

# JWT Secret (generate a random string)
JWT_SECRET="your-secure-random-string-here"

# Server
PORT=4000
NODE_ENV=development

# Voice Agent URL
VOICE_AGENT_URL="http://localhost:8000"
```

### 2. Frontend Environment (.env.local)

```bash
# Create .env.local file in apps/web
cd ../web
cp .env.example .env.local
```

Edit `apps/web/.env.local`:

```bash
# API URL
NEXT_PUBLIC_API_URL="http://localhost:4000"

# Supabase (same as backend)
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```

### 3. Voice Agent Environment (.env)

```bash
# Create .env file in apps/voice-agent
cd ../voice-agent
cp .env.example .env
```

Edit `apps/voice-agent/.env`:

```bash
# LiveKit Configuration
LIVEKIT_URL="wss://veezy-xxxxx.livekit.cloud"  # Get from livekit.io
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"

# Google Gemini API
GEMINI_API_KEY="your-gemini-api-key"  # Get from makersuite.google.com
GEMINI_MODEL="gemini-2.0-flash-exp"

# Model Paths
VOSK_MODEL_PATH="models/vosk-model-en-us-0.22"
PIPER_MODEL_PATH="models/piper/en_US-lessac-medium.onnx"

# Server
PORT=8000
LOG_LEVEL="INFO"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:4000"
```

### 4. Run Database Migrations

```bash
# Return to project root
cd ../..

# Generate Prisma Client
cd apps/api
npx prisma generate

# Run migrations to create database tables
npx prisma migrate deploy

# (Optional) Seed the database with sample data
npx prisma db seed

# Return to root
cd ../..
```

---

## Running the Application

You'll need **3 terminal windows/tabs** to run all services:

### Terminal 1: Frontend + Backend (Turbo)

```bash
# From project root
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000

### Terminal 2: Voice Agent (Python)

```bash
# Navigate to voice agent directory
cd apps/voice-agent

# Activate virtual environment
source venv/bin/activate

# Start the FastAPI server
python main.py
```

This starts:
- **Voice Agent**: http://localhost:8000

### Terminal 3: Prisma Studio (Optional - Database GUI)

```bash
# From project root
cd apps/api
npx prisma studio
```

This opens:
- **Prisma Studio**: http://localhost:5555

---

## Verify Everything is Running

### 1. Check Backend

```bash
curl http://localhost:4000
# Should return: {"message":"Veezy API is running"}
```

### 2. Check Frontend

Open browser: http://localhost:3000

### 3. Check Voice Agent

```bash
curl http://localhost:8000/health
# Should return: {"status":"ok","services":{"stt":true,"llm":true,"tts":true}}
```

---

## Troubleshooting

### Python Virtual Environment Issues

If `source venv/bin/activate` doesn't work:

```bash
# Make sure you're in the voice-agent directory
cd apps/voice-agent

# Try using the full path
source ./venv/bin/activate

# Or use python directly
./venv/bin/python main.py
```

### Port Already in Use

If you get "port already in use" errors:

```bash
# Find process using port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Find process using port 4000 (backend)
lsof -ti:4000 | xargs kill -9

# Find process using port 8000 (voice agent)
lsof -ti:8000 | xargs kill -9
```

### Node Module Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json apps/*/node_modules
npm install
```

### Prisma Client Issues

```bash
cd apps/api
rm -rf node_modules/.prisma
npx prisma generate
cd ../..
```

### Python Dependencies Issues

```bash
cd apps/voice-agent
source venv/bin/activate
pip install --upgrade pip
pip install --force-reinstall -r requirements.txt
deactivate
cd ../..
```

### Database Connection Issues

1. Verify Supabase project is running
2. Check connection string format (should have `?pgbouncer=true`)
3. Ensure DATABASE_URL and DIRECT_URL are both set
4. Try regenerating database password in Supabase dashboard

### Voice Agent Model Download Issues

```bash
cd apps/voice-agent
source venv/bin/activate

# Re-run setup to download models
python setup.py

# Or manually download:
# Vosk: https://alphacephei.com/vosk/models
# Piper: https://github.com/rhasspy/piper/releases

deactivate
cd ../..
```

---

## macOS-Specific Notes

### File Permissions

If you encounter permission errors:

```bash
# Make scripts executable
chmod +x apps/voice-agent/venv/bin/activate
chmod +x apps/voice-agent/setup.py
```

### Xcode Command Line Tools

If you get compilation errors:

```bash
# Install/update Xcode Command Line Tools
xcode-select --install
```

### Python Path Issues

If `python3` doesn't work:

```bash
# Use explicit version
python3.11 --version

# Or create alias in ~/.zshrc
echo 'alias python3="/opt/homebrew/bin/python3.11"' >> ~/.zshrc
source ~/.zshrc
```

### M1/M2 (Apple Silicon) Specific

If you're on Apple Silicon (M1/M2):

```bash
# Some Python packages might need Rosetta
softwareupdate --install-rosetta

# Use native ARM builds when possible (Homebrew handles this)
arch -arm64 brew install python@3.11
```

---

## Development Workflow

### Recommended: Use Multiple Terminal Tabs

1. **Tab 1**: Frontend + Backend (`npm run dev`)
2. **Tab 2**: Voice Agent (`source venv/bin/activate && python main.py`)
3. **Tab 3**: Git commands, testing, etc.

### Stopping Services

- Frontend/Backend: `Ctrl + C` in Terminal 1
- Voice Agent: `Ctrl + C` in Terminal 2

### Restarting After Changes

- **Frontend/Backend**: Auto-reloads (hot reload enabled)
- **Voice Agent**: Restart with `Ctrl + C` then `python main.py`

---

## Next Steps

1. **Create a Supabase account** if you haven't
2. **Get LiveKit credentials** from [livekit.io/cloud](https://livekit.io/cloud)
3. **Get Gemini API key** from [makersuite.google.com](https://makersuite.google.com/app/apikey)
4. **Test the public booking flow**:
   - Create an agent in the dashboard
   - Generate a public booking link
   - Test voice conversation

---

## Additional Resources

- [Veezy Documentation](../../README.md)
- [Supabase Docs](https://supabase.com/docs)
- [LiveKit Docs](https://docs.livekit.io)
- [Gemini API Docs](https://ai.google.dev/docs)

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review terminal logs for error messages
3. Ensure all environment variables are set correctly
4. Verify all services are running on correct ports

Happy coding! 🚀
