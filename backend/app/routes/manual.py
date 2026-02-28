"""
routes/manual.py
─────────────────────────────────────────────────────────────────────────────
POST /predict/manual

Accepts a JSON body with a `features` list (16 values matching
feature_columns.pkl), scales them with the saved StandardScaler, runs
them through the TabularEnsemble StackingClassifier, and returns a
structured clinical prediction.

Feature vector order (16):
  0  Age
  1  Gender_Male                          (0=Female, 1=Male)
  2  Hormonal Changes_Postmenopausal      (0/1)
  3  Family History_Yes                   (0/1)
  4  Race/Ethnicity_Asian                 (0/1)
  5  Race/Ethnicity_Caucasian             (0/1)
  6  Body Weight_Underweight              (0/1, BMI<18.5)
  7  Calcium Intake_Low                   (0/1)
  8  Vitamin D Intake_Sufficient          (0/1)
  9  Physical Activity_Sedentary          (0/1)
  10 Smoking_Yes                          (0/1)
  11 Alcohol Consumption_Unknown          (0/1)
  12 Medical Conditions_Rheumatoid Arthritis (0/1)
  13 Medical Conditions_Unknown           (0/1)
  14 Medications_Unknown                  (0/1)
  15 Prior Fractures_Yes                  (0/1)

Model output classes:  0 → Normal   |   1 → Osteoporosis
"""

import logging
import numpy as np
from fastapi import APIRouter, HTTPException

from app.model_loader import get_model, get_scaler, is_model_loaded
from app.schemas import ManualPredictionRequest, PredictionResponse
from app.utils import get_clinical_data, build_t_score, build_bmd
from models.manual_rule_model import score_features

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predict", tags=["Manual Prediction"])

# Binary class index → human-readable label
_CLASS_LABELS = {0: "Normal", 1: "Osteoporosis"}

EXPECTED_FEATURES = 16


@router.post(
    "/manual",
    response_model=PredictionResponse,
    summary="Predict osteoporosis risk from clinical features",
    description=(
        "Submit a list of 16 clinical feature values matching the tabular "
        "ensemble model's feature columns. Returns a class label, confidence "
        "score, and personalised clinical recommendations."
    ),
)
async def predict_manual(payload: ManualPredictionRequest) -> PredictionResponse:
    """
    Run a manual (form-based) osteoporosis prediction using the
    TabularEnsemble StackingClassifier + StandardScaler artifacts.
    """
    if len(payload.features) != EXPECTED_FEATURES:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Expected exactly {EXPECTED_FEATURES} feature values, "
                f"got {len(payload.features)}."
            ),
        )

    try:
        features_array = np.array(payload.features, dtype=np.float64).reshape(1, -1)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Invalid feature array: {exc}")

    # ── Tabular Ensemble model path ───────────────────────────────────────
    if is_model_loaded():
        model  = get_model()
        scaler = get_scaler()
        try:
            # Scale features before inference
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                x_scaled = scaler.transform(features_array)
                raw_pred  = model.predict(x_scaled)[0]
                proba     = model.predict_proba(x_scaled)[0]

            class_idx  = int(raw_pred)
            label      = _CLASS_LABELS.get(class_idx, "Normal")
            confidence = float(proba[class_idx])
            logger.info("TabularEnsemble prediction: %s (confidence=%.4f, class=%d)", label, confidence, class_idx)
        except Exception as exc:
            logger.error("Model inference failed: %s", exc)
            raise HTTPException(status_code=500, detail=f"Model inference error: {exc}")

    # ── Rule-based fallback (no ML model loaded) ─────────────────────────
    else:
        logger.info("TabularEnsemble not loaded — using rule-based clinical scoring fallback.")
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
