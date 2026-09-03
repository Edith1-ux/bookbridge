# Python 3.11 Production Dockerfile for BookBridge Django Framework with MySQL
FROM python:3.11-slim

# WORKDIR is repo root (/app). backend/ lives at /app/backend/
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Install essential system & MySQL client dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy all project files
COPY . .

# Collect static files. Run from backend/ so manage.py can find config.settings.base
RUN cd backend && python manage.py collectstatic --noinput || true

EXPOSE 8000

# Start Daphne ASGI from backend/ so the 'config' package is on sys.path.
# Use $PORT (Render sets this dynamically); fall back to 8000 for docker-compose.
CMD ["sh", "-c", "cd /app/backend && python manage.py migrate --noinput && daphne -b 0.0.0.0 -p ${PORT:-8000} config.asgi:application"]
