"""
main.py
─────────────────────────────────────────────────────────────────────────────
FastAPI application entry point.

Responsibilities:
  • Create and configure the FastAPI app
  • Register CORS middleware
  • Mount all API routers
  • Expose a health-check endpoint
  • Trigger model loading on startup
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.model_loader import load_model, is_model_loaded
from app.schemas import HealthResponse
from app.routes import manual, report, xray

# ─── Logging configuration ────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── Lifespan: startup / shutdown ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the ML model exactly once when the server starts."""
    logger.info("🚀  Osteocare.ai backend starting up…")
    load_model()
    yield
    logger.info("🛑  Osteocare.ai backend shutting down.")


# ─── FastAPI app ───────────────────────────────────────────────────────────
app = FastAPI(
    title="Osteocare.ai – Osteoporosis AI Predictor API",
    description=(
        "Production-ready FastAPI backend powering the Osteocare.ai React frontend.\n\n"
        "## Endpoints\n"
        "| Route | Method | Description |\n"
        "|---|---|---|\n"
        "| `/predict/manual` | POST | Clinical-feature based prediction |\n"
        "| `/predict/report` | POST | DEXA / medical report file upload |\n"
        "| `/predict/xray`   | POST | Bone X-ray image upload |\n"
        "| `/health`         | GET  | Service health check |\n"
    ),
    version="1.0.0",
    contact={
        "name": "Osteocare.ai Team",
        "email": "support@Osteocare.ai.health",
    },
    license_info={
        "name": "MIT",
    },
    lifespan=lifespan,
)


# ─── CORS ─────────────────────────────────────────────────────────────────
# 👉 In production: replace "*" with your exact frontend origin
#    e.g. ["https://Osteocare.ai.vercel.app", "https://your-domain.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ─── Routers ──────────────────────────────────────────────────────────────
app.include_router(manual.router)
app.include_router(report.router)
app.include_router(xray.router)


# ─── Health check ─────────────────────────────────────────────────────────
@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Backend + model health check",
)
async def health_check() -> HealthResponse:
    """Returns server status and whether the ML model is loaded."""
    return HealthResponse(
        status="ok",
        model_loaded=is_model_loaded(),
        version="1.0.0",
    )


# ─── Root redirect ────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return JSONResponse(
        content={
            "message": "Osteocare.ai API is running. Visit /docs for Swagger UI.",
            "docs": "/docs",
            "health": "/health",
        }
    )
