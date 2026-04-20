import asyncio
import json
import uuid
import os
from typing import Optional, List

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import Database
from services.ai_service import AIService
from services.video_service import VideoService

app = FastAPI(title="VideoPanel API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = Database()


# ─────────────────────────────────────────────────────────────────────────────
# Settings
# ─────────────────────────────────────────────────────────────────────────────

class SettingsIn(BaseModel):
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    preferred_model: Optional[str] = None


@app.get("/api/settings")
async def get_settings():
    raw = db.get_settings()
    gemini_key = raw.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY", "")
    openai_key = raw.get("openai_api_key") or os.environ.get("OPENAI_API_KEY", "")
    
    result = {
        "preferred_model": raw.get("preferred_model", "gemini-1.5-flash"),
        "has_gemini": bool(gemini_key),
        "has_openai": bool(openai_key),
        "preferred_model_options": [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-2.0-flash",
        ],
    }
    # Show masked keys for display
    if gemini_key:
        result["gemini_api_key_masked"] = gemini_key[:8] + "•" * 20 + gemini_key[-4:]
    if openai_key:
        result["openai_api_key_masked"] = openai_key[:8] + "•" * 20 + openai_key[-4:]
    return result


@app.post("/api/settings")
async def update_settings(body: SettingsIn):
    # Validate the Gemini key BEFORE saving
    gemini_key = body.gemini_api_key
    if gemini_key:
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, AIService.validate_key, gemini_key)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"No se pudo validar la API Key: {str(exc)}")

    openai_key = body.openai_api_key
    if openai_key:
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, AIService.validate_key, openai_key, True)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"No se pudo validar la API Key: {str(exc)}")

    data = {}
    if gemini_key:
        data["gemini_api_key"] = gemini_key
    if body.openai_api_key:
        data["openai_api_key"] = body.openai_api_key
    if body.preferred_model:
        data["preferred_model"] = body.preferred_model
    db.update_settings(data)
    if gemini_key or body.openai_api_key:
        return {"status": "ok", "message": "✅ API Key validada y guardada correctamente."}
    return {"status": "ok", "message": "✅ Configuración guardada correctamente."}


# ─────────────────────────────────────────────────────────────────────────────
# Video Analysis
# ─────────────────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    video_url: str
    system_prompt: str


@app.post("/api/analyze")
async def analyze_video(body: AnalyzeRequest, background_tasks: BackgroundTasks):
    settings = db.get_settings()
    gemini_key = settings.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY")
    openai_key = settings.get("openai_api_key") or os.environ.get("OPENAI_API_KEY")
    
    if not gemini_key and not openai_key:
        raise HTTPException(
            status_code=400,
            detail="API key no configurada. Ve a ⚙ Configuración para agregarla o configúrala en el servidor.",
        )

    if not body.video_url.strip():
        raise HTTPException(status_code=400, detail="La URL del video es requerida.")

    job_id = str(uuid.uuid4())
    db.create_job(job_id, body.video_url, body.system_prompt)

    background_tasks.add_task(
        _process_video,
        job_id=job_id,
        url=body.video_url,
        prompt=body.system_prompt,
        gemini_key=gemini_key,
        openai_key=openai_key,
        model_name=settings.get("preferred_model", "gemini-1.5-flash"),
    )

    return {"job_id": job_id}


async def _process_video(
    job_id: str, url: str, prompt: str, gemini_key: str, openai_key: str, model_name: str
):
    video_svc = VideoService()
    cleanup_path = None
    try:
        db.update_job(job_id, "downloading", "🔍 Obteniendo contenido del video...")
        content = await video_svc.get_content(url, job_id)

        ai_svc = AIService(api_key=gemini_key, openai_key=openai_key, model_name=model_name)

        if content["type"] == "transcript":
            db.update_job(job_id, "analyzing", "🤖 Analizando transcripción con IA...")
            result = await ai_svc.analyze_transcript(content["content"], prompt)
        else:
            cleanup_path = content["content"]
            db.update_job(job_id, "analyzing", "🤖 Analizando audio con Gemini AI...")
            result = await ai_svc.analyze_video(content["content"], prompt)

        db.update_job(job_id, "done", "✅ Análisis completado", result=result)

    except Exception as exc:
        db.update_job(job_id, "error", f"❌ {str(exc)}")
    finally:
        if cleanup_path:
            video_svc.cleanup(cleanup_path)


# ─────────────────────────────────────────────────────────────────────────────
# Jobs / Sessions
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    job = db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job no encontrado.")
    return job


@app.get("/api/sessions")
async def list_sessions():
    return db.list_jobs()


# ─────────────────────────────────────────────────────────────────────────────
# Chat
# ─────────────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    job_id: str
    message: str
    history: List[dict] = []


@app.post("/api/chat")
async def chat(body: ChatRequest):
    job = db.get_job(body.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Sesión no encontrada.")
    if job["status"] != "done":
        raise HTTPException(status_code=400, detail="El análisis aún no está listo.")

    settings = db.get_settings()
    gemini_key = settings.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY")
    openai_key = settings.get("openai_api_key") or os.environ.get("OPENAI_API_KEY")

    if not gemini_key and not openai_key:
        raise HTTPException(status_code=400, detail="API key no configurada.")

    result_data = job.get("result", {})
    context = json.dumps(result_data, ensure_ascii=False, indent=2)

    ai_svc = AIService(
        api_key=gemini_key,
        openai_key=openai_key,
        model_name=settings.get("preferred_model", "gemini-1.5-flash"),
    )
    response_text = await ai_svc.chat(
        analysis_context=context,
        message=body.message,
        history=body.history,
    )
    return {"response": response_text}


# ─────────────────────────────────────────────────────────────────────────────
# Health
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
