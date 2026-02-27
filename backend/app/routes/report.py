"""
routes/report.py
─────────────────────────────────────────────────────────────────────────────
POST /predict/report

Accepts a PDF or image file (DEXA report / medical document).

Current behaviour  : returns a simulated prediction.
Future integration : replace the simulation block with a real NLP/vision model
                     (e.g. a fine-tuned BERT for DEXA report parsing or a
                      document-layout model) inside the clearly marked section.
"""

import logging
from fastapi import APIRouter, File, UploadFile, HTTPException

from app.schemas import PredictionResponse
from app.utils import get_clinical_data, simulate_prediction, build_t_score, build_bmd
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


@router.post(
    "/report",
    response_model=PredictionResponse,
    summary="Predict osteoporosis from a DEXA / medical report file",
    description=(
        "Upload a PDF or image of a DEXA scan report or medical document. "
        "Returns a structured clinical prediction with confidence, suggestions, "
        "and recommended medications."
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
        "Report file received: name='%s', type='%s', size=%.2f MB",
        file.filename,
        file.content_type,
        size_mb,
    )

    # ════════════════════════════════════════════════════════════════════
    # 🔮  FUTURE: Replace this block with a real NLP / document-vision model
    #
    #    Examples:
    #      • Extract T-Score / BMD values from PDF text via pdfplumber + regex
    #      • Use a fine-tuned LayoutLM model for structured report extraction
    #      • Feed image pages through a vision transformer (ViT / DocFormer)
    #
    #    Pattern to follow:
    #      label, confidence = report_model.predict(contents, file.content_type)
    # ════════════════════════════════════════════════════════════════════
    label, confidence, t_score_val, bmd_val, evidence_source, extracted_data = analyse_report(
        contents, filename=file.filename or ""
    )
    logger.info(
        "Report model result: %s (%.4f) — source: %s — %d fields extracted",
        label, confidence, evidence_source, len(extracted_data)
    )

    clinical = get_clinical_data(label)

    return PredictionResponse(
        prediction=label,
        confidence=round(confidence, 4),
        t_score=round(t_score_val, 2) if t_score_val is not None else None,
        bmd=round(bmd_val, 3) if bmd_val is not None else None,
        fracture_risk=clinical["fracture_risk"],
        suggestions=clinical["suggestions"],
        medications=clinical["medications"],
        evidence_source=evidence_source,
        extracted_data=extracted_data if extracted_data else None,
    )
