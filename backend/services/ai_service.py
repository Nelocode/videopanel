import asyncio
import json
import time
from typing import List, Dict, Optional

import google.generativeai as genai


ANALYSIS_SYSTEM_PROMPT = """Eres un analista de contenido experto para el equipo de comunicaciones de Copper Giant.

INSTRUCCIONES ESPECIALES DEL EQUIPO:
{user_prompt}

---

Tu tarea es analizar el audio de este video y extraer los momentos más importantes según las instrucciones anteriores.

Para cada momento clave, proporciona:
- Timestamp aproximado (formato MM:SS)
- Cita textual del fragmento más importante
- Por qué es relevante para las comunicaciones de la empresa
- Cómo se puede usar este fragmento (LinkedIn, X/Twitter, comunicado de prensa, etc.)

Responde ÚNICAMENTE con JSON válido en el siguiente formato exacto (sin markdown, sin backticks):
{{
  "title": "Título descriptivo del video/entrevista",
  "duration": "duración estimada (ej: 45 min)",
  "summary": "Resumen ejecutivo de 2-3 párrafos del contenido completo",
  "highlights": [
    {{
      "timestamp": "3:24",
      "quote": "texto textual del fragmento más representativo...",
      "relevance": "por qué este momento es importante para comunicaciones...",
      "content_suggestion": "sugerencia específica de cómo usar este fragmento...",
      "platforms": ["LinkedIn", "X/Twitter"]
    }}
  ],
  "content_notes": [
    {{
      "type": "linkedin_post",
      "title": "Título del borrador",
      "content": "Contenido completo del borrador de post..."
    }}
  ]
}}

Genera al menos 3-5 highlights y 2-3 content_notes. Prioriza siempre la calidad sobre la cantidad."""

CHAT_SYSTEM_PROMPT = """Eres un asistente de comunicaciones experto para Copper Giant, empresa minera que avanza el proyecto de cobre-molibdeno Mocoa en Colombia.

Ya analizaste un video del liderazgo de la empresa. Tienes disponible el siguiente contexto:

ANÁLISIS DEL VIDEO:
{analysis_context}

Tu rol es ayudar al equipo de comunicaciones a:
- Redactar posts para LinkedIn, X/Twitter, Instagram
- Crear borradores de comunicados de prensa
- Mejorar y adaptar el contenido generado
- Sugerir ángulos adicionales de comunicación
- Responder preguntas sobre el contenido del video

Sé conciso, profesional y orientado a resultados. Responde en el mismo idioma que el usuario."""


def _friendly_error(exc: Exception) -> str:
    """Translate a Gemini exception into a user-friendly Spanish message."""
    msg = str(exc).lower()
    if "api key not valid" in msg or "invalid" in msg or "malformed" in msg or "api_key" in msg:
        return "La API Key ingresada no es válida. Verifica que la copiaste completa desde Google AI Studio (aistudio.google.com)."
    if "quota" in msg or "rate" in msg or "resource exhausted" in msg:
        return "Has excedido el límite de uso de tu API Key de Gemini. Espera un momento e intenta de nuevo."
    if "permission" in msg or "forbidden" in msg or "403" in msg:
        return "Tu API Key no tiene permisos para usar este modelo. Asegúrate de que esté habilitada en Google AI Studio."
    if "network" in msg or "connection" in msg or "timeout" in msg:
        return "No se pudo conectar con Google AI. Verifica tu conexión a internet e intenta de nuevo."
    if "not found" in msg or "404" in msg:
        return f"El modelo seleccionado no está disponible con tu API Key. Intenta con 'gemini-1.5-flash'."
    return f"Error de Google AI: {str(exc)[:200]}"


class AIService:
    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        genai.configure(api_key=api_key)
        self.model_name = model_name
        self.api_key = api_key

    @staticmethod
    def validate_key(api_key: str) -> None:
        """
        Validate the API key by making a lightweight call.
        Raises ValueError with a user-friendly message if invalid.
        """
        try:
            genai.configure(api_key=api_key)
            # list_models is a cheap, read-only call that will fail if the key is bad
            models = list(genai.list_models())
            if not models:
                raise ValueError("La API Key no retornó ningún modelo disponible.")
        except Exception as exc:
            raise ValueError(_friendly_error(exc)) from exc

    async def analyze_video(self, audio_path: str, user_prompt: str) -> Dict:
        """Upload audio to Gemini and analyze it."""
        loop = asyncio.get_event_loop()
        model = genai.GenerativeModel(self.model_name)

        try:
            # Upload file
            uploaded = await loop.run_in_executor(None, self._upload_file, audio_path)

            # Wait for file to be active
            await loop.run_in_executor(None, self._wait_for_file, uploaded)

            # Build final prompt
            prompt = ANALYSIS_SYSTEM_PROMPT.format(user_prompt=user_prompt)

            # Generate analysis
            response = await loop.run_in_executor(
                None, lambda: model.generate_content([uploaded, prompt])
            )

            raw_text = response.text.strip()

            # Clean up markdown code fences if present
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
                raw_text = raw_text.strip()

            try:
                result = json.loads(raw_text)
            except json.JSONDecodeError:
                result = {
                    "title": "Análisis del Video",
                    "duration": "N/A",
                    "summary": raw_text[:2000],
                    "highlights": [],
                    "content_notes": [],
                }

            return result

        except Exception as exc:
            raise RuntimeError(_friendly_error(exc)) from exc

    def _upload_file(self, path: str):
        """Synchronous file upload to Gemini File API."""
        return genai.upload_file(path=path, mime_type="audio/mpeg")

    def _wait_for_file(self, file, max_wait: int = 120):
        """Poll until the uploaded file is ACTIVE."""
        start = time.time()
        while file.state.name == "PROCESSING":
            if time.time() - start > max_wait:
                raise TimeoutError("El archivo tardó demasiado en procesarse. Intenta con un video más corto.")
            time.sleep(5)
            file = genai.get_file(file.name)
        if file.state.name != "ACTIVE":
            raise RuntimeError(f"El archivo no pudo procesarse: {file.state.name}")
        return file

    async def chat(
        self,
        analysis_context: str,
        message: str,
        history: Optional[List[Dict]] = None,
    ) -> str:
        """Continue a chat about the analyzed video."""
        loop = asyncio.get_event_loop()
        model = genai.GenerativeModel(self.model_name)

        try:
            system = CHAT_SYSTEM_PROMPT.format(analysis_context=analysis_context)

            gemini_history = []
            if history:
                for h in history:
                    role = "user" if h.get("role") == "user" else "model"
                    gemini_history.append({"role": role, "parts": [h.get("content", "")]})

            chat = model.start_chat(history=gemini_history)

            full_message = f"{system}\n\n---\nPregunta del equipo: {message}"
            response = await loop.run_in_executor(
                None, lambda: chat.send_message(full_message)
            )
            return response.text

        except Exception as exc:
            raise RuntimeError(_friendly_error(exc)) from exc
