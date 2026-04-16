# VideoPanel 🎬

Plataforma interna de análisis de contenido en video con IA para el equipo de comunicaciones de **Copper Giant**.

## ¿Qué hace?

Convierte entrevistas, podcasts y videoconferencias del CEO en contenido estratégico listo para publicar:

1. **Pega una URL de YouTube** (o cualquier plataforma soportada por yt-dlp)
2. **Define instrucciones** para la IA — qué considerar "relevante" según el contexto
3. La IA **transcribe y analiza** el audio con Google Gemini
4. Obtienes **momentos clave con timestamps**, borradores de posts y un **chat** para refinar el contenido

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router, TypeScript) |
| Backend | Python FastAPI |
| IA | Google Gemini 1.5 Flash/Pro |
| Descarga | yt-dlp + ffmpeg |
| Base de datos | SQLite (settings + historial) |
| Deploy | Docker Compose / EasyPanel |

## Estructura

```
videopanel/
├── backend/          # FastAPI — análisis, IA, configuración
│   ├── main.py
│   ├── database.py
│   └── services/
│       ├── ai_service.py
│       └── video_service.py
├── frontend/         # Next.js — UI Copper Giant
│   ├── app/
│   └── components/
└── docker-compose.yml
```

## Deploy rápido (EasyPanel)

1. Conecta este repo en EasyPanel → **Docker Compose**
2. Despliega
3. Abre la URL → **⚙ Configuración** → ingresa tu [Gemini API Key](https://aistudio.google.com/app/apikey) (gratis)
4. ¡Listo!

## Desarrollo local

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (en otra terminal)
cd frontend && npm install && npm run dev
```

---

Built with ❤ for [Copper Giant](https://coppergiant.co)
