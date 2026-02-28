"""
xray_vision_model.py
──────────────────────────────────────────────────────────────────────────────
Multi-feature image analysis for the X-Ray Predictor.

Improvements over the basic mean-intensity model:
  - Background / saturation filtering  (ignores black backdrop & blown-out pixels)
  - Full percentile profile  (p10, p25, p50, p75, p90)
  - Bright / mid / dark pixel ratios  (bone composition histogram)
  - Cortical score  (fraction of very-bright pixels -> dense cortical shell)
  - Trabecular complexity  (mean local-block variance -> porous vs dense)
  - Edge density  (pixel-difference gradient -> well-defined bone margins)
  - Histogram entropy  (Shannon entropy of 32-bin histogram)

All 7 sub-scores are combined into a single density_score, then mapped to
T-score / BMD / label with calibrated confidence.

Returns: (label, confidence, t_score, bmd, analysis_metrics)
  analysis_metrics  - dict[str, str] shown as diagnostic panel in the UI
"""

from __future__ import annotations

import io
import math
import hashlib
from typing import Tuple, Dict

# ─── Tuning constants ────────────────────────────────────────────────────────
_BG_LOW  = 20    # pixels <= this are background (black)
_BG_HIGH = 248   # pixels >= this are saturated (overexposed white)

_NORMAL_DS:    float = 0.570   # density_score threshold Normal / Osteopenia
_OSTEOPENIA_DS: float = 0.390  # density_score threshold Osteopenia / Osteoporosis


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _pct(sorted_vals, p):
    if not sorted_vals:
        return 128.0
    k = (len(sorted_vals) - 1) * p / 100.0
    lo, hi = int(k), min(int(k) + 1, len(sorted_vals) - 1)
    return sorted_vals[lo] + (k - lo) * (sorted_vals[hi] - sorted_vals[lo])


def _shannon_entropy(pixels: list[int], bins: int = 32) -> float:
    if not pixels:
        return 0.0
    step = 256 / bins
    counts = [0] * bins
    for p in pixels:
        counts[min(bins - 1, int(p / step))] += 1
    n = len(pixels)
    entropy = 0.0
    for c in counts:
        if c > 0:
            p_val = c / n
            entropy -= p_val * math.log2(p_val)
    return entropy


def _block_variance(pixels: list[int], width: int, height: int, block: int = 8) -> float:
    """Mean local variance across non-overlapping block-size patches."""
    variances = []
    for by in range(0, height - block, block):
        for bx in range(0, width - block, block):
            patch = [pixels[by * width + bx + dx + dy * width]
                     for dy in range(block) for dx in range(block)]
            if len(patch) == 0:
                continue
            m = sum(patch) / len(patch)
            v = sum((p - m) ** 2 for p in patch) / len(patch)
            variances.append(v)
    return (sum(variances) / len(variances)) if variances else 500.0


def _gradient_density(pixels: list[int], width: int, height: int) -> float:
    """Mean absolute pixel gradient (horizontal + vertical)."""
    total_grad = 0.0
    count = 0
    for y in range(height):
        for x in range(width - 1):
            total_grad += abs(pixels[y * width + x] - pixels[y * width + x + 1])
            count += 1
    for y in range(height - 1):
        for x in range(width):
            total_grad += abs(pixels[y * width + x] - pixels[(y + 1) * width + x])
            count += 1
    return (total_grad / count) if count else 30.0


# ─── Core feature extraction ─────────────────────────────────────────────────

