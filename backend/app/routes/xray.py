"""
routes/xray.py
─────────────────────────────────────────────────────────────────────────────
POST /predict/xray

Accepts a bone X-ray image.

Current behaviour  : returns a simulated prediction.
Future integration : replace the simulation block with a real CNN / ViT model
                     (e.g. DenseNet-121 fine-tuned on bone X-ray datasets)
                     inside the clearly marked section below.
"""

import logging
from fastapi import APIRouter, File, UploadFile, HTTPException

from app.schemas import PredictionResponse
from app.utils import get_clinical_data, simulate_prediction, build_t_score, build_bmd
from models.xray_vision_model import analyse_xray

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
}
MAX_FILE_SIZE_MB = 30


@router.post(
    "/xray",
    response_model=PredictionResponse,
    summary="Predict osteoporosis from a bone X-ray image",
    description=(
        "Upload a bone X-ray image (JPEG, PNG, TIFF, BMP, DICOM). "
        "The model detects cortical thickness changes and trabecular patterns "
        "to estimate osteoporosis risk."
    ),
)
async def predict_xray(
    file: UploadFile = File(..., description="Bone X-ray image (JPEG/PNG/TIFF/BMP/DICOM)"),
) -> PredictionResponse:
    """
    Analyse an uploaded bone X-ray for osteoporosis risk.

    - **file**: JPEG / PNG / TIFF / BMP / DICOM (max 30 MB)
    """
    # ── Validate content type ────────────────────────────────────────────
    if file.content_type not in ALLOWED_XRAY_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{file.content_type}'. "
                f"Allowed: JPEG, PNG, TIFF, BMP, DICOM"
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
        "X-ray file received: name='%s', type='%s', size=%.2f MB",
        file.filename,
        file.content_type,
        size_mb,
    )

    # ════════════════════════════════════════════════════════════════════
    # 🔮  FUTURE: Replace this block with a real CNN / ViT image model
    #
    #    Recommended integration path:
    #      1. Decode image bytes → PIL Image or OpenCV ndarray
    #           from PIL import Image; import io
    #           img = Image.open(io.BytesIO(contents)).convert("RGB")
    #
    #      2. Preprocess (resize, normalise, tensor conversion)
    #           tensor = preprocess_transform(img).unsqueeze(0)
    #
    #      3. Run inference
    #           with torch.no_grad():
    #               logits = xray_cnn_model(tensor)
    #               proba  = torch.softmax(logits, dim=1).numpy()[0]
    #
    #      4. Map to label
    #           label      = CLASS_LABEL_MAP[int(np.argmax(proba))]
    #           confidence = float(np.max(proba))
    #
    #    Suggested model architectures:
    #      • DenseNet-121 (torchvision)
    #      • EfficientNet-B4
    #      • Vision Transformer (ViT-B/16)
    # ════════════════════════════════════════════════════════════════════
    label, confidence, t_score_val, bmd_val, analysis_metrics = analyse_xray(contents)
    logger.info("X-ray model result: %s (%.4f) — %d metrics", label, confidence, len(analysis_metrics))

    clinical = get_clinical_data(label)

    return PredictionResponse(
        prediction=label,
        confidence=round(confidence, 4),
        t_score=round(t_score_val, 2),
        bmd=round(bmd_val, 3),
        fracture_risk=clinical["fracture_risk"],
        suggestions=clinical["suggestions"],
        medications=clinical["medications"],
        evidence_source=f"Multi-feature image analysis ({len(analysis_metrics)} metrics computed)",
        extracted_data=analysis_metrics if analysis_metrics else None,
    )
