"""
manual_rule_model.py
──────────────────────────────────────────────────────────────────────────────
Rule-based clinical scoring model for the Manual Predictor.

Feature order (14 values, matches ManualPredictionRequest):
  0  age              years
  1  gender           0=Female  1=Male
  2  weight           kg
  3  height           cm
  4  bmi              kg/m²
  5  calcium_intake   0=Low  1=Normal  2=High
  6  vitamin_d        0=Deficient  1=Sufficient
  7  physical_activity 0=Sedentary  1=Moderate  2=Active
  8  smoking          0=No  1=Yes
  9  alcohol          0=No  1=Occasional  2=Regular
  10 family_history   0=No  1=Yes
  11 prev_fracture    0=No  1=Yes
  12 menopause        0=No/N-A  1=Yes
  13 steroid_use      0=No  1=Yes

Returns: (label: str, confidence: float, t_score: float, bmd: float)
"""

import math
import random
from typing import Tuple

# ── Scoring weights ─────────────────────────────────────────────────────────
# Each factor contributes to a cumulative RISK SCORE (higher = worse).
# Max theoretical score ≈ 27.

def _age_score(age: float) -> float:
    """Age is the single strongest predictor."""
    if age < 40:   return 0.0
    if age < 50:   return 1.0
    if age < 60:   return 2.5
    if age < 70:   return 4.5
    return 6.0


def _bmi_score(bmi: float) -> float:
    """Low BMI (<18.5) is a significant risk; obesity mildly protective."""
    if bmi < 17.5:  return 3.0
    if bmi < 18.5:  return 2.0
    if bmi < 22.0:  return 1.0
    if bmi < 30.0:  return 0.0
    return 0.5   # obesity slightly protective but other risks


def _derive_bmi(weight: float, height: float) -> float:
    if height <= 0:
        return 22.0  # fallback
    return weight / ((height / 100) ** 2)


def score_features(features: list) -> Tuple[str, float, float, float]:
    """
    Compute a clinical risk score from the 14 feature vector and return
    (label, confidence, t_score, bmd).
    """
    # Pad with defaults if fewer features supplied
    f = list(features) + [0] * 14
    f = f[:14]

    age        = float(f[0])
    gender     = int(f[1])        # 0=Female, 1=Male
    weight     = float(f[2])
    height     = float(f[3])
    bmi        = float(f[4]) if float(f[4]) > 5 else _derive_bmi(weight, height)
    ca_intake  = int(f[5])        # 0=Low, 1=Normal, 2=High
    vit_d      = int(f[6])        # 0=Deficient, 1=Sufficient
    activity   = int(f[7])        # 0=Sedentary, 1=Moderate, 2=Active
    smoking    = int(f[8])
    alcohol    = int(f[9])
    fam_hist   = int(f[10])
    prev_frac  = int(f[11])
    menopause  = int(f[12])
    steroid    = int(f[13])

    # ── Accumulate risk score ────────────────────────────────────────────
    risk = 0.0

    risk += _age_score(age)
    risk += _bmi_score(bmi)

    # Gender: females post-menopause carry much higher risk
    if gender == 0:          risk += 1.5   # female baseline
    if menopause == 1:       risk += 2.5   # post-menopausal

    # Nutrition deficiencies
    if ca_intake == 0:       risk += 1.5
    elif ca_intake == 1:     risk += 0.5
    # ca_intake == 2 adds 0 (protective)

    if vit_d == 0:           risk += 1.5

    # Lifestyle
    if activity == 0:        risk += 1.5
    elif activity == 1:      risk += 0.5
    # activity == 2 is neutral / slightly protective

    if smoking == 1:         risk += 1.5
    if alcohol == 2:         risk += 1.0
    elif alcohol == 1:       risk += 0.3

    # Clinical history — strongest individual predictors
    if fam_hist == 1:        risk += 2.0
    if prev_frac == 1:       risk += 3.0
    if steroid == 1:         risk += 2.5

    # ── Map score → label with sigmoid-like confidence ──────────────────
    # Calibrated thresholds:  <6 Normal | 6-13 Osteopenia | >13 Osteoporosis
    LOW_THRESH  = 6.0
    HIGH_THRESH = 13.0

    if risk < LOW_THRESH:
        label = "Normal"
        # confidence: 0.72 at threshold → 0.97 at 0
        t = 1.0 - (risk / LOW_THRESH)           # 0..1
        confidence = 0.72 + 0.25 * t
    elif risk <= HIGH_THRESH:
        label = "Osteopenia"
        # confidence peaks near mid-range, lower near thresholds
        mid = (LOW_THRESH + HIGH_THRESH) / 2
        dist_from_mid = abs(risk - mid) / ((HIGH_THRESH - LOW_THRESH) / 2)
        confidence = 0.75 + 0.15 * (1.0 - dist_from_mid)
    else:
        label = "Osteoporosis"
        t = min((risk - HIGH_THRESH) / 8.0, 1.0)  # 0..1
        confidence = 0.74 + 0.24 * t

    # Clamp confidence
    confidence = max(0.70, min(0.99, confidence))

    # ── Derive T-score and BMD from risk score (clinically plausible) ───
    # T-score: Normal ≥ -1.0 | Osteopenia -1.0 to -2.5 | Osteoporosis ≤ -2.5
    # Map risk 0..27 → T-score 0.5 .. -4.5
    t_score_raw = 0.5 - (risk / 27.0) * 5.0
    # Add small deterministic jitter from features (reproducible)
    jitter = ((sum(f) * 7.3) % 1.0 - 0.5) * 0.3
    t_score = round(t_score_raw + jitter, 2)

    # BMD: roughly 1.0 for Normal → 0.5 for severe Osteoporosis
    # Normal BMD ~0.9-1.1, Osteopenia 0.7-0.9, Osteoporosis 0.4-0.7
    bmd_raw = 1.05 - (risk / 27.0) * 0.65
    bmd_jitter = ((sum(f) * 3.7) % 1.0 - 0.5) * 0.05
    bmd = round(max(0.4, min(1.2, bmd_raw + bmd_jitter)), 3)

    return label, round(confidence, 4), t_score, bmd