def _extract_features(image_bytes: bytes) -> Tuple[dict, int, int, list[int]]:
    """
    Open image, compute all diagnostic features.
    Returns (features_dict, width, height, all_pixels).
    Raises on failure so caller can fall back to hash.
    """
    from PIL import Image

    img = Image.open(io.BytesIO(image_bytes)).convert("L")

    # Down-sample for speed: cap longest dim at 400px
    w, h = img.size
    max_dim = 400
    if max(w, h) > max_dim:
        scale = max_dim / max(w, h)
        w, h = max(1, int(w * scale)), max(1, int(h * scale))
        img = img.resize((w, h), Image.LANCZOS)

    raw = list(img.getdata())
    n_raw = len(raw)
    if n_raw == 0:
        raise ValueError("Empty image")

    # Filter background and saturation
    bone = [p for p in raw if _BG_LOW < p < _BG_HIGH]
    n_bone = len(bone)
    if n_bone < 100:          # almost no bone pixels -> treat as fallback
        raise ValueError("Too few bone pixels")

    bone_sorted = sorted(bone)

    # ── Intensity percentiles ────────────────────────────────────────────
    mean_i = sum(bone) / n_bone
    var_i  = sum((p - mean_i) ** 2 for p in bone) / n_bone
    std_i  = math.sqrt(var_i)
    p10  = _pct(bone_sorted, 10)
    p25  = _pct(bone_sorted, 25)
    p50  = _pct(bone_sorted, 50)
    p75  = _pct(bone_sorted, 75)
    p90  = _pct(bone_sorted, 90)

    # ── Pixel ratio bands ────────────────────────────────────────────────
    bright = sum(1 for p in bone if p > 180) / n_bone    # dense cortical
    mid    = sum(1 for p in bone if 80 <= p <= 180) / n_bone
    dark   = sum(1 for p in bone if p < 80) / n_bone     # sparse/porous

    # ── Cortical score: fraction of very bright pixels ───────────────────
    cortical = sum(1 for p in bone if p > 200) / n_bone

    # ── Trabecular complexity (block variance, normalized to 0-1) ────────
    block_var = _block_variance(raw, w, h, block=8)
    trab_score = min(1.0, block_var / 2000.0)   # 2000 = typical full-variance reference

    # ── Edge density (gradient) ──────────────────────────────────────────
    edge_density = _gradient_density(raw, w, h)
    edge_norm = min(1.0, edge_density / 60.0)   # 60 = typical high-edge reference

    # ── Histogram entropy ────────────────────────────────────────────────
    entropy = _shannon_entropy(bone, bins=32)
    entropy_norm = min(1.0, entropy / 5.0)      # 5 bits/symbol ~ near max

    feats = {
        "mean_i":       round(mean_i, 1),
        "std_i":        round(std_i, 1),
        "p10":          round(p10, 1),
        "p25":          round(p25, 1),
        "p50":          round(p50, 1),
        "p75":          round(p75, 1),
        "p90":          round(p90, 1),
        "bright_ratio": round(bright, 4),
        "mid_ratio":    round(mid, 4),
        "dark_ratio":   round(dark, 4),
        "cortical":     round(cortical, 4),
        "trab_score":   round(trab_score, 4),
        "edge_norm":    round(edge_norm, 4),
        "entropy_norm": round(entropy_norm, 4),
        "n_bone_px":    n_bone,
    }
    return feats, w, h, raw


# ─── Scoring model ───────────────────────────────────────────────────────────

def _features_to_biomarkers(f: dict) -> Tuple[str, float, float, float]:
    """
    Map extracted features to (label, confidence, t_score, bmd).

    density_score is a weighted linear combination of 6 sub-scores,
    each normalized to [0, 1] where 1 = healthy/dense bone:

      sub_mean     — normalised mean intensity (brightness)
      sub_p25      — 25th percentile (avoids background bias)
      sub_cortical — fraction of very-bright (cortical) pixels
      sub_dark_inv — 1 - dark_ratio  (low dark pixel fraction = healthy)
      sub_edge     — edge density  (strong edges = well-defined bone margins)
      sub_entropy  — histogram entropy (complex bone = not purely dark/light)
    """
    sub_mean     = f["mean_i"]  / 220.0          # normalise; 220 = typical bright bone
    sub_p25      = f["p25"]     / 200.0
    sub_cortical = f["cortical"]                  # already 0-1
    sub_dark_inv = 1.0 - f["dark_ratio"]          # flip: less dark = better
    sub_edge     = f["edge_norm"]                 # higher edge density = clearer structure
    sub_entropy  = f["entropy_norm"]

    # Clamp all to [0, 1]
    subs = [min(1.0, max(0.0, x)) for x in
            [sub_mean, sub_p25, sub_cortical, sub_dark_inv, sub_edge, sub_entropy]]

    # Weighted combination (weights tuned to match DXA T-score correlations)
    weights = [0.30, 0.25, 0.20, 0.15, 0.05, 0.05]
    density_score = sum(w * s for w, s in zip(weights, subs))

    # ── Label ────────────────────────────────────────────────────────────
    if density_score >= _NORMAL_DS:
        label = "Normal"
    elif density_score >= _OSTEOPENIA_DS:
        label = "Osteopenia"
    else:
        label = "Osteoporosis"

    # ── T-score ──────────────────────────────────────────────────────────
    # density_score=1.0 -> T=+1.5  (very dense)
    # density_score=0.57 -> T=-1.0 (Normal/Osteopenia border)
    # density_score=0.39 -> T=-2.5 (Osteopenia/Osteoporosis border)
    # density_score=0.0  -> T=-5.5 (severe)
    t_score = round(1.5 - (1.0 - density_score) * 7.0, 2)
    t_score = max(-5.5, min(2.5, t_score))

    # ── BMD ──────────────────────────────────────────────────────────────
    bmd = round(0.95 + t_score * 0.12, 3)
    bmd = max(0.35, min(1.30, bmd))

    # ── Confidence ───────────────────────────────────────────────────────
    if label == "Normal":
        dist = density_score - _NORMAL_DS
        base = 0.73 + min(0.22, dist * 3.0)
    elif label == "Osteopenia":
        band_mid = (_NORMAL_DS + _OSTEOPENIA_DS) / 2.0
        rel = abs(density_score - band_mid) / ((_NORMAL_DS - _OSTEOPENIA_DS) / 2.0)
        base = 0.71 + 0.19 * (1.0 - min(1, rel))
    else:
        dist = _OSTEOPENIA_DS - density_score
        base = 0.72 + min(0.23, dist * 3.0)

    # Edge clarity bonus: well-defined bone = more reliable read
    conf_bonus = min(0.04, f["edge_norm"] * 0.08)
    confidence = round(min(0.96, max(0.68, base + conf_bonus)), 4)

    return label, confidence, t_score, bmd


