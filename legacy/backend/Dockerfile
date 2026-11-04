FROM python:3.12-slim

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv globally
RUN pip install --no-cache-dir uv

# Copy configuration files
COPY pyproject.toml requirements.txt* ./

# Initialize virtual environment and install packages using uv
RUN uv venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Install requirements if file exists, or dependencies directly
RUN if [ -f requirements.txt ]; then uv pip install -r requirements.txt; fi
RUN uv pip install fastapi uvicorn sqlmodel asyncpg alembic pydantic-settings httpx ruff

# Copy application files
COPY . .

# Grant execute rights to starting script
RUN chmod +x start.sh

# Expose ports
EXPOSE 8000

# Run entry script
CMD ["./start.sh"]
