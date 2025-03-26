#!/bin/bash
set -e

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run uvicorn with the app
exec python -m uvicorn app:app --host 0.0.0.0 --port $PORT 