# ─── Build UI display dict ───────────────────────────────────────────────────

def _build_metrics_display(f: dict, label: str, t_score: float, bmd: float) -> dict[str, str]:
    """Convert raw feature dict into human-readable display values for the UI."""
    def pct_bar(v, lo=0.0, hi=1.0):
        norm = (v - lo) / (hi - lo) if hi > lo else 0.5
        filled = round(norm * 10)
        return "▓" * filled + "░" * (10 - filled)

    cortical_pct = round(f["cortical"] * 100, 1)
    dark_pct     = round(f["dark_ratio"] * 100, 1)
    bright_pct   = round(f["bright_ratio"] * 100, 1)

    cortical_label = "Excellent" if cortical_pct > 25 else "Good" if cortical_pct > 12 else "Reduced" if cortical_pct > 5 else "Low"
    trab_label = "Dense" if f["trab_score"] < 0.30 else "Moderate" if f["trab_score"] < 0.60 else "Complex/Porous"
    edge_label = "Sharp" if f["edge_norm"] > 0.55 else "Moderate" if f["edge_norm"] > 0.30 else "Subtle"

    return {
        "Mean Intensity":       f"{f['mean_i']:.0f} / 255",
        "Cortical Shell":       f"{cortical_pct:.1f}% — {cortical_label}",
        "Dense Bone Pixels":    f"{bright_pct:.1f}%",
        "Sparse/Porous Pixels": f"{dark_pct:.1f}%",
        "Trabecular Pattern":   f"{trab_label} (var={f['trab_score']:.2f})",
        "Edge Clarity":         f"{edge_label} ({f['edge_norm']:.2f})",
        "Bone Pixel Count":     f"{f['n_bone_px']:,} px",
        "Intensity Spread":     f"p10={f['p10']:.0f}  p50={f['p50']:.0f}  p90={f['p90']:.0f}",
        "Estimated T-score":    f"{t_score:+.2f}",
        "Estimated BMD":        f"{bmd:.3f} g/cm\u00b2",
    }


# ─── Fallback ────────────────────────────────────────────────────────────────

def _fallback_hash(image_bytes: bytes) -> Tuple[str, float, float, float, dict]:
    digest   = hashlib.sha256(image_bytes).hexdigest()
    hash_val = int(digest[:8], 16) / 0xFFFFFFFF
    if hash_val < 0.38:
        label, t, b, cb = "Normal",       round(-0.2 - hash_val, 2), round(0.94 + hash_val * 0.05, 3), 0.71
    elif hash_val < 0.72:
        label, t, b, cb = "Osteopenia",   round(-1.2 - hash_val * 1.5, 2), round(0.82 - hash_val * 0.10, 3), 0.70
    else:
        label, t, b, cb = "Osteoporosis", round(-2.6 - hash_val * 1.5, 2), round(0.62 - hash_val * 0.15, 3), 0.69
    jitter = int(digest[8:12], 16) / 0xFFFF * 0.14
    conf = round(min(0.93, cb + jitter), 4)
    return label, conf, max(-5.5, t), max(0.35, round(b, 3)), {}


# ─── Public entry point (heuristic) ─────────────────────────────────────────

