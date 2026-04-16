FROM python:3.11-slim

# ffmpeg is required by yt-dlp for audio extraction
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Persistent directories
RUN mkdir -p /app/data /tmp/videopanel

ENV DB_PATH=/app/data/videopanel.db
ENV TEMP_DIR=/tmp/videopanel

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
