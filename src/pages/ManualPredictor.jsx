import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, ChevronRight, RotateCcw, User, Scale, Activity } from 'lucide-react'
import { predictManual } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ResultCard from '../components/ResultCard'
import { useLang } from '../context/LanguageContext'

const INITIAL_STATE = {
  age: '', gender: 'Female', weight: '', height: '', tScore: '', bmd: '',
  calciumLevel: '', vitaminD: '', smoking: 'Never', alcohol: 'None',
  exercise: 'Moderate', familyHistory: 'No', prevFracture: 'None', medications: 'None',
}

export default function ManualPredictor() {
  const { t } = useLang()
  const [form, setForm]       = useState(INITIAL_STATE)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)

  // Build FIELDS inside component so labels re-render on language change
  const FIELDS = [
    {
      section: t.manualPatient,
      icon: User,
      fields: [
        { name: 'age',    label: t.manualAge,    type: 'number', placeholder: 'e.g. 65',  unit: 'years' },
        { name: 'gender', label: t.manualGender, type: 'select', options: [t.manualGenderF, t.manualGenderM, 'Other'] },
        { name: 'weight', label: t.manualWeight, type: 'number', placeholder: 'e.g. 68',  unit: 'kg' },
        { name: 'height', label: t.manualHeight, type: 'number', placeholder: 'e.g. 165', unit: 'cm' },
      ],
    },
    {
      section: t.manualClinical,
      icon: Activity,
      fields: [
        { name: 'tScore',       label: t.manualTScore,  type: 'number', placeholder: 'e.g. -2.5',  unit: 'SD',    hint: 'Normal ≥ -1.0 | Osteopenia -1.0–-2.5 | Osteoporosis ≤ -2.5' },
        { name: 'bmd',          label: t.manualBMD,     type: 'number', placeholder: 'e.g. 0.78', unit: 'g/cm²' },
        { name: 'calciumLevel', label: t.manualCalcium, type: 'number', placeholder: 'e.g. 9.2',  unit: 'mg/dL' },
        { name: 'vitaminD',     label: t.manualVitD,    type: 'number', placeholder: 'e.g. 22',   unit: 'ng/mL' },
      ],
    },
    {
      section: t.manualLifestyle,
      icon: Scale,
      fields: [
        { name: 'smoking',       label: t.manualSmoking,  type: 'select', options: ['Never', 'Former Smoker', 'Current Smoker'] },
        { name: 'alcohol',       label: t.manualAlcohol,  type: 'select', options: ['None', 'Moderate (1-2/day)', 'Heavy (>2/day)'] },
        { name: 'exercise',      label: t.manualExercise, type: 'select', options: ['Sedentary', 'Light', 'Moderate', 'Active'] },
        { name: 'familyHistory', label: t.manualFamily,   type: 'select', options: ['No', 'Yes – 1st degree', 'Yes – 2nd degree'] },
        { name: 'prevFracture',  label: t.manualFracture, type: 'select', options: ['None', 'Yes – 1 fracture', 'Yes – 2+'] },
        { name: 'medications',   label: t.manualSteroid,  type: 'select', options: ['None', 'Corticosteroids', 'Anticonvulsants', 'PPI', 'Other'] },
      ],
    },
  ]

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const data = await predictManual(form)
      setResult(data)
    } catch (err) {
      setError('Prediction failed. Please try again.')
    } finally {
      setLoading(false)
    }
    // Smooth scroll to results
    setTimeout(() => document.getElementById('manual-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const handleReset = () => { setForm(INITIAL_STATE); setResult(null); setError(null) }

  return (
    <div className="min-h-full p-4 md:p-8 max-w-5xl mx-auto fade-in-up">

      {/* ─── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30
                        flex items-center justify-center shadow-glow-sm">
          <ClipboardList size={20} className="text-brand-400" />
        </div>
        <div>
          <h1 className="section-title">{t.manualTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t.manualSub}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ─── Form ──────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="xl:col-span-3 space-y-6">
          {FIELDS.map(({ section, icon: SectionIcon, fields }) => (
            <div key={section} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-5">
                <SectionIcon size={15} className="text-brand-400" />
                <h2 className="text-sm font-semibold text-slate-200">{section}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map(({ name, label, type, placeholder, unit, options, hint }) => (
                  <div key={name}>
                    <label className="label-text">{label}</label>
                    <div className="relative">
                      {type === 'select' ? (
                        <select
                          name={name}
                          value={form[name]}
                          onChange={handleChange}
                          className="input-field appearance-none"
                        >
                          {options.map((o) => (
                            <option key={o} value={o} className="bg-[#16162a]">{o}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          step="any"
                          name={name}
                          value={form[name]}
                          onChange={handleChange}
                          placeholder={placeholder}
                          className="input-field pr-16"
                        />
                      )}
                      {unit && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2
                                         text-[11px] font-mono text-slate-500 pointer-events-none">
                          {unit}
                        </span>
                      )}
                    </div>
                    {hint && <p className="text-[10px] text-slate-600 mt-1">{hint}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 flex-1 justify-center"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {t.manualPredicting}
                </>
              ) : (
                <>
                  {t.manualPredict}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
            <button type="button" onClick={handleReset} className="btn-secondary flex items-center gap-2">
              <RotateCcw size={15} />
              {t.manualReset}
            </button>
          </div>
        </form>

        {/* ─── Results panel ─────────────────────────────────────────── */}
        <div id="manual-results" className="xl:col-span-2 space-y-4">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="glass-card p-6">
                  <LoadingSpinner
                    message="Running ML inference…"
                    subtext="Evaluating bone density model against clinical inputs"
                  />
                </div>
              </motion.div>
            )}

            {error && !loading && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="glass-card p-5 border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                  {error}
                </div>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ResultCard result={result} />
              </motion.div>
            )}

            {!loading && !result && !error && (
              <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="glass-card p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface-hover border border-surface-border
                                  flex items-center justify-center mx-auto mb-4">
                    <ClipboardList size={24} className="text-slate-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">Results will appear here</p>
                  <p className="text-xs text-slate-600 mt-1">Fill in the clinical form and click Predict Risk</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
