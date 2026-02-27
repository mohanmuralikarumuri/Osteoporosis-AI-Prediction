"""
utils.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Shared helpers: prediction-class â†’ clinical suggestions & medications mapping.
"""

from typing import Dict, List, Tuple
import random

# â”€â”€â”€ Class label normalisation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# The model may return integer indices OR string labels depending on training.
CLASS_LABEL_MAP: Dict[int, str] = {
    0: "Normal",
    1: "Osteopenia",
    2: "Osteoporosis",
}

# â”€â”€â”€ Clinical knowledge base â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CLINICAL_DATA: Dict[str, Dict[str, List]] = {
    "Normal": {
        "suggestions": [
            "Maintain a calcium-rich diet (dairy, leafy greens, fortified foods).",
            "Continue weight-bearing exercise (walking, jogging, resistance training) 3-5x/week.",
            "Ensure adequate Vitamin D via sunlight or supplementation.",
            "Schedule a DEXA scan every 2 years after age 50.",
            "Avoid smoking and excessive alcohol consumption.",
            "Monitor bone health annually with your primary care physician.",
        ],
        "medications": [
            "Calcium supplement: 1000 mg/day (dietary preferred)",
            "Vitamin D3: 600-800 IU/day",
            "No pharmacological treatment required at this stage.",
        ],
        "t_score_range": (-1.0, 0.5),
        "bmd_range": (0.90, 1.10),
        "fracture_risk": "< 5% (Low)",
    },
    "Osteopenia": {
        "suggestions": [
            "Increase daily calcium intake to 1200 mg through diet and supplements.",
            "Supplement Vitamin D to 800-1000 IU/day.",
            "Engage in regular high-impact weight-bearing and resistance exercises.",
            "Implement fall-prevention strategies at home (remove trip hazards, improve lighting).",
            "Repeat DEXA scan in 1-2 years to monitor bone density changes.",
            "Discuss fracture risk assessment (FRAX) with your physician.",
            "Limit caffeine, alcohol, and sodium  -  all reduce calcium absorption.",
            "Consider physical therapy for balance and posture improvement.",
        ],
        "medications": [
            "Calcium supplement: 1200 mg/day",
            "Vitamin D3: 800-1000 IU/day",
            "Consider bisphosphonates if additional risk factors are present (consult physician).",
            "Hormone Replacement Therapy (HRT)  -  discuss benefits/risks with doctor.",
        ],
        "t_score_range": (-2.5, -1.0),
        "bmd_range": (0.70, 0.90),
        "fracture_risk": "5-20% (Moderate)",
    },
    "Osteoporosis": {
        "suggestions": [
            "Seek immediate consultation with a rheumatologist or endocrinologist.",
            "Begin a medically supervised exercise program focusing on strength and balance.",
            "Strictly implement fall-prevention strategies (grab bars, non-slip mats, proper footwear).",
            "Maintain calcium intake >= 1200 mg/day and Vitamin D >= 1000-2000 IU/day.",
            "Schedule DEXA scan every 1-2 years to assess treatment response.",
            "Undergo spinal X-ray to rule out existing vertebral fractures.",
            "Review all current medications for bone-density side effects (steroids, PPIs, diuretics).",
            "Consider physical therapy and occupational therapy for daily safety.",
            "Discuss FRAX score and 10-year fracture probability with your physician.",
        ],
        "medications": [
            "Bisphosphonates: Alendronate 70 mg weekly  OR  Risedronate 35 mg weekly",
            "Calcium: 1200-1500 mg/day (split doses for better absorption)",
            "Vitamin D3: 1000-2000 IU/day",
            "Denosumab (Prolia): 60 mg subcutaneous injection every 6 months (if bisphosphonate intolerant)",
            "Teriparatide (Forteo): daily injection for severe cases (physician prescribed)",
            "Raloxifene (SERM): for post-menopausal women  -  discuss with doctor",
            "Regular follow-up every 6 months until bone density stabilises.",
        ],
        "t_score_range": (-4.0, -2.5),
        "bmd_range": (0.40, 0.70),
        "fracture_risk": "> 20% (High)",
    },
}


def normalise_label(raw_prediction) -> str:
    """Convert integer index or string label to clean class name.
    Handles Python int, float, numpy int/float, and string labels.
    """
    # Convert numpy scalar types to native Python before isinstance check
    try:
        native = raw_prediction.item()  # works for any numpy scalar
    except AttributeError:
        native = raw_prediction

    if isinstance(native, (int, float)):
        return CLASS_LABEL_MAP.get(int(native), "Normal")
    label = str(native).strip()
    # Handle variations like 'osteoporosis', 'OSTEOPENIA', etc.
    for key in CLASS_LABEL_MAP.values():
        if key.lower() == label.lower():
            return key
    return label  # return as-is if unrecognised


def get_clinical_data(label: str) -> Dict:
    """Return the clinical knowledge block for a given label."""
    return CLINICAL_DATA.get(label, CLINICAL_DATA["Normal"])


def simulate_prediction() -> Tuple[str, float]:
    """
    Deterministic-ish simulation for file-based endpoints until a real
    image/PDF model is integrated.

    Returns (label, confidence).
    """
    labels = ["Normal", "Osteopenia", "Osteoporosis"]
    weights = [0.35, 0.40, 0.25]  # realistic population distribution
    label = random.choices(labels, weights=weights, k=1)[0]
    confidence = round(random.uniform(0.72, 0.96), 4)
    return label, confidence


def build_t_score(label: str) -> float:
    """Generate a realistic T-score within the expected range for the class."""
    lo, hi = CLINICAL_DATA[label]["t_score_range"]
    return round(random.uniform(lo, hi), 2)


def build_bmd(label: str) -> float:
    lo, hi = CLINICAL_DATA[label]["bmd_range"]
    return round(random.uniform(lo, hi), 3)

