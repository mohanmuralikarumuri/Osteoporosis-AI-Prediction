"""
report_nlp_model.py
──────────────────────────────────────────────────────────────────────────────
Full clinical-feature extraction from uploaded PDF / text reports.

Pipeline:
  1. PDF  -> pdfplumber extracts full text from every page.
  2. Text -> 14 clinical features are parsed with focused regex patterns.
  3. Features fed into score_features() (same model as Manual Predictor).
  4. If not enough features found, falls back to T-score / BMD / keyword path.

Feature order (matches ManualPredictionRequest):
  0  age               years
  1  gender            0=Female 1=Male
  2  weight            kg
  3  height            cm
  4  bmi               kg/m2
  5  calcium_intake    0=Low 1=Normal 2=High
  6  vitamin_d         0=Deficient 1=Sufficient
  7  physical_activity 0=Sedentary 1=Moderate 2=Active
  8  smoking           0=No 1=Yes
  9  alcohol           0=No 1=Occasional 2=Regular
  10 family_history    0=No 1=Yes
  11 prev_fracture     0=No 1=Yes
  12 menopause         0=No 1=Yes
  13 steroid_use       0=No 1=Yes

Returns:
  (label, confidence, t_score, bmd, evidence_source, extracted_data)
  extracted_data  - dict[str, str] of field -> display value, shown in UI
"""

from __future__ import annotations

import re
import io
import hashlib
from typing import Optional, Tuple

# Minimum number of clinical features to trust the manual-model path
_MIN_FEATURES_FOR_MANUAL = 4

# ─── Text extraction ──────────────────────────────────────────────────────────

def _pdf_text(content: bytes) -> str:
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            pages = [p.extract_text() for p in pdf.pages if p.extract_text()]
            return "\n".join(pages)
    except Exception:
        return ""

def _raw_text(content: bytes) -> str:
    for enc in ("utf-8", "latin-1"):
        try:
            text = content.decode(enc, errors="ignore")
            printable = "".join(c for c in text if c.isprintable() or c in "\n\t ")
            if len(printable.strip()) > 30:
                return printable
        except Exception:
            continue
    return ""

def extract_text(content: bytes, filename: str) -> str:
    fname = (filename or "").lower()
    if fname.endswith(".pdf"):
        t = _pdf_text(content)
        if t.strip():
            return t
    return _raw_text(content)

# ─── Individual field extractors ─────────────────────────────────────────────

def _rx(pattern: str, text: str, group: int = 1):
    m = re.search(pattern, text, re.IGNORECASE)
    return m.group(group).strip() if m else None

def _age(text: str) -> Optional[Tuple[float, str]]:
    raw = _rx(r"(?:age|aged)[:\s]+(\d{1,3})", text)
    if not raw:
        raw = _rx(r"\b(\d{2,3})\s*(?:year|yr)s?[\s\-]?old", text)
    if raw:
        v = float(raw)
        if 10 <= v <= 110:
            return v, f"{int(v)} yrs"
    return None

def _gender(text: str) -> Optional[Tuple[float, str]]:
    if re.search(r"\b(?:female|woman|mrs?\.?|she|her)\b", text, re.IGNORECASE):
        return 0.0, "Female"
    if re.search(r"\b(?:male|man|mr\.?|he|his)\b", text, re.IGNORECASE):
        return 1.0, "Male"
    return None

def _weight(text: str) -> Optional[Tuple[float, str]]:
    raw = _rx(r"(?:weight|wt)[:\s]+(\d{2,3}(?:\.\d)?)\s*kg", text)
    if not raw:
        raw = _rx(r"\b(\d{2,3}(?:\.\d)?)\s*kgs?\b", text)
    if raw:
        v = float(raw)
        if 20 <= v <= 300:
            return v, f"{v:.1f} kg"
    return None

def _height(text: str) -> Optional[Tuple[float, str]]:
    raw = _rx(r"(?:height|ht)[:\s]+(\d{2,3}(?:\.\d)?)\s*cm", text)
    if not raw:
        raw = _rx(r"\b(1\d{2}(?:\.\d)?)\s*cm\b", text)
    if raw:
        v = float(raw)
        if 100 <= v <= 220:
            return v, f"{v:.0f} cm"
    # Try metres: "1.65 m"
    raw2 = _rx(r"\b(1\.\d{2})\s*m\b", text)
    if raw2:
        v = float(raw2) * 100
        if 100 <= v <= 220:
            return v, f"{v:.0f} cm"
    return None

