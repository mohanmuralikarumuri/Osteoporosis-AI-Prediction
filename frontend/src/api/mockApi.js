/**
 * mockApi.js
 * ──────────────────────────────────────────────────────────────────────────
 * Simulates asynchronous backend API calls for the Osteoporosis AI Predictor.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  REAL API INTEGRATION – replace these functions with axios/fetch      │
 * │  calls to your actual ML backend endpoints when ready.               │
 * │                                                                      │
 * │  Base URL:  import.meta.env.VITE_API_BASE_URL  (set in .env file)    │
 * │  Example:   const BASE = import.meta.env.VITE_API_BASE_URL           │
 * │             || 'http://localhost:8000/api'                           │
 * └──────────────────────────────────────────────────────────────────────┘
 */

// ─── Helpers ──────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const MOCK_PREDICTION_POOL = [
  {
    diagnosis: 'Osteoporosis',
    riskLevel: 'High',
    confidence: 0.92,
    tScore: -2.8,
    bmd: 0.62,
    fractureRisk10yr: '38%',
  },
  {
    diagnosis: 'Osteopenia',
    riskLevel: 'Moderate',
    confidence: 0.85,
    tScore: -1.6,
    bmd: 0.74,
    fractureRisk10yr: '18%',
  },
  {
    diagnosis: 'Normal Bone Density',
    riskLevel: 'Low',
    confidence: 0.97,
    tScore: 0.3,
    bmd: 0.91,
    fractureRisk10yr: '5%',
  },
]

const MOCK_SUGGESTIONS = [
  'Increase daily calcium intake to 1200 mg through dairy products, leafy greens, or fortified foods.',
  'Ensure adequate Vitamin D levels (800–1000 IU/day); consider supervised supplementation.',
  'Engage in weight-bearing exercises (walking, resistance training) for at least 30 minutes, 5 days a week.',
  'Avoid smoking and limit alcohol consumption to reduce bone loss acceleration.',
  'Schedule a bone density (DEXA) scan every 1–2 years to monitor progression.',
  'Reduce fall risk at home: install grab bars, improve lighting, and remove trip hazards.',
  'Discuss hormone replacement therapy (HRT) options with your endocrinologist if post-menopausal.',
]

const MOCK_MEDICATIONS = [
  {
    name: 'Alendronate (Fosamax)',
    class: 'Bisphosphonate',
    dosage: '70 mg once weekly',
    note: 'Take on an empty stomach with a full glass of water; remain upright for 30 min.',
  },
  {
    name: 'Denosumab (Prolia)',
    class: 'RANK Ligand Inhibitor',
    dosage: '60 mg subcutaneous injection every 6 months',
    note: 'Monitor for hypocalcemia; ensure adequate calcium & Vitamin D intake.',
  },
  {
    name: 'Calcium Carbonate + Vitamin D3',
    class: 'Supplement',
    dosage: '500 mg / 400 IU twice daily',
    note: 'Take with meals for optimal absorption.',
  },
  {
    name: 'Teriparatide (Forteo)',
    class: 'PTH Analogue',
    dosage: '20 mcg subcutaneous daily for up to 2 years',
    note: 'Reserved for severe osteoporosis; anabolic agent that builds bone.',
  },
]

function buildResponse(overrides = {}) {
  const base = MOCK_PREDICTION_POOL[Math.floor(Math.random() * MOCK_PREDICTION_POOL.length)]
  const suggestions = MOCK_SUGGESTIONS.slice(0, 4 + Math.floor(Math.random() * 3))
  const medications = MOCK_MEDICATIONS.slice(0, 2 + Math.floor(Math.random() * 2))
  return { ...base, ...overrides, suggestions, medications, generatedAt: new Date().toISOString() }
}

// ─── Manual Predictor API ─────────────────────────────────────────────────
/**
 * Predict osteoporosis risk from manually entered clinical data.
 *
 * REPLACE WITH:
 *   import axios from 'axios'
 *   const BASE = import.meta.env.VITE_API_BASE_URL
 *   export async function predictManual(formData) {
 *     const { data } = await axios.post(`${BASE}/predict/manual`, formData)
 *     return data
 *   }
 *
 * @param {Object} formData – clinical fields from ManualPredictor form
 * @returns {Promise<Object>}
 */
export async function predictManual(formData) {
  await delay(2200) // simulate network + ML inference time

  // Derive a rough risk level from the t-score if provided
  const t = parseFloat(formData.tScore)
  let overrides = {}
  if (!isNaN(t)) {
    if (t <= -2.5) overrides = MOCK_PREDICTION_POOL[0]
    else if (t <= -1.0) overrides = MOCK_PREDICTION_POOL[1]
    else overrides = MOCK_PREDICTION_POOL[2]
  }

  return buildResponse(overrides)
}

// ─── Report Predictor API ─────────────────────────────────────────────────
/**
 * Analyze an uploaded medical report image / PDF.
 *
 * REPLACE WITH:
 *   export async function analyzeReport(file) {
 *     const form = new FormData()
 *     form.append('report', file)
 *     const { data } = await axios.post(`${BASE}/predict/report`, form, {
 *       headers: { 'Content-Type': 'multipart/form-data' },
 *     })
 *     return data
 *   }
 *
 * @param {File} file – uploaded medical report file
 * @returns {Promise<Object>}
 */
export async function analyzeReport(file) {
  await delay(2800)
  return buildResponse({ source: 'report', fileName: file?.name })
}

// ─── X-Ray Predictor API ──────────────────────────────────────────────────
/**
 * Analyze an uploaded X-ray image for bone density patterns.
 *
 * REPLACE WITH:
 *   export async function analyzeXRay(file) {
 *     const form = new FormData()
 *     form.append('xray', file)
 *     const { data } = await axios.post(`${BASE}/predict/xray`, form, {
 *       headers: { 'Content-Type': 'multipart/form-data' },
 *     })
 *     return data
 *   }
 *
 * @param {File} file – uploaded X-ray image file
 * @returns {Promise<Object>}
 */
export async function analyzeXRay(file) {
  await delay(3000)
  return buildResponse({ source: 'xray', fileName: file?.name })
}
