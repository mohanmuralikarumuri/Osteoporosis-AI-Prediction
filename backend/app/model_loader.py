"""
model_loader.py
─────────────────────────────────────────────────────────────────────────────
Responsible for loading the stacking ensemble model (.pkl) exactly once at
application startup, and exposing get_model() for route handlers.

Future extension points:
  - CNN model for X-ray images  → add load_xray_model() here
  - NLP model for PDF reports   → add load_report_model() here
"""

import os
import logging
import joblib

logger = logging.getLogger(__name__)

# ─── Module-level singleton ────────────────────────────────────────────────
_model = None

# Path is relative to project root (where run.py lives)
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),  # backend/
    "models",
    "osteoporosis_stacking_model.pkl",
)


def load_model() -> None:
    """
    Load the stacking ensemble model from disk into the module-level singleton.
    Call this once during the FastAPI startup event.
    """
    global _model

    if not os.path.exists(MODEL_PATH):
        logger.warning(
            "⚠️  Model file not found at '%s'. "
            "Predictions will use fallback simulation until model is placed there.",
            MODEL_PATH,
        )
        _model = None
        return

    try:
        _model = joblib.load(MODEL_PATH)
        logger.info("✅  Stacking model loaded successfully from '%s'", MODEL_PATH)
    except Exception as exc:
        logger.error("❌  Failed to load model: %s", exc)
        _model = None


def get_model():
    """
    Return the loaded model singleton.
    Returns None if the model file was not found (simulation mode).
    """
    return _model


def is_model_loaded() -> bool:
    """
    Return True if the stacking model was successfully loaded from disk.
    When False, all endpoints fall back to simulation mode.
    """
    return _model is not None


def is_model_loaded() -> bool:
    """Utility check used by health endpoint."""
    return _model is not None