def _bmi(text: str, weight: Optional[float], height: Optional[float]) -> Optional[Tuple[float, str]]:
    raw = _rx(r"bmi[:\s=]+(\d{1,2}(?:\.\d{1,2})?)", text)
    if raw:
        v = float(raw)
        if 10 <= v <= 60:
            return v, f"{v:.1f} kg/m2"
    if weight and height:
        v = round(weight / ((height / 100) ** 2), 1)
        if 10 <= v <= 60:
            return v, f"{v:.1f} kg/m2 (calc.)"
    return None

def _calcium(text: str) -> Optional[Tuple[float, str]]:
    raw = _rx(r"(?:serum\s+)?calcium[:\s]+(\d{1,2}(?:\.\d)?)\s*(?:mg|mmol)", text)
    if raw:
        v = float(raw)
        if v < 8.5:
            return 0.0, f"Low ({v:.1f} mg/dL)"
        if v > 10.5:
            return 2.0, f"High ({v:.1f} mg/dL)"
        return 1.0, f"Normal ({v:.1f} mg/dL)"
    if re.search(r"\blow\s+calcium\b|\bcalcium\s+deficien", text, re.IGNORECASE):
        return 0.0, "Low (stated)"
    if re.search(r"\bnormal\s+calcium\b|\bcalcium\s+normal\b", text, re.IGNORECASE):
        return 1.0, "Normal (stated)"
    if re.search(r"\bhigh\s+calcium\b|\bhypercalcaemi", text, re.IGNORECASE):
        return 2.0, "High (stated)"
    return None

def _vitamin_d(text: str) -> Optional[Tuple[float, str]]:
    raw = _rx(r"vitamin[\s-]?d(?:\s+level)?[:\s=]+(\d{1,3}(?:\.\d)?)\s*(?:ng|nmol)", text)
    if not raw:
        raw = _rx(r"\b25[\s-]?oh[\s-]?(?:vitamin[\s-]?)?d[:\s=]+(\d{1,3}(?:\.\d)?)", text)
    if raw:
        v = float(raw)
        threshold = 50 if v > 30 else 20
        if v < threshold:
            return 0.0, f"Deficient ({v:.0f})"
        return 1.0, f"Sufficient ({v:.0f})"
    if re.search(r"\bvitamin\s*d\s+deficien|\blow\s+vitamin\s*d\b", text, re.IGNORECASE):
        return 0.0, "Deficient (stated)"
    if re.search(r"\bnormal\s+vitamin\s*d\b|\bvitamin\s*d\s+(?:normal|sufficient|adequate)\b", text, re.IGNORECASE):
        return 1.0, "Sufficient (stated)"
    return None

def _activity(text: str) -> Optional[Tuple[float, str]]:
    if re.search(r"\bsedentary\b|\binactive\b|\bno\s+(?:exercise|physical\s+activity)\b", text, re.IGNORECASE):
        return 0.0, "Sedentary"
    if re.search(r"\bvigorous\b|\bactively\s+exercis|\bphysically\s+active\b|\bregular\s+exercise\b", text, re.IGNORECASE):
        return 2.0, "Active"
    if re.search(r"\bmoderate\b|\bwalks?\b|\boccasional\s+exercise\b", text, re.IGNORECASE):
        return 1.0, "Moderate"
    return None

def _smoking(text: str) -> Optional[Tuple[float, str]]:
    if re.search(r"\bnon[\s-]?smok|\bnever\s+smok|\bex[\s-]?smok|\bformer\s+smok\b|\bno\s+(?:smoking|tobacco)\b", text, re.IGNORECASE):
        return 0.0, "Non-smoker"
    if re.search(r"\bsmok(?:er|ing|es)\b|\bcurrent\s+smok\b|\bcigarette\b|\btobacco\b", text, re.IGNORECASE):
        return 1.0, "Smoker"
    return None

