import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, ChevronRight, RotateCcw, User, Scale, Activity } from 'lucide-react'
import { predictManual } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ResultCard from '../components/ResultCard'
import { useLang } from '../context/LanguageContext'
import BoneBackground from '../three/BoneBackground'

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
    <div className="relative min-h-full">
      {/* 3-D bone background – indigo/violet theme */}
      <BoneBackground
        accentColor="#6366f1"
        secondColor="#a78bfa"
        gradientFrom="rgba(6,5,26,0.96)"
        gradientTo="rgba(14,8,38,0.96)"
        boneCount={14}
      />

      {/* Page content */}
      <div className="relative z-10 p-4 md:p-8 max-w-5xl mx-auto fade-in-up">

      {/* ─── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8">
        <div className="section-badge-3d w-12 h-12 rounded-xl"
             style={{ width:'3rem', height:'3rem', borderRadius:'0.9rem',
                      boxShadow:'0 0 28px rgba(99,102,241,0.45), 0 4px 0 rgba(49,46,129,0.7), inset 0 1px 0 rgba(255,255,255,0.12)' }}>
          <ClipboardList size={22} className="text-brand-300" />
        </div>
        <div>
          <h1 className="section-title">{t.manualTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t.manualSub}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ─── Form ──────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="xl:col-span-3 space-y-5">
          {FIELDS.map(({ section, icon: SectionIcon, fields }) => (
            /* ── Perspective wrapper enables 3-D child transforms ── */
            <div key={section} className="card-3d-wrap">
              <div className="card-3d p-5 group">

                {/* Section heading with glowing accent line */}
                <div className="section-heading-3d">
                  <div className="section-badge-3d">
                    <SectionIcon size={14} className="text-brand-300" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-200 tracking-wide">{section}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fields.map(({ name, label, type, placeholder, unit, options, hint }) => (
                    <div key={name} className="field-3d">
                      <label className="label-3d">{label}</label>
                      <div className="relative">
                        {type === 'select' ? (
                          <select
                            name={name}
                            value={form[name]}
                            onChange={handleChange}
                            className="input-3d appearance-none pr-8 cursor-pointer"
                          >
                            {options.map((o) => (
                              <option key={o} value={o}>{o}</option>
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
                            className="input-3d pr-16"
                          />
                        )}
                        {unit && (
                          <span className="unit-badge-3d">{unit}</span>
                        )}
                        {/* Chevron icon for selects */}
                        {type === 'select' && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none">
                            <svg width="11" height="11" viewBox="0 0 10 10" fill="currentColor">
                              <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      {hint && (
                        <p className="text-[9.5px] text-slate-600 mt-1 pl-0.5 leading-relaxed">{hint}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* ── Action buttons ── */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="btn-3d-primary"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  {t.manualPredicting}
                </>
              ) : (
                <>
                  {t.manualPredict}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
            <button type="button" onClick={handleReset} className="btn-3d-secondary">
              <RotateCcw size={15} />
              {t.manualReset}
            </button>
          </div>
        </form>

        {/* ─── Results panel (independently scrollable on xl) ─────────── */}
        <div id="manual-results" className="xl:col-span-2 xl:sticky xl:top-4 xl:max-h-[calc(100vh-8rem)] results-scroll space-y-4 pr-0.5">
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
    </div>
  )
}
