"""
routes/report.py
─────────────────────────────────────────────────────────────────────────────
POST /predict/report

Accepts a PDF or image file (DEXA report / medical document).

Pipeline:
  1. Extract text from PDF/image using pdfplumber (PDF) or raw decode (image).
  2. Parse 14 clinical fields with regex (age, gender, BMI, T-score, etc.).
  3. Build the same 16-feature vector used by the Manual Predictor.
  4. Run through the TabularEnsemble StackingClassifier + StandardScaler.
  5. Map 2-class output (Normal / Osteoporosis) to 3-class using T-score:
       • Model pred 1                        → Osteoporosis
       • Model pred 0, T-score ≤ -2.5        → Osteoporosis  (override)
       • Model pred 0, -2.5 < T-score ≤ -1.0 → Osteopenia
       • Model pred 0, T-score > -1.0         → Normal
       • Model pred 0, no T-score, conf < 0.7 → Osteopenia   (borderline)
       • Model pred 0, no T-score, conf ≥ 0.7 → Normal
  6. Fallback: rule-based clinical scoring when ML model is not loaded.
"""

import logging
import warnings
import numpy as np
from fastapi import APIRouter, File, UploadFile, HTTPException

from app.schemas import PredictionResponse
from app.utils import get_clinical_data, build_t_score, build_bmd
from app.model_loader import get_model, get_scaler, is_model_loaded
from models.report_nlp_model import analyse_report

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predict", tags=["Report Prediction"])

ALLOWED_REPORT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/tiff",
    "image/bmp",
}
MAX_FILE_SIZE_MB = 20

# Tabular model output: 0 → Normal/borderline, 1 → Osteoporosis
_MODEL_CLASSES = {0: "Normal", 1: "Osteoporosis"}


_MAX_FIELDS = 14  # total extractable clinical fields


def _refine_label_with_tscore(model_class: int, model_conf: float, t_score: float | None) -> str:
    """
    Map the 2-class tabular model output to a 3-class clinical label using
    the T-score extracted from the report (when available).
    """
    if model_class == 1:
        return "Osteoporosis"

    # model says Normal (class 0) — check T-score for Osteopenia zone
    if t_score is not None:
        if t_score <= -2.5:
            return "Osteoporosis"
        if t_score <= -1.0:
            return "Osteopenia"
        return "Normal"

    # No T-score: use confidence as proxy
    # Low confidence on Normal pred = borderline → Osteopenia
    if model_conf < 0.70:
        return "Osteopenia"
    return "Normal"


def _compute_report_confidence(
    model_class: int,
    proba: "np.ndarray",
    final_label: str,
    t_score: float | None,
    n_fields: int,
) -> float:
    """
    Confidence anchored to the clinical range of each risk level so the
    displayed percentage always feels meaningful relative to the diagnosis:

      Osteoporosis  (High risk)     →  75 % – 97 %
      Osteopenia    (Moderate risk)  →  60 % – 82 %
      Normal        (Low risk)       →  78 % – 96 %

    Within each range the position is driven by:
      • Model probability for the relevant class
      • T-score proximity to clinical thresholds (when present)
      • Field-coverage factor — fewer extracted fields → confidence scaled down

    Coverage factor:  n_fields=0 → ×0.65,  n_fields=7 → ×0.825,  n_fields=14 → ×1.00
    """
    # How many fields were actually extracted vs defaults used
    coverage_factor = max(0.65, min(1.0, 0.65 + (n_fields / _MAX_FIELDS) * 0.35))

    # ── Osteoporosis: 75 % – 97 % ────────────────────────────────────────
    if final_label == "Osteoporosis":
        p_osteo = float(proba[1])          # P(Osteoporosis) from model
        if t_score is not None and t_score <= -2.5:
            # T-score confirms: further below −2.5 → higher certainty
            severity = min(1.0, (abs(t_score) - 2.5) / 3.0)  # 0.0 @ −2.5 → 1.0 @ −5.5
            base = 0.80 + severity * 0.17                      # 0.80 – 0.97
        else:
            # Direct model prediction or override without T-score
            base = 0.75 + p_osteo * 0.22                       # 0.75 – 0.97
        return round(min(0.97, base * coverage_factor), 4)

    # ── Osteopenia: 60 % – 82 % ──────────────────────────────────────────
    elif final_label == "Osteopenia":
        if t_score is not None:
            # Position in the (−2.5, −1.0] zone; closer to −2.5 = more certain
            pos = min(1.0, (abs(t_score) - 1.0) / 1.5)        # 0.0 @ −1.0 → 1.0 @ −2.5
            base = 0.62 + pos * 0.20                            # 0.62 – 0.82
        else:
            # No T-score; borderline case from low model confidence on Normal
            uncertainty = 1.0 - float(proba[0])               # model unsure about Normal
            base = 0.60 + uncertainty * 0.22                    # 0.60 – 0.82
        return round(min(0.82, base * coverage_factor), 4)

    # ── Normal: 78 % – 96 % ──────────────────────────────────────────────
    else:
        p_normal = float(proba[0])         # P(Normal) from model
        if t_score is not None and t_score > -1.0:
            # T-score also in Normal zone → extra certainty
            clearance = min(1.0, (t_score + 1.0) / 2.0)       # 0.0 @ −1.0 → 1.0 @ +1.0
            base = 0.84 + clearance * 0.12                      # 0.84 – 0.96
        else:
            base = 0.78 + p_normal * 0.18                       # 0.78 – 0.96
        return round(min(0.96, base * coverage_factor), 4)


