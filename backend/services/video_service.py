import asyncio
import os
import tempfile
from pathlib import Path


class VideoService:
    """Downloads audio from YouTube (or other yt-dlp supported sources)."""

    def __init__(self):
        self.temp_dir = os.environ.get("TEMP_DIR", tempfile.gettempdir())
        os.makedirs(self.temp_dir, exist_ok=True)

    async def download_audio(self, url: str, job_id: str) -> str:
        """Download audio and return path to the mp3 file."""
        output_template = os.path.join(self.temp_dir, f"{job_id}.%(ext)s")

        ydl_opts = {
            "format": "bestaudio/best",
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "96",
                }
            ],
            "outtmpl": output_template,
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            "http_headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        }

        # Handle YouTube anti-bot by passing cookies if provided
        cookies_file = os.environ.get("YOUTUBE_COOKIES_FILE")
        if cookies_file and os.path.exists(cookies_file):
            ydl_opts["cookiefile"] = cookies_file

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._do_download, url, ydl_opts)

        # Find the resulting file
        mp3_path = os.path.join(self.temp_dir, f"{job_id}.mp3")
        if os.path.exists(mp3_path):
            return mp3_path

        # Fallback: find any file with this job_id prefix
        for f in os.listdir(self.temp_dir):
            if f.startswith(job_id):
                return os.path.join(self.temp_dir, f)

        raise RuntimeError("No se pudo descargar el audio. Verifica que la URL sea válida y accesible.")

    def _do_download(self, url: str, opts: dict):
        import yt_dlp
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])

    def cleanup(self, *paths: str):
        for path in paths:
            try:
                if path and os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass
