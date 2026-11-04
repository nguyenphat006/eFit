#!/bin/bash
set -e

# Apply database migrations via Alembic
echo "Applying database migrations via Alembic..."
if [ -f "alembic.ini" ]; then
    alembic upgrade head || echo "Alembic upgrade head failed or was not configured yet. Skipping."
else
    echo "No alembic.ini found. Skipping auto migrations."
fi

# Start FastAPI application
echo "Starting FastAPI Server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