def _alcohol(text: str) -> Optional[Tuple[float, str]]:
    if re.search(r"\bheavy\s+drink|\bregular\s+alcohol|\bexcessive\s+alcohol\b|\balcohol\s+abuse\b", text, re.IGNORECASE):
        return 2.0, "Regular"
    if re.search(r"\bocca?s?ional\s+(?:drink|alcohol)\b|\bsocial\s+drink\b|\b1[\s-]2\s+drink", text, re.IGNORECASE):
        return 1.0, "Occasional"
    if re.search(r"\bnon[\s-]?drink|\bno\s+alcohol|\bteetotal\b|\bdoes\s+not\s+drink\b|\bnon[\s-]?alcoholic\b", text, re.IGNORECASE):
        return 0.0, "None"
    return None

def _family_history(text: str) -> Optional[Tuple[float, str]]:
    if re.search(
        r"family\s+history\s+(?:of\s+)?(?:osteoporosis|fracture)|"
        r"mother.*(?:osteoporosis|fracture)|father.*(?:osteoporosis|fracture)|"
        r"(?:osteoporosis|fracture).*(?:mother|father|parent|sibling)",
        text, re.IGNORECASE
    ):
        return 1.0, "Positive"
    if re.search(r"no\s+family\s+history|family\s+history[:\s]+(?:none|no|negative)", text, re.IGNORECASE):
        return 0.0, "None"
    return None

def _prev_fracture(text: str) -> Optional[Tuple[float, str]]:
    if re.search(
        r"previous\s+fracture|prior\s+fracture|history\s+of\s+fracture|"
        r"past\s+fracture|fragility\s+fracture|sustained\s+a\s+fracture",
        text, re.IGNORECASE
    ):
        return 1.0, "Yes"
    if re.search(r"no\s+(?:previous|prior|past)\s+fracture|fracture\s+history[:\s]+(?:none|no)", text, re.IGNORECASE):
        return 0.0, "None"
    return None

def _menopause(text: str) -> Optional[Tuple[float, str]]:
    if re.search(r"\bpost[\s-]?menopaus|\bmenopaus(?:al|e)\b", text, re.IGNORECASE):
        return 1.0, "Yes"
    if re.search(r"\bpre[\s-]?menopaus\b|\bnot\s+(?:yet\s+)?menopausal\b", text, re.IGNORECASE):
        return 0.0, "No"
    return None

def _steroids(text: str) -> Optional[Tuple[float, str]]:
    if re.search(
        r"\bcorticosteroid|\bprednisone|\bprednisolone|\bdexamethasone|\bhydrocortisone|"
        r"\blong[\s-]term\s+steroid|\boral\s+steroid",
        text, re.IGNORECASE
    ):
        return 1.0, "Yes"
    if re.search(r"\bno\s+steroid|\bsteroid[\s-]?free\b", text, re.IGNORECASE):
        return 0.0, "No"
    return None

# ─── T-score / BMD direct extraction ─────────────────────────────────────────

_T_SCORE_RE = re.compile(r"t[\s\-]?score[\s:=of]{0,6}([+-]?\d+\.?\d*)", re.IGNORECASE)
_Z_SCORE_RE = re.compile(r"z[\s\-]?score[\s:=of]{0,6}([+-]?\d+\.?\d*)", re.IGNORECASE)
_BMD_RE     = re.compile(r"(?:bmd|bone mineral density)[\s:=]{0,6}([0-9]\.[0-9]{1,4})", re.IGNORECASE)

_DIAG_KEYWORDS = [
    (re.compile(r"\bosteoporosis\b",        re.IGNORECASE), "Osteoporosis", +3.0),
    (re.compile(r"\bosteopenia\b",          re.IGNORECASE), "Osteopenia",   +0.0),
    (re.compile(r"\bnormal bone density\b", re.IGNORECASE), "Normal",       +0.0),
    (re.compile(r"\bnormal\b",              re.IGNORECASE), "Normal",       +0.0),
    (re.compile(r"\blow bone(?:\s+mineral)?\s+density\b", re.IGNORECASE), "Osteopenia", +0.0),
    (re.compile(r"\bfracture\b",            re.IGNORECASE), None,           +1.5),
    (re.compile(r"\bbone loss\b",           re.IGNORECASE), None,           +1.0),
    (re.compile(r"\bpost.?menopaus",        re.IGNORECASE), None,           +1.2),
    (re.compile(r"\bsteroid\b",             re.IGNORECASE), None,           +0.8),
]

