FROM python:3.11-slim

# System dependencies: ffmpeg for audio, curl for healthcheck
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Persistent directories
RUN mkdir -p /app/data /tmp/videopanel

ENV DB_PATH=/app/data/videopanel.db
ENV TEMP_DIR=/tmp/videopanel
ENV PORT=8000

EXPOSE 8000

# Health check so Docker knows when the service is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
