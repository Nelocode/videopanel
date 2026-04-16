import sqlite3
import json
import os
from typing import Optional, Dict, Any, List


DB_PATH = os.environ.get("DB_PATH", "/app/data/videopanel.db")


class Database:
    def __init__(self):
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        self._init_db()

    def _get_conn(self):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS settings (
                    key   TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS jobs (
                    id            TEXT PRIMARY KEY,
                    video_url     TEXT NOT NULL,
                    system_prompt TEXT NOT NULL,
                    status        TEXT DEFAULT 'pending',
                    message       TEXT,
                    result        TEXT,
                    created_at    TEXT DEFAULT (datetime('now'))
                )
            """)
            conn.commit()

    # ── Settings ─────────────────────────────────────────────────────────
    def get_settings(self) -> Dict[str, str]:
        with self._get_conn() as conn:
            rows = conn.execute("SELECT key, value FROM settings").fetchall()
            return {r["key"]: r["value"] for r in rows}

    def update_settings(self, settings: Dict[str, str]):
        with self._get_conn() as conn:
            for key, value in settings.items():
                if value:  # only save non-empty values
                    conn.execute(
                        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                        (key, value),
                    )
            conn.commit()

    def get_setting(self, key: str, default: str = "") -> str:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT value FROM settings WHERE key=?", (key,)
            ).fetchone()
            return row["value"] if row else default

    # ── Jobs ─────────────────────────────────────────────────────────────
    def create_job(self, job_id: str, video_url: str, system_prompt: str):
        with self._get_conn() as conn:
            conn.execute(
                "INSERT INTO jobs (id, video_url, system_prompt, status, message) VALUES (?, ?, ?, 'pending', 'En cola...')",
                (job_id, video_url, system_prompt),
            )
            conn.commit()

    def update_job(
        self,
        job_id: str,
        status: str,
        message: str,
        result: Optional[Dict] = None,
    ):
        with self._get_conn() as conn:
            if result is not None:
                conn.execute(
                    "UPDATE jobs SET status=?, message=?, result=? WHERE id=?",
                    (status, message, json.dumps(result, ensure_ascii=False), job_id),
                )
            else:
                conn.execute(
                    "UPDATE jobs SET status=?, message=? WHERE id=?",
                    (status, message, job_id),
                )
            conn.commit()

    def get_job(self, job_id: str) -> Optional[Dict]:
        with self._get_conn() as conn:
            row = conn.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
            if not row:
                return None
            job = dict(row)
            if job.get("result"):
                job["result"] = json.loads(job["result"])
            return job

    def list_jobs(self, limit: int = 20) -> List[Dict]:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT id, video_url, status, message, created_at FROM jobs ORDER BY created_at DESC LIMIT ?",
                (limit,),
            ).fetchall()
            return [dict(r) for r in rows]