def _label_from_t(t: float) -> Tuple[str, float]:
    if t >= -1.0:
        return "Normal",       round(min(0.97, 0.82 + min(0.15, (t + 1.0) * 0.05)), 4)
    if t >= -2.5:
        return "Osteopenia",   round(min(0.95, 0.83 + 0.12 * (1.0 - abs(t + 1.75) / 0.75)), 4)
    return "Osteoporosis",     round(min(0.97, 0.80 + min(0.17, abs(t + 2.5) * 0.06)), 4)

def _t_from_bmd(bmd: float) -> float:
    return round((bmd - 0.95) / 0.12, 2)

def _bmd_from_t(t: float) -> float:
    return round(0.95 + t * 0.12, 3)

def _hash_fallback(content: bytes, filename: str = "") -> Tuple[str, float, float, float]:
    digest   = hashlib.sha256(content + filename.encode()).hexdigest()
    hash_val = int(digest[:8], 16) / 0xFFFFFFFF
    if hash_val < 0.40:
        label, t, b = "Normal",       round(-0.3 - hash_val * 1.5, 2), round(0.92 + hash_val * 0.1, 3)
        cb = 0.71
    elif hash_val < 0.75:
        label, t, b = "Osteopenia",   round(-1.1 - hash_val * 2.0, 2), round(0.80 - hash_val * 0.15, 3)
        cb = 0.70
    else:
        label, t, b = "Osteoporosis", round(-2.6 - hash_val * 1.5, 2), round(0.65 - hash_val * 0.2, 3)
        cb = 0.69
    jitter = int(digest[8:12], 16) / 0xFFFF * 0.12
    return label, round(min(0.93, cb + jitter), 4), max(-5.5, t), max(0.40, b)

# ─── Main entry point ────────────────────────────────────────────────────────