@router.post(
    "/report",
    response_model=PredictionResponse,
    summary="Predict osteoporosis from a DEXA / medical report file",
    description=(
        "Upload a PDF or image of a DEXA scan report or medical document. "
        "Clinical fields are extracted via NLP, fed into the Tabular Ensemble "
        "model (same as Manual Predictor), and a 3-class prediction is returned."
    ),
)
async def predict_report(
    file: UploadFile = File(..., description="PDF or image of the DEXA/medical report"),
) -> PredictionResponse:
    """
    Analyse an uploaded medical report for osteoporosis risk.

    - **file**: PDF / JPEG / PNG / TIFF / BMP (max 20 MB)
    """
    # ── Validate content type ────────────────────────────────────────────
    if file.content_type not in ALLOWED_REPORT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{file.content_type}'. "
                f"Allowed: PDF, JPEG, PNG, TIFF, BMP"
            ),
        )

    # ── Read & size-check ────────────────────────────────────────────────
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Maximum allowed: {MAX_FILE_SIZE_MB} MB.",
        )

    logger.info(
        "Report received: name='%s', type='%s', size=%.2f MB",
        file.filename, file.content_type, size_mb,
    )

    # ── Step 1: Extract text + clinical fields ───────────────────────────
    # analyse_report returns 7-tuple:
    #   (fallback_label, fallback_conf, t_score, bmd, evidence, extracted_data, raw_features_16)
    (
        fallback_label,
        fallback_conf,
        t_score_val,
        bmd_val,
        evidence_source,
        extracted_data,
        raw_features_16,
    ) = analyse_report(contents, filename=file.filename or "")

    n_fields = len(extracted_data)
    logger.info(
        "Report extraction: %d fields found, fallback label=%s, T-score=%s",
        n_fields, fallback_label, t_score_val,
    )

    # ── Step 2: Tabular Ensemble model path ──────────────────────────────
    if is_model_loaded() and raw_features_16 is not None:
        model  = get_model()
        scaler = get_scaler()
        try:
            x = np.array(raw_features_16, dtype=np.float64).reshape(1, -1)
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                x_scaled   = scaler.transform(x)
                raw_pred   = model.predict(x_scaled)[0]
                proba      = model.predict_proba(x_scaled)[0]

            model_class = int(raw_pred)
            model_conf  = float(proba[model_class])

            # Refine 2-class → 3-class using extracted T-score
            label = _refine_label_with_tscore(model_class, model_conf, t_score_val)

            # Confidence correctly reflects the FINAL label and field coverage
            confidence = _compute_report_confidence(
                model_class, proba, label, t_score_val, n_fields
            )

            # Build evidence string
            prob_str = f"P(Normal)={proba[0]:.1%}  P(Osteoporosis)={proba[1]:.1%}"
            override_note = ""
            if label != _MODEL_CLASSES[model_class]:
                override_note = f" — label refined via T-score ({t_score_val:+.2f})" if t_score_val is not None else " — borderline confidence"
            evidence = (
                f"Tabular Ensemble — {n_fields}/{_MAX_FIELDS} fields extracted"
                f" — {prob_str}{override_note}"
            )

            logger.info(
                "Report ML: raw_class=%d(%s) → final=%s  conf=%.4f (coverage %d/%d fields)",
                model_class, _MODEL_CLASSES[model_class], label, confidence, n_fields, _MAX_FIELDS,
            )

        except Exception as exc:
            logger.error("Tabular model inference on report failed: %s — using fallback", exc)
            label, confidence = fallback_label, fallback_conf
            evidence = f"{evidence_source} (ML error: {exc})"

    # ── Step 3: Rule-based fallback ──────────────────────────────────────
    else:
        logger.info("Tabular model not loaded — using rule-based extraction result.")
        label, confidence = fallback_label, fallback_conf
        evidence = evidence_source

    # ── Derive T-score / BMD if not already extracted ────────────────────
    final_t   = round(t_score_val, 2) if t_score_val is not None else build_t_score(label)
    final_bmd = round(bmd_val, 3)     if bmd_val     is not None else build_bmd(label)

    clinical = get_clinical_data(label)

    return PredictionResponse(
        prediction=label,
        confidence=confidence,
        t_score=final_t,
        bmd=final_bmd,
        fracture_risk=clinical["fracture_risk"],
        suggestions=clinical["suggestions"],
        medications=clinical["medications"],
        evidence_source=evidence,
        extracted_data=extracted_data if extracted_data else None,
    )
