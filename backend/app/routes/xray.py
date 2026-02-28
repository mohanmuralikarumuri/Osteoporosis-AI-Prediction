"""
routes/xray.py
─────────────────────────────────────────────────────────────────────────────
POST /predict/xray

Accepts a bone X-ray image (JPEG, PNG, TIFF, BMP, DICOM).

Primary path  : EfficientNet-B3 CNN  (efficientnet_b3_osteoporosis.pth)
Fallback path : Multi-feature heuristic image analysis (no GPU required)

EfficientNet-B3 details:
  • Input  : 300×300 RGB, ImageNet normalisation
  • Output : 3-class softmax  →  Normal | Osteopenia | Osteoporosis
"""

import logging
from fastapi import APIRouter, File, UploadFile, HTTPException

from app.schemas import PredictionResponse
from app.utils import get_clinical_data, build_t_score, build_bmd
from app.model_loader import get_xray_model, is_xray_model_loaded
from models.xray_vision_model import analyse_xray, analyse_xray_cnn

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predict", tags=["X-Ray Prediction"])

ALLOWED_XRAY_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/tiff",
    "image/bmp",
    "image/dicom",
    "application/dicom",
    "image/webp",
}
MAX_FILE_SIZE_MB = 30


@router.post(
    "/xray",
    response_model=PredictionResponse,
    summary="Predict osteoporosis from a bone X-ray image",
    description=(
        "Upload a bone X-ray image (JPEG, PNG, TIFF, BMP, DICOM, WebP). "
        "Primary model: EfficientNet-B3 fine-tuned on bone X-rays (3-class). "
        "Falls back to heuristic analysis when the CNN model is unavailable."
    ),
)
async def predict_xray(
    file: UploadFile = File(..., description="Bone X-ray image (JPEG/PNG/TIFF/BMP/DICOM/WebP)"),
) -> PredictionResponse:
    """
    Analyse an uploaded bone X-ray for osteoporosis risk.

    - **file**: JPEG / PNG / TIFF / BMP / DICOM / WebP (max 30 MB)
    """
    # ── Validate content type ────────────────────────────────────────────
    if file.content_type not in ALLOWED_XRAY_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{file.content_type}'. "
                "Allowed: JPEG, PNG, TIFF, BMP, DICOM, WebP"
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
        "X-ray received: name='%s', type='%s', size=%.2f MB",
        file.filename,
        file.content_type,
        size_mb,
    )

    # ── EfficientNet-B3 CNN (primary) ────────────────────────────────────
    if is_xray_model_loaded():
        try:
            cnn_model = get_xray_model()
            label, confidence, t_score_val, bmd_val, analysis_metrics = analyse_xray_cnn(
                contents, cnn_model
            )
            evidence = (
                f"EfficientNet-B3 deep CNN — "
                f"P(Normal)={analysis_metrics.get('P(Normal)', '?')}  "
                f"P(Osteopenia)={analysis_metrics.get('P(Osteopenia)', '?')}  "
                f"P(Osteoporosis)={analysis_metrics.get('P(Osteoporosis)', '?')}"
            )
            logger.info(
                "EfficientNet-B3 prediction: %s (confidence=%.4f)", label, confidence
            )
        except Exception as exc:
            logger.error("CNN inference failed, falling back to heuristic: %s", exc)
            label, confidence, t_score_val, bmd_val, analysis_metrics = analyse_xray(contents)
            evidence = f"Heuristic analysis (CNN error: {exc})"

    # ── Heuristic fallback (CNN not loaded) ──────────────────────────────
    else:
        logger.info("EfficientNet-B3 not loaded — using heuristic image analysis.")
        label, confidence, t_score_val, bmd_val, analysis_metrics = analyse_xray(contents)
        evidence = f"Heuristic multi-feature image analysis ({len(analysis_metrics)} metrics)"

    clinical = get_clinical_data(label)

    return PredictionResponse(
        prediction=label,
        confidence=round(confidence, 4),
        t_score=round(t_score_val, 2),
        bmd=round(bmd_val, 3),
        fracture_risk=clinical["fracture_risk"],
        suggestions=clinical["suggestions"],
        medications=clinical["medications"],
        evidence_source=evidence,
        extracted_data=analysis_metrics if analysis_metrics else None,
    )