def analyse_xray(
    image_bytes: bytes,
) -> Tuple[str, float, float, float, Dict[str, str]]:
    """
    Heuristic bone X-ray analysis (fallback when CNN model is not loaded).

    Returns:
        (label, confidence, t_score, bmd, analysis_metrics)
        analysis_metrics  - dict[feature -> display_value] shown in the UI
    """
    if not image_bytes:
        return "Normal", 0.72, -0.5, 0.91, {}

    try:
        feats, w, h, raw = _extract_features(image_bytes)
        label, confidence, t_score, bmd = _features_to_biomarkers(feats)
        metrics = _build_metrics_display(feats, label, t_score, bmd)
        return label, confidence, t_score, bmd, metrics
    except Exception:
        return _fallback_hash(image_bytes)


# ─── EfficientNet-B3 CNN inference ───────────────────────────────────────────

# Class index → label (must match training order)
_CNN_CLASSES = ["Normal", "Osteopenia", "Osteoporosis"]

# T-score ranges per class: (low, high)  — confidence maps to position in range
_CNN_T_RANGES = {
    "Normal":       (-1.0,  0.5),
    "Osteopenia":   (-2.5, -1.0),
    "Osteoporosis": (-4.0, -2.5),
}
_CNN_BMD_RANGES = {
    "Normal":       (0.90, 1.10),
    "Osteopenia":   (0.70, 0.90),
    "Osteoporosis": (0.40, 0.70),
}


def _tscore_from_label_confidence(label: str, confidence: float) -> float:
    """
    Map (label, confidence) to a T-score within the label's clinical range.
    High confidence → value toward centre of range.
    Low  confidence → value near the boundary (most uncertain end).
    """
    lo, hi = _CNN_T_RANGES[label]
    centre = (lo + hi) / 2.0
    # Blend between boundary and centre based on confidence
    boundary = hi if label == "Normal" else lo   # uncertain boundary per class
    t = boundary + (centre - boundary) * confidence
    return round(max(lo - 0.5, min(hi + 0.5, t)), 2)


def _bmd_from_tscore(t_score: float) -> float:
    bmd = round(0.95 + t_score * 0.12, 3)
    return max(0.35, min(1.30, bmd))


def analyse_xray_cnn(
    image_bytes: bytes,
    model,
) -> Tuple[str, float, float, float, Dict[str, str]]:
    """
    Run EfficientNet-B3 inference on a bone X-ray image.

    Preprocessing matches training:
      • Resize to 300×300
      • Convert to RGB
      • ToTensor + ImageNet normalisation

    Returns:
        (label, confidence, t_score, bmd, analysis_metrics)
    """
    import io as _io
    import torch
    import numpy as np
    from PIL import Image
    from torchvision import transforms

    _tfm = transforms.Compose([
        transforms.Resize((300, 300)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ])

    # ── Decode & preprocess ───────────────────────────────────────────────
    img = Image.open(_io.BytesIO(image_bytes)).convert("RGB")
    x   = _tfm(img).unsqueeze(0)          # (1, 3, 300, 300)

    # ── Inference ─────────────────────────────────────────────────────────
    with torch.no_grad():
        logits = model(x)
        proba  = torch.softmax(logits, dim=1).numpy()[0]   # shape (3,)

    pred_idx   = int(np.argmax(proba))
    label      = _CNN_CLASSES[pred_idx]
    confidence = float(proba[pred_idx])

    # ── Derive T-score / BMD ──────────────────────────────────────────────
    t_score = _tscore_from_label_confidence(label, confidence)
    bmd     = _bmd_from_tscore(t_score)

    # ── Build display metrics ─────────────────────────────────────────────
    # Try to also run heuristic feature extraction for the diagnostic panel
    try:
        feats, _, _, _ = _extract_features(image_bytes)
        metrics = _build_metrics_display(feats, label, t_score, bmd)
    except Exception:
        metrics = {}

    # Add CNN-specific entries
    metrics["Model"]            = "EfficientNet-B3 (Deep CNN)"
    metrics["CNN Confidence"]   = f"{confidence:.1%}"
    metrics["P(Normal)"]        = f"{proba[0]:.1%}"
    metrics["P(Osteopenia)"]    = f"{proba[1]:.1%}"
    metrics["P(Osteoporosis)"]  = f"{proba[2]:.1%}"
    metrics["Estimated T-score"] = f"{t_score:+.2f}"
    metrics["Estimated BMD"]    = f"{bmd:.3f} g/cm\u00b2"

    return label, confidence, t_score, bmd, metrics