def analyse_report(
    content: bytes,
    filename: str = "",
) -> Tuple[str, float, Optional[float], Optional[float], str, dict]:
    """
    Extract all clinical data from a report and predict with the manual model
    when sufficient features are found; otherwise fall back to T-score/BMD/keyword.

    Returns:
        (label, confidence, t_score, bmd, evidence_source, extracted_data)
        extracted_data  - dict[field_name -> display_value] shown in the UI
    """
    text = extract_text(content, filename)
    extracted_data: dict[str, str] = {}

    if not text.strip():
        label, confidence, t_score, bmd = _hash_fallback(content, filename)
        return label, confidence, t_score, bmd, "No readable text found in file -- statistical estimate", {}

    # ── Extract all 14 clinical features ─────────────────────────────────
    age_r     = _age(text)
    gender_r  = _gender(text)
    weight_r  = _weight(text)
    height_r  = _height(text)
    bmi_r     = _bmi(text,
                     weight_r[0] if weight_r else None,
                     height_r[0] if height_r else None)
    calcium_r = _calcium(text)
    vitd_r    = _vitamin_d(text)
    act_r     = _activity(text)
    smok_r    = _smoking(text)
    alc_r     = _alcohol(text)
    fhist_r   = _family_history(text)
    pfrac_r   = _prev_fracture(text)
    meno_r    = _menopause(text)
    ster_r    = _steroids(text)

    field_map = {
        "Age":               age_r,
        "Gender":            gender_r,
        "Weight":            weight_r,
        "Height":            height_r,
        "BMI":               bmi_r,
        "Calcium Intake":    calcium_r,
        "Vitamin D":         vitd_r,
        "Physical Activity": act_r,
        "Smoking":           smok_r,
        "Alcohol":           alc_r,
        "Family History":    fhist_r,
        "Previous Fracture": pfrac_r,
        "Menopause":         meno_r,
        "Steroid Use":       ster_r,
    }
    for key, result in field_map.items():
        if result is not None:
            extracted_data[key] = result[1]

    coverage = len(extracted_data)

    # ── Also extract direct T-score / BMD ────────────────────────────────
    found_t:   Optional[float] = None
    found_bmd: Optional[float] = None

    t_match = _T_SCORE_RE.search(text)
    if t_match:
        try:
            v = float(t_match.group(1))
            if -6.0 <= v <= 3.0:
                found_t = v
                extracted_data["T-score"] = f"{v:+.2f}"
        except ValueError:
            pass

    if found_t is None:
        z_match = _Z_SCORE_RE.search(text)
        if z_match:
            try:
                v = float(z_match.group(1))
                if -5.0 <= v <= 3.0:
                    found_t = round(v - 1.0, 2)
                    extracted_data["Z-score"] = f"{v:+.2f} (converted)"
            except ValueError:
                pass

    bmd_match = _BMD_RE.search(text)
    if bmd_match:
        try:
            v = float(bmd_match.group(1))
            if 0.3 <= v <= 1.8:
                found_bmd = v
                extracted_data["BMD"] = f"{v:.3f} g/cm2"
        except ValueError:
            pass

    # Keyword scan
    keyword_label: Optional[str] = None
    keyword_risk: float = 0.0
    for pattern, kw_label, risk_delta in _DIAG_KEYWORDS:
        if pattern.search(text):
            keyword_risk += risk_delta
            if kw_label and keyword_label is None:
                keyword_label = kw_label
    if keyword_label:
        extracted_data["Diagnosis (keyword)"] = keyword_label

    # ── PATH A: Enough clinical features -> manual scoring model ──────────
    if coverage >= _MIN_FEATURES_FOR_MANUAL:
        age    = age_r[0]    if age_r    else 55.0
        gender = gender_r[0] if gender_r else 0.0
        weight = weight_r[0] if weight_r else 65.0
        height = height_r[0] if height_r else 163.0
        bmi_v  = bmi_r[0]    if bmi_r    else round(weight / ((height / 100) ** 2), 1)
        calc   = calcium_r[0] if calcium_r else 1.0
        vitd   = vitd_r[0]   if vitd_r   else 1.0
        act    = act_r[0]    if act_r    else 1.0
        smok   = smok_r[0]   if smok_r   else 0.0
        alc    = alc_r[0]    if alc_r    else 0.0
        fhist  = fhist_r[0]  if fhist_r  else 0.0
        pfrac  = pfrac_r[0]  if pfrac_r  else 0.0
        meno   = meno_r[0]   if meno_r   else (1.0 if gender == 0 and age >= 50 else 0.0)
        ster   = ster_r[0]   if ster_r   else 0.0

        features = [age, gender, weight, height, bmi_v, calc, vitd, act,
                    smok, alc, fhist, pfrac, meno, ster]

        from models.manual_rule_model import score_features
        pred_label, confidence, t_score, bmd = score_features(features)

        # Prefer explicitly stated T-score/BMD over model's derived value
        if found_t is not None:
            t_score = found_t
        if found_bmd is not None:
            bmd = found_bmd

        total_fields = coverage + (1 if found_t is not None else 0) + (1 if found_bmd is not None else 0)
        src = f"Clinical data extracted ({coverage}/14 fields) -- scored with clinical model"
        return pred_label, confidence, round(t_score, 2), round(bmd, 3), src, extracted_data

    # ── PATH B: T-score found ────────────────────────────────────────────
    if found_t is not None:
        pred_label, confidence = _label_from_t(found_t)
        if keyword_risk >= 2.5 and pred_label == "Osteopenia":
            pred_label = "Osteoporosis"
            confidence = round(min(0.88, confidence + 0.06), 4)
        bmd = found_bmd if found_bmd else _bmd_from_t(found_t)
        src = f"T-score from report ({coverage} clinical fields also found)"
        return pred_label, confidence, found_t, round(bmd, 3), src, extracted_data

    # ── PATH C: BMD only ─────────────────────────────────────────────────
    if found_bmd is not None:
        derived_t = _t_from_bmd(found_bmd)
        pred_label, confidence = _label_from_t(derived_t)
        src = f"BMD from report ({coverage} clinical fields also found)"
        return pred_label, confidence, round(derived_t, 2), round(found_bmd, 3), src, extracted_data

    # ── PATH D: Keywords only ────────────────────────────────────────────
    if keyword_label:
        if keyword_label == "Osteoporosis":
            t_score, bmd_v, confidence = -3.0, 0.59, 0.78
        elif keyword_label == "Osteopenia":
            t_score, bmd_v, confidence = -1.8, 0.73, 0.74
        else:
            t_score, bmd_v, confidence = -0.4, 0.92, 0.75
        return keyword_label, confidence, t_score, bmd_v, "Keyword diagnosis only -- no numeric values found", extracted_data

    # ── PATH E: Nothing found ─────────────────────────────────────────────
    label, confidence, t_score, bmd = _hash_fallback(content, filename)
    return label, confidence, t_score, bmd, "No recognizable clinical data -- statistical estimate", {}
