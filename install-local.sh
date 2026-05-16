#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  echo "ERROR: Python is not installed. Install Python 3.10+ and retry."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is not installed. Install Node.js and npm and retry."
  exit 1
fi

echo "Installing backend Python dependencies..."
cd "$ROOT_DIR/backend"
if [ ! -d "$ROOT_DIR/.venv" ]; then
  echo "Creating local Python virtual environment in $ROOT_DIR/.venv"
  "$PYTHON" -m venv "$ROOT_DIR/.venv"
fi
source "$ROOT_DIR/.venv/bin/activate"
python -m pip install --upgrade pip
python -m pip install --upgrade -r requirements.txt
if [ -f requirements-dev.txt ]; then
  python -m pip install --upgrade -r requirements-dev.txt
fi

echo "Installing frontend Node dependencies..."
cd "$ROOT_DIR/frontend"
npm install --legacy-peer-deps

echo "\nLocal dependencies installed successfully."
echo "Next steps:"
echo "  1. Copy infra/.env.example to infra/.env"
echo "  2. Copy backend/.env.example to backend/.env"
echo "  3. Run: docker compose -f infra/docker-compose.dev.yml up --build"
