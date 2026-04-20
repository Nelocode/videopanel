import asyncio
import os
import re
import tempfile
from pathlib import Path


def _extract_video_id(url: str) -> str | None:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r"(?:v=|youtu\.be/|embed/|shorts/)([a-zA-Z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


class VideoService:
    """
    Obtiene el contenido de video en dos pasos:
      1. YouTube Transcript API  — más rápido, sin descarga, sin bot-check.
      2. yt-dlp (cliente iOS)    — fallback para videos sin subtítulos.
    Devuelve siempre un dict con:
        {"type": "transcript"|"audio", "content": str|path}
    """

    def __init__(self):
        self.temp_dir = os.environ.get("TEMP_DIR", tempfile.gettempdir())
        os.makedirs(self.temp_dir, exist_ok=True)

    # ──────────────────────────────────────────────────────────────────────────
    # Public
    # ──────────────────────────────────────────────────────────────────────────

    async def get_content(self, url: str, job_id: str) -> dict:
        """
        Returns {"type": "transcript", "content": "<full text>"}
               or {"type": "audio",      "content": "<mp3 path>"}
        """
        # Step 1: Try transcript (instant, no bot issues)
        transcript = await self._try_transcript(url)
        if transcript:
            return {"type": "transcript", "content": transcript}

        # Step 2: Fallback — download audio with iOS player client
        audio_path = await self._download_audio_ios(url, job_id)
        return {"type": "audio", "content": audio_path}

    # keep backward compat for anything that still calls download_audio
    async def download_audio(self, url: str, job_id: str) -> str:
        result = await self.get_content(url, job_id)
        if result["type"] == "audio":
            return result["content"]
        # If we only have a transcript, write it to a temp .txt so callers don't break
        txt_path = os.path.join(self.temp_dir, f"{job_id}_transcript.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(result["content"])
        return txt_path

    # ──────────────────────────────────────────────────────────────────────────
    # Step 1 — YouTube Transcript API
    # ──────────────────────────────────────────────────────────────────────────

    async def _try_transcript(self, url: str) -> str | None:
        loop = asyncio.get_event_loop()
        try:
            return await loop.run_in_executor(None, self._fetch_transcript_sync, url)
        except Exception:
            return None

    def _fetch_transcript_sync(self, url: str) -> str | None:
        from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled

        video_id = _extract_video_id(url)
        if not video_id:
            return None

        # Preferred languages: Spanish first, then English, then any
        preferred = ["es", "es-419", "es-ES", "en", "en-US", "en-GB"]
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

            # Try preferred languages first
            for lang in preferred:
                try:
                    t = transcript_list.find_transcript([lang])
                    segments = t.fetch()
                    return " ".join(s["text"] for s in segments).strip()
                except Exception:
                    continue

            # Accept any available transcript (including auto-generated)
            for t in transcript_list:
                segments = t.fetch()
                return " ".join(s["text"] for s in segments).strip()

        except (NoTranscriptFound, TranscriptsDisabled):
            return None
        except Exception:
            return None

    # ──────────────────────────────────────────────────────────────────────────
    # Step 2 — yt-dlp with iOS player client (bypasses bot detection)
    # ──────────────────────────────────────────────────────────────────────────

    async def _download_audio_ios(self, url: str, job_id: str) -> str:
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
            # iOS player client bypasses bot detection without cookies
            "extractor_args": {
                "youtube": {
                    "player_client": ["ios"],
                }
            },
            "http_headers": {
                "User-Agent": "com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X;)"
            },
        }

        # Optionally use cookies file from env (admin-level config, not per-user)
        cookies_file = os.environ.get("YOUTUBE_COOKIES_FILE")
        if cookies_file and os.path.exists(cookies_file):
            ydl_opts["cookiefile"] = cookies_file

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._do_download, url, ydl_opts)

        mp3_path = os.path.join(self.temp_dir, f"{job_id}.mp3")
        if os.path.exists(mp3_path):
            return mp3_path

        for f in os.listdir(self.temp_dir):
            if f.startswith(job_id):
                return os.path.join(self.temp_dir, f)

        raise RuntimeError(
            "No se pudo obtener el audio del video. "
            "Verifica que la URL sea válida y que el video sea público."
        )

    def _do_download(self, url: str, opts: dict):
        import yt_dlp
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])

    # ──────────────────────────────────────────────────────────────────────────
    # Cleanup
    # ──────────────────────────────────────────────────────────────────────────

    def cleanup(self, *paths: str):
        for path in paths:
            try:
                if path and os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass
