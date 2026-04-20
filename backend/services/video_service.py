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


# yt-dlp player clients to try in order (each bypasses bot detection differently)
_PLAYER_CLIENTS = [
    ["android_creator"],
    ["web_creator"],
    ["ios"],
    ["android"],
    ["mweb"],
    ["tv_embedded"],
]


class VideoService:
    """
    Gets video content in two stages:
      1. YouTube Transcript API  — fastest, no download, no bot-check.
      2. yt-dlp (multiple clients) — fallback for videos without captions.

    Always returns:
        {"type": "transcript"|"audio", "content": str|path}
    """

    def __init__(self):
        self.temp_dir = os.environ.get("TEMP_DIR", tempfile.gettempdir())
        os.makedirs(self.temp_dir, exist_ok=True)

    # ──────────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────────

    async def get_content(self, url: str, job_id: str) -> dict:
        """
        Returns {"type": "transcript", "content": "<full text>"}
               or {"type": "audio",      "content": "<mp3 path>"}
        """
        # Step 1: Try transcript (instant, no bot issues)
        print(f"[VideoService] Trying youtube-transcript-api for: {url}")
        transcript = await self._try_transcript(url)
        if transcript:
            print(f"[VideoService] Transcript OK ({len(transcript)} chars)")
            return {"type": "transcript", "content": transcript}

        print("[VideoService] No transcript available. Trying yt-dlp fallback...")

        # Step 2: Fallback — try multiple yt-dlp player clients
        last_error = None
        for client in _PLAYER_CLIENTS:
            try:
                print(f"[VideoService] Trying yt-dlp player_client={client}")
                audio_path = await self._download_with_client(url, job_id, client)
                print(f"[VideoService] yt-dlp success with client={client}")
                return {"type": "audio", "content": audio_path}
            except Exception as e:
                print(f"[VideoService] Client {client} failed: {e}")
                last_error = e
                # Clean up partial files before next attempt
                self._cleanup_partial(job_id)
                continue

        raise RuntimeError(
            "No se pudo obtener el contenido del video. "
            "Verifica que la URL sea válida y que el video sea público. "
            f"Último error: {last_error}"
        )

    # backward compat
    async def download_audio(self, url: str, job_id: str) -> str:
        result = await self.get_content(url, job_id)
        if result["type"] == "audio":
            return result["content"]
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
        except Exception as e:
            print(f"[VideoService] Transcript exception: {e}")
            return None

    def _fetch_transcript_sync(self, url: str) -> str | None:
        video_id = _extract_video_id(url)
        if not video_id:
            print("[VideoService] Could not extract video ID from URL")
            return None

        try:
            from youtube_transcript_api import YouTubeTranscriptApi
        except ImportError:
            print("[VideoService] youtube-transcript-api not installed, skipping")
            return None

        preferred = ["es", "es-419", "es-ES", "en", "en-US", "en-GB"]

        try:
            # --- Try new instance-based API (>=0.7.0) ---
            try:
                api = YouTubeTranscriptApi()
                transcript_list = api.list(video_id)
                transcripts = list(transcript_list)
                print(f"[VideoService] Found {len(transcripts)} transcripts (new API)")

                # Try preferred languages first, then any
                for lang in preferred:
                    for t in transcripts:
                        lang_code = getattr(t, "language_code", "")
                        if lang_code.startswith(lang.split("-")[0]):
                            return self._segments_to_text(t.fetch())

                if transcripts:
                    return self._segments_to_text(transcripts[0].fetch())

            except AttributeError:
                pass  # old API, try below

            # --- Try old static API (<0.7.0) ---
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            for lang in preferred:
                try:
                    t = transcript_list.find_transcript([lang])
                    return self._segments_to_text(t.fetch())
                except Exception:
                    continue

            # Any transcript
            for t in transcript_list:
                return self._segments_to_text(t.fetch())

        except Exception as e:
            print(f"[VideoService] No transcript for {video_id}: {e}")
            return None

    def _segments_to_text(self, segments) -> str:
        """Convert transcript segments (dicts or objects) to plain text."""
        texts = []
        for s in segments:
            if isinstance(s, dict):
                texts.append(s.get("text", ""))
            else:
                texts.append(getattr(s, "text", str(s)))
        return " ".join(texts).strip()

    # ──────────────────────────────────────────────────────────────────────────
    # Step 2 — yt-dlp with rotating player clients
    # ──────────────────────────────────────────────────────────────────────────

    async def _download_with_client(self, url: str, job_id: str, player_client: list) -> str:
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
            "extractor_args": {
                "youtube": {
                    "player_client": player_client,
                }
            },
            "http_headers": {
                "User-Agent": (
                    "Mozilla/5.0 (Linux; Android 12; Pixel 6) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Mobile Safari/537.36"
                )
            },
        }

        # Optional admin-level cookies (not required per-user)
        cookies_file = os.environ.get("YOUTUBE_COOKIES_FILE")
        if cookies_file and os.path.exists(cookies_file):
            ydl_opts["cookiefile"] = cookies_file
            print(f"[VideoService] Using cookies file: {cookies_file}")

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._do_download, url, ydl_opts)

        mp3_path = os.path.join(self.temp_dir, f"{job_id}.mp3")
        if os.path.exists(mp3_path):
            return mp3_path

        for f in os.listdir(self.temp_dir):
            if f.startswith(job_id) and not f.endswith("_transcript.txt"):
                return os.path.join(self.temp_dir, f)

        raise RuntimeError("Audio file not found after download.")

    def _do_download(self, url: str, opts: dict):
        import yt_dlp
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])

    # ──────────────────────────────────────────────────────────────────────────
    # Cleanup
    # ──────────────────────────────────────────────────────────────────────────

    def _cleanup_partial(self, job_id: str):
        """Remove any partial files from a failed attempt."""
        try:
            for f in os.listdir(self.temp_dir):
                if f.startswith(job_id):
                    full = os.path.join(self.temp_dir, f)
                    if os.path.exists(full):
                        os.remove(full)
        except Exception:
            pass

    def cleanup(self, *paths: str):
        for path in paths:
            try:
                if path and os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass
