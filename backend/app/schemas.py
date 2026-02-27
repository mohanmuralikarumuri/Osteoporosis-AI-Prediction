"""
schemas.py
─────────────────────────────────────────────────────────────────────────────
Pydantic models for request validation and response serialisation.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


# ─── Request Models ────────────────────────────────────────────────────────

class ManualPredictionRequest(BaseModel):
    """
    14 clinical features collected from the manual predictor form.

    Expected order (must match training feature order):
      0  age              – years
      1  gender           – 0 = Female, 1 = Male
      2  weight           – kg
      3  height           – cm
      4  bmi              – kg/m²  (can be derived, kept for explicitness)
      5  calcium_intake   – mg/day  (0=Low, 1=Normal, 2=High)
      6  vitamin_d        – IU/day  (0=Deficient, 1=Sufficient)
      7  physical_activity– 0=Sedentary, 1=Moderate, 2=Active
      8  smoking          – 0=No, 1=Yes
      9  alcohol          – 0=No, 1=Occasional, 2=Regular
      10 family_history   – 0=No, 1=Yes
      11 prev_fracture    – 0=No, 1=Yes
      12 menopause        – 0=N/A or No, 1=Yes
      13 steroid_use      – 0=No, 1=Yes
    """
    features: List[float] = Field(
        ...,
        min_length=1,
        description="Ordered list of clinical feature values",
        examples=[[65, 0, 58.0, 162.0, 22.1, 1, 0, 0, 0, 0, 1, 1, 1, 0]],
    )

    @field_validator("features")
    @classmethod
    def check_feature_length(cls, v: List[float]) -> List[float]:
        if len(v) not in range(1, 21):
            raise ValueError("features list must contain between 1 and 20 values")
        return v


# ─── Response Models ───────────────────────────────────────────────────────

class PredictionResponse(BaseModel):
    """Unified prediction response returned by all three endpoints."""
    prediction: str = Field(..., description="Predicted class: Normal | Osteopenia | Osteoporosis")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence (0–1)")
    t_score: Optional[float] = Field(None, description="Estimated T-Score (manual only)")
    bmd: Optional[float] = Field(None, description="Estimated BMD g/cm²  (manual only)")
    fracture_risk: Optional[str] = Field(None, description="10-year fracture risk estimate")
    suggestions: List[str] = Field(..., description="Lifestyle & clinical recommendations")
    medications: List[str] = Field(..., description="Suggested medications / supplements")
    evidence_source: Optional[str] = Field(None, description="What the model extracted/read from the file")
    extracted_data: Optional[Dict[str, str]] = Field(None, description="Clinical values extracted from the report")


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str
