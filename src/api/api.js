/**
 * api.js
 * ────────────────────────────────────────────────────────────────────────────
 * Real HTTP API client for Osteocare.ai — connects to the FastAPI backend.
 *
 * Base URL is read from VITE_API_URL env variable (default: http://localhost:8000).
 * In development, Vite proxies /predict/* to localhost:8000 automatically,
 * so the base URL is just an empty string when the dev server is running.
 */

// Use VITE_API_BASE_URL from .env (e.g. http://localhost:8000)
// Falls back to '' which relies on the Vite dev proxy defined in vite.config.js
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

// ─── Response shape adapter ──────────────────────────────────────────────────
// Backend returns: { prediction, confidence, t_score, bmd,
//                   fracture_risk, suggestions, medications }
// Frontend uses:  { diagnosis, confidence, tScore, bmd,
//                   fractureRisk10yr, suggestions, medications, generatedAt }
function mapResponse(data) {
  return {
    diagnosis:       data.prediction,
    confidence:      data.confidence,
    tScore:          data.t_score,
    bmd:             data.bmd,
    fractureRisk10yr: data.fracture_risk,
    suggestions:     data.suggestions  ?? [],
    medications:     data.medications  ?? [],
    evidenceSource:  data.evidence_source ?? null,
    extractedData:   data.extracted_data  ?? null,
    generatedAt:     new Date().toISOString(),
  }
}

async function handleResponse(res) {
  if (!res.ok) {
    let detail = `Server error ${res.status}`
    try {
      const err = await res.json()
      detail = err.detail ?? detail
    } catch (_) {}
    throw new Error(detail)
  }
  return mapResponse(await res.json())
}

// ─── Form-field → 14-feature vector conversion ───────────────────────────────
// Feature order (matches ManualPredictionRequest schema):
//  0  age              (years)
//  1  gender           0=Female 1=Male
//  2  weight           (kg)
//  3  height           (cm)
//  4  bmi              (kg/m²)
//  5  calcium_intake   0=Low 1=Normal 2=High
//  6  vitamin_d        0=Deficient 1=Sufficient
//  7  physical_activity 0=Sedentary 1=Moderate 2=Active
//  8  smoking          0=No 1=Yes
//  9  alcohol          0=No 1=Occasional 2=Regular
// 10  family_history   0=No 1=Yes
// 11  prev_fracture    0=No 1=Yes
// 12  menopause        0=No 1=Yes
// 13  steroid_use      0=No 1=Yes

function buildFeatures(form) {
  const age    = parseFloat(form.age)    || 50
  const weight = parseFloat(form.weight) || 65
  const height = parseFloat(form.height) || 165
  const bmi    = parseFloat((weight / ((height / 100) ** 2)).toFixed(2))

  // Gender: Female → 0, Male → 1, Other → 0
  const gender = form.gender === 'Male' ? 1 : 0

  // Calcium intake from mg/dL value
  const caVal = parseFloat(form.calciumLevel)
  const calcium_intake = isNaN(caVal) ? 1
    : caVal < 8.5 ? 0
    : caVal > 10.5 ? 2
    : 1

  // Vitamin D from ng/mL value (< 20 = deficient)
  const vdVal = parseFloat(form.vitaminD)
  const vitamin_d = isNaN(vdVal) ? 1 : vdVal < 20 ? 0 : 1

  // Physical activity
  const actMap = { Sedentary: 0, Light: 0, Moderate: 1, Active: 2 }
  const physical_activity = actMap[form.exercise] ?? 1

  // Smoking
  const smoking = form.smoking === 'Never' ? 0 : 1

  // Alcohol
  const alcMap = { None: 0, 'Moderate (1-2/day)': 1, 'Heavy (>2/day)': 2 }
  const alcohol = alcMap[form.alcohol] ?? 0

  // Family history
  const family_history = form.familyHistory === 'No' ? 0 : 1

  // Previous fracture
  const prev_fracture = form.prevFracture === 'None' ? 0 : 1

  // Menopause: infer from female gender + age ≥ 50
  const menopause = (gender === 0 && age >= 50) ? 1 : 0

  // Steroid use
  const steroid_use = form.medications === 'Corticosteroids' ? 1 : 0

  return [
    age, gender, weight, height, bmi,
    calcium_intake, vitamin_d, physical_activity,
    smoking, alcohol, family_history, prev_fracture, menopause, steroid_use,
  ]
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Manual predictor — converts form fields to feature vector and calls backend.
 * @param {Object} formData – field values from ManualPredictor form
 */
export async function predictManual(formData) {
  const features = buildFeatures(formData)
  const res = await fetch(`${BASE_URL}/predict/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features }),
  })
  return handleResponse(res)
}

/**
 * Report predictor — sends the uploaded PDF/image file to the backend.
 * @param {File} file – uploaded medical report
 */
export async function analyzeReport(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE_URL}/predict/report`, {
    method: 'POST',
    body: form,
  })
  return handleResponse(res)
}

/**
 * X-Ray predictor — sends the uploaded X-ray image to the backend.
 * @param {File} file – uploaded X-ray image
 */
export async function analyzeXRay(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE_URL}/predict/xray`, {
    method: 'POST',
    body: form,
  })
  return handleResponse(res)
}
