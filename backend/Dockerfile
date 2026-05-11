FROM python:3.11-slim
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl ca-certificates && \
        rm -rf /var/lib/apt/lists/*
        WORKDIR /app
        COPY requirements.txt .
        RUN pip install --no-cache-dir -r requirements.txt
        RUN pip install --no-cache-dir -U "yt-dlp[default]"
        COPY . .
        RUN mkdir -p /app/data /tmp/videopanel
        ENV DB_PATH=/app/data/videopanel.db
        ENV TEMP_DIR=/tmp/videopanel
        ENV PORT=8000
        EXPOSE 8000
        HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
          CMD curl -f http://localhost:8000/health || exit 1
          CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
