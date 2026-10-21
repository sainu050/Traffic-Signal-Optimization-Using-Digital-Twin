# Use official Debian-based Python 3.11 slim image
FROM python:3.11-slim

# Prevent interactive prompts and configure environment
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV SUMO_HOME=/usr/share/sumo

# Install SUMO, SUMO tools, PostgreSQL client runtime, and procps (for pkill)
RUN apt-get update && apt-get install -y --no-install-recommends \
    sumo \
    sumo-tools \
    libpq5 \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Set root app directory
WORKDIR /app

# Copy requirements and install python packages
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend source files, network XMLs, and models
COPY backend/ ./backend/

# Set working directory to backend directory so local imports and relative paths resolve cleanly
WORKDIR /app/backend

# Default port exposure
EXPOSE 8000

# Start Uvicorn bound to 0.0.0.0 using Render's PORT environment variable (fallback 8000)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
