"""
routes/manual.py
─────────────────────────────────────────────────────────────────────────────
POST /predict/manual

Accepts a JSON body with a `features` list, runs it through the loaded
stacking ensemble model, and returns a structured clinical prediction.
"""

import logging
import numpy as np
from fastapi import APIRouter, HTTPException

from app.model_loader import get_model, is_model_loaded
from app.schemas import ManualPredictionRequest, PredictionResponse
from app.utils import (
    normalise_label,
    get_clinical_data,
    simulate_prediction,
    build_t_score,
    build_bmd,
)
from models.manual_rule_model import score_features

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predict", tags=["Manual Prediction"])


@router.post(
    "/manual",
    response_model=PredictionResponse,
    summary="Predict osteoporosis risk from clinical features",
    description=(
        "Submit a list of 14 clinical feature values (age, gender, BMI, etc.). "
        "The stacking ensemble model returns a class label and confidence score "
        "along with personalised clinical recommendations."
    ),
)
async def predict_manual(payload: ManualPredictionRequest) -> PredictionResponse:
    """
    Run a manual (form-based) osteoporosis prediction.

    - **features**: ordered list of numerical clinical values
    """
    try:
        features_array = np.array(payload.features, dtype=np.float64).reshape(1, -1)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Invalid feature array: {exc}")

    # ── Real model path ──────────────────────────────────────────────────
    if is_model_loaded():
        model = get_model()
        try:
            raw_pred = model.predict(features_array)[0]
            proba = model.predict_proba(features_array)[0]
            confidence = float(np.max(proba))
            label = normalise_label(raw_pred)
            logger.info("Manual prediction: %s (confidence=%.4f)", label, confidence)
        except Exception as exc:
            logger.error("Model inference failed: %s", exc)
            raise HTTPException(status_code=500, detail=f"Model inference error: {exc}")

    # ── Rule-based model path (no ML model loaded) ──────────────────────
    else:
        logger.info("ML model not loaded — using rule-based clinical scoring model.")
        label, confidence, t_score_val, bmd_val = score_features(payload.features)
        clinical = get_clinical_data(label)
        return PredictionResponse(
            prediction=label,
            confidence=round(confidence, 4),
            t_score=round(t_score_val, 2),
            bmd=round(bmd_val, 3),
            fracture_risk=clinical["fracture_risk"],
            suggestions=clinical["suggestions"],
            medications=clinical["medications"],
        )

    clinical = get_clinical_data(label)

    return PredictionResponse(
        prediction=label,
        confidence=round(confidence, 4),
        t_score=build_t_score(label),
        bmd=build_bmd(label),
        fracture_risk=clinical["fracture_risk"],
        suggestions=clinical["suggestions"],
        medications=clinical["medications"],
    )
