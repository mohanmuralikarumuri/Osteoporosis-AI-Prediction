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

# ─── Module-level singletons ───────────────────────────────────────────────
_model   = None   # tabular_ensemble_model.pkl  (StackingClassifier)
_scaler  = None   # scaler.pkl                  (StandardScaler)
_columns = None   # feature_columns.pkl         (list[str], len=16)

_BACKEND = os.path.dirname(os.path.dirname(__file__))   # …/backend/

TABULAR_MODEL_PATH   = os.path.join(_BACKEND, "models",    "tabular_ensemble_model.pkl")
SCALER_PATH          = os.path.join(_BACKEND, "artifacts", "scaler.pkl")
FEATURE_COLUMNS_PATH = os.path.join(_BACKEND, "artifacts", "feature_columns.pkl")


def load_model() -> None:
    """
    Load the tabular ensemble model + scaler + feature columns from disk.
    Called once at FastAPI startup.
    """
    global _model, _scaler, _columns

    # ── Tabular ensemble model ────────────────────────────────────────────
    if not os.path.exists(TABULAR_MODEL_PATH):
        logger.warning("⚠️  Tabular model not found at '%s'. Falling back to rule-based mode.", TABULAR_MODEL_PATH)
        _model = None
    else:
        try:
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                _model = joblib.load(TABULAR_MODEL_PATH)
            logger.info("✅  Tabular ensemble model loaded from '%s'", TABULAR_MODEL_PATH)
        except Exception as exc:
            logger.error("❌  Failed to load tabular model: %s", exc)
            _model = None

    # ── Scaler ────────────────────────────────────────────────────────────
    if not os.path.exists(SCALER_PATH):
        logger.warning("⚠️  Scaler not found at '%s'.", SCALER_PATH)
        _scaler = None
    else:
        try:
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                _scaler = joblib.load(SCALER_PATH)
            logger.info("✅  Scaler loaded from '%s'", SCALER_PATH)
        except Exception as exc:
            logger.error("❌  Failed to load scaler: %s", exc)
            _scaler = None

    # ── Feature columns ───────────────────────────────────────────────────
    if not os.path.exists(FEATURE_COLUMNS_PATH):
        logger.warning("⚠️  Feature columns not found at '%s'.", FEATURE_COLUMNS_PATH)
        _columns = None
    else:
        try:
            _columns = joblib.load(FEATURE_COLUMNS_PATH)
            logger.info("✅  Feature columns loaded: %s", _columns)
        except Exception as exc:
            logger.error("❌  Failed to load feature columns: %s", exc)
            _columns = None


def get_model():
    """Return the StackingClassifier singleton (None if not loaded)."""
    return _model


def get_scaler():
    """Return the StandardScaler singleton (None if not loaded)."""
    return _scaler


def get_feature_columns():
    """Return the list of 16 feature column names (None if not loaded)."""
    return _columns


def is_model_loaded() -> bool:
    """True only if model, scaler, and feature columns are all ready."""
    return _model is not None and _scaler is not None and _columns is not None


# ─────────────────────────────────────────────────────────────────────────────
# EfficientNet-B3  —  X-ray vision model
# ─────────────────────────────────────────────────────────────────────────────
_xray_model = None   # torchvision EfficientNet-B3, 3-class

XRAY_MODEL_PATH = os.path.join(_BACKEND, "models", "efficientnet_b3_osteoporosis.pth")


def load_xray_model() -> None:
    """
    Build the EfficientNet-B3 architecture (3 output classes), load the saved
    state-dict from disk, and set to eval mode.
    Called once at FastAPI startup.
    """
    global _xray_model

    if not os.path.exists(XRAY_MODEL_PATH):
        logger.warning("⚠️  X-ray model not found at '%s'. X-ray predictions will use heuristic fallback.", XRAY_MODEL_PATH)
        _xray_model = None
        return

    try:
        import warnings
        import torch
        from torchvision import models

        model = models.efficientnet_b3(weights=None)
        model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, 3)

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            sd = torch.load(XRAY_MODEL_PATH, map_location="cpu", weights_only=True)

        model.load_state_dict(sd)
        model.eval()
        _xray_model = model
        logger.info("✅  EfficientNet-B3 X-ray model loaded from '%s'", XRAY_MODEL_PATH)
    except Exception as exc:
        logger.error("❌  Failed to load X-ray model: %s", exc)
        _xray_model = None


def get_xray_model():
    """Return the EfficientNet-B3 singleton (None if not loaded)."""
    return _xray_model


def is_xray_model_loaded() -> bool:
    """True if the EfficientNet-B3 X-ray model is ready for inference."""
    return _xray_model is not None
