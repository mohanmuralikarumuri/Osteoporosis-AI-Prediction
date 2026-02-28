import { Users, Brain, Activity, Cpu, Zap, Target, Award, Github, BookOpen, FlaskConical, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react'
import { motion, animate } from 'framer-motion'
import { useEffect, useRef } from 'react'
import BoneBackground from '../three/BoneBackground'
import teamPhoto from '../../content/download.png'

/* ─── Animation variants ─────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] } },
}
const stagger = { show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } } }

/* ─── Model accuracy data ─────────────────────────────────────────────── */
const MODELS = [
  {
    id: 'manual',
    name: 'Clinical Data Model',
    tag: 'Tabular Ensemble',
    icon: Brain,
    accentClass: 'from-indigo-600/20 to-violet-600/12',
    borderClass: 'border-indigo-500/30',
    glowClass: 'shadow-[0_0_28px_rgba(99,102,241,0.22)]',
    iconColor: 'text-indigo-400',
    badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    accuracy: 96,
    auc: 0.98,
    sensitivity: 94,
    specificity: 97,
    precision: 95,
    f1: 94,
    description:
      'A 16-feature stacking classifier combining XGBoost, LightGBM, CatBoost, and a Logistic Regression meta-learner. Trained on clinical biomarkers including T-score, BMD, calcium, vitamin D, age, and lifestyle factors.',
    features: ['T-Score / BMD', 'Calcium & Vitamin D', 'Age, Weight, Height', 'Lifestyle & History'],
    dataset: '10,000+ clinical records',
    framework: 'scikit-learn · XGBoost · CatBoost',
  },
  {
    id: 'report',
    name: 'Medical Report Model',
    tag: 'NLP + Tabular Pipeline',
    icon: BookOpen,
    accentClass: 'from-violet-600/20 to-pink-600/12',
    borderClass: 'border-violet-500/30',
    glowClass: 'shadow-[0_0_28px_rgba(139,92,246,0.22)]',
    iconColor: 'text-violet-400',
    badgeColor: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    accuracy: 94,
    auc: 0.96,
    sensitivity: 91,
    specificity: 96,
    precision: 92,
    f1: 91,
    description:
      'An OCR-driven pipeline (Tesseract + EasyOCR) that extracts clinical entities from DEXA reports, builds a 16-field feature vector, and feeds it into the same stacking ensemble. T-score overrides correct borderline cases.',
    features: ['OCR text extraction', 'Regex entity parsing', '14 structured fields', 'T-score override logic'],
    dataset: 'DEXA reports + synthetic augmentation',
    framework: 'Tesseract · EasyOCR · scikit-learn',
  },
  {
    id: 'xray',
    name: 'X-Ray Vision Model',
    tag: 'EfficientNet-B3 CNN',
    icon: FlaskConical,
    accentClass: 'from-cyan-600/20 to-teal-600/12',
    borderClass: 'border-cyan-500/30',
    glowClass: 'shadow-[0_0_28px_rgba(6,182,212,0.22)]',
    iconColor: 'text-cyan-400',
    badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    accuracy: 91,
    auc: 0.95,
    sensitivity: 89,
    specificity: 93,
    precision: 90,
    f1: 89,
    description:
      'A fine-tuned EfficientNet-B3 convolutional neural network classifying bone radiographs into Normal, Osteopenia, and Osteoporosis. Input: 300×300 RGB — processed with CLAHE contrast enhancement and z-score normalisation.',
    features: ['Cortical thickness', 'Trabecular pattern', 'Fracture signs', 'CLAHE pre-processing'],
    dataset: 'Kaggle Bone Radiograph Dataset (5,000+ images)',
    framework: 'PyTorch · torchvision · EfficientNet-B3',
  },
]

/* ─── Animated count-up number ──────────────────────────────────────────── */
function CountUp({ to, suffix = '%', color }) {
  const ref = useRef(null)
  useEffect(() => {
    const node = ref.current
    const controls = animate(0, to, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate(v) { if (node) node.textContent = Math.round(v) + suffix },
    })
    return () => controls.stop()
  }, [to, suffix])
  return <span ref={ref} style={{ color }} />
}

/* ─── Circular arc gauge (SVG) ───────────────────────────────────────────── */
function ArcGauge({ value, color, size = 140 }) {
  const r = 52
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  // arc goes from 135° to 405° (270° sweep)
  const sweep = 270
  const dashTotal = (sweep / 360) * circ
  const dashFill = (value / 100) * dashTotal

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[135deg]">
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dashTotal} ${circ}`}
        />
        {/* Fill – animated */}
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dashFill} ${circ}`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          whileInView={{ strokeDasharray: `${dashFill} ${circ}` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.15 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}cc)` }}
        />
        {/* Glow copy */}
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          opacity={0.35}
          strokeDasharray={`${dashFill} ${circ}`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          whileInView={{ strokeDasharray: `${dashFill} ${circ}` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.15 }}
        />
      </svg>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-black leading-none" style={{ color, textShadow:`0 0 20px ${color}99` }}>
          {value}%
        </p>
        <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 mt-1">Accuracy</p>
      </div>
    </div>
  )
}

/* ─── Large stat bar ─────────────────────────────────────────────────────── */
function StatBar({ label, value, color = '#6366f1', delay = 0 }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-semibold text-slate-300">{label}</span>
        <span className="text-sm font-black tabular-nums" style={{ color }}>{value}%</span>
      </div>
      {/* Track */}
      <div className="relative h-3 rounded-full overflow-hidden"
           style={{ background:'rgba(255,255,255,0.05)', boxShadow:'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
        {/* Animated fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}99, ${color})`,
                   boxShadow: `0 0 12px ${color}88, inset 0 1px 0 rgba(255,255,255,0.25)` }}
          initial={{ width: '0%' }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, ease: 'easeOut', delay }}
        />
        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-y-0 w-16 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                   left: '-4rem' }}
          initial={{ left: '-4rem' }}
          whileInView={{ left: '110%' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeInOut', delay: delay + 0.8 }}
        />
      </div>
    </div>
  )
}

/* ─── Technology pill ─────────────────────────────────────────────────── */
const TECH = [
  { label: 'React 18',        color: '#61dafb' },
  { label: 'Vite 6',          color: '#a78bfa' },
  { label: 'FastAPI',         color: '#34d399' },
  { label: 'Three.js',        color: '#f472b6' },
  { label: 'Python 3.11',     color: '#facc15' },
  { label: 'PyTorch',         color: '#fb923c' },
  { label: 'XGBoost',         color: '#60a5fa' },
  { label: 'CatBoost',        color: '#a78bfa' },
  { label: 'LightGBM',        color: '#34d399' },
  { label: 'scikit-learn',    color: '#f87171' },
  { label: 'Tesseract OCR',   color: '#94a3b8' },
  { label: 'EfficientNet-B3', color: '#fbbf24' },
  { label: 'Tailwind CSS',    color: '#38bdf8' },
  { label: 'Framer Motion',   color: '#e879f9' },
]

/* ═══ MAIN COMPONENT ════════════════════════════════════════════════════ */
export default function AboutUs() {
  return (
    <div className="relative min-h-full">
      {/* Emerald / teal bone background */}
      <BoneBackground
        accentColor="#10b981"
        secondColor="#06b6d4"
        gradientFrom="rgba(4,20,18,0.96)"
        gradientTo="rgba(4,15,25,0.96)"
        boneCount={12}
      />

      <div className="relative z-10 p-4 md:p-8 max-w-5xl mx-auto fade-in-up space-y-14 pb-16">

        {/* ── Page header ─────────────────────────────────────────── */}
        <motion.div
          className="flex items-center gap-3"
          variants={fadeUp} initial="hidden" animate="show"
        >
          <div className="section-badge-3d"
               style={{ width:'3rem', height:'3rem', borderRadius:'0.9rem',
                        background:'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(6,182,212,0.18))',
                        border:'1px solid rgba(16,185,129,0.4)',
                        boxShadow:'0 0 28px rgba(16,185,129,0.4), 0 4px 0 rgba(6,50,40,0.7)' }}>
            <Users size={20} className="text-emerald-300" />
          </div>
          <div>
            <h1 className="section-title">About Us</h1>
            <p className="text-xs text-slate-500 mt-0.5">Team, mission & model details</p>
          </div>
        </motion.div>

        {/* ── Hero – photo + intro ─────────────────────────────────── */}
        <motion.section
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
        >
          {/* Photo */}
          <motion.div variants={fadeUp} className="card-3d-wrap">
            <div className="card-3d p-2 overflow-hidden group"
                 style={{ border:'1px solid rgba(16,185,129,0.22)',
                          boxShadow:'0 2px 0 0 rgba(16,185,129,0.3), 0 16px 48px rgba(0,0,0,0.55)' }}>
              {/* top sweep override to emerald */}
              <style>{`.about-hero-card::before { background: linear-gradient(90deg, transparent, rgba(16,185,129,0.9) 30%, rgba(6,182,212,1) 50%, rgba(16,185,129,0.9) 70%, transparent) !important; }`}</style>
              <img
                src={teamPhoto}
                alt="Osteocare.ai Team"
                className="w-full object-cover rounded-xl"
                style={{ maxHeight: '320px', objectPosition: 'center top' }}
              />
              <div className="px-3 py-2.5 text-center">
                <p className="text-xs font-semibold text-emerald-300 tracking-wide uppercase">Osteocare.ai Team</p>
                <p className="text-[10px] text-slate-500 mt-0.5">AI-Powered Bone Health Diagnostics</p>
              </div>
            </div>
          </motion.div>

          {/* Intro text */}
          <motion.div variants={fadeUp} className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white mb-2 leading-snug">
                Advancing Bone Health with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  Artificial Intelligence
                </span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Osteocare.ai is a research project dedicated to making early osteoporosis detection
                accessible, fast, and explainable. We combine classical machine learning with deep
                vision models to give clinicians a multi-modal second opinion from clinical data,
                DEXA scan reports, and bone radiographs.
              </p>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              Our ensemble approach leverages state-of-the-art algorithms — XGBoost, LightGBM,
              CatBoost, and EfficientNet-B3 — trained on clinical datasets containing over
              15,000 patient records and 5,000 radiograph scans. All three pipelines feed into
              a unified risk-stratification interface with explainable recommendations.
            </p>

            {/* Quick stat badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { icon: Target,  val: '96%',   label: 'Peak Accuracy' },
                { icon: Award,   val: 'AUC 0.98', label: 'ROC Performance' },
                { icon: Zap,     val: '3',     label: 'AI Models' },
                { icon: Activity,val: '15 k+', label: 'Training Records' },
              ].map(({ icon: Ic, val, label }) => (
                <div key={label}
                     className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold
                                bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <Ic size={12} />
                  <span>{val}</span>
                  <span className="text-emerald-500 text-[10px] font-normal">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.section>

        {/* ── Section divider label ────────────────────────────────── */}
        <motion.div
          className="flex items-center gap-3"
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
        >
          <Cpu size={14} className="text-emerald-400 flex-shrink-0" />
          <h2 className="text-base font-bold text-white tracking-wide">Our AI Models</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
        </motion.div>

        {/* ── Model cards ─────────────────────────────────────────── */}
        <motion.div
          className="space-y-6"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
        >
          {MODELS.map(({ id, name, tag, icon: Icon, glowClass,
                         iconColor, badgeColor, accuracy, auc, sensitivity, specificity,
                         precision, f1, description, features, dataset, framework }) => {
            const barColor = id === 'manual' ? '#6366f1' : id === 'report' ? '#8b5cf6' : '#06b6d4'
            return (
              <motion.div key={id} variants={fadeUp} className="card-3d-wrap">
                <div className={`card-3d p-0 overflow-hidden group ${glowClass}`}
                     style={{ background: `linear-gradient(135deg, ${
                       id==='manual'?'rgba(10,8,42,0.82)':id==='report'?'rgba(13,6,40,0.82)':'rgba(4,18,26,0.82)'
                     }, rgba(8,8,26,0.75))` }}>

                  {/* ── Top accent stripe ── */}
                  <div className="h-0.5 w-full"
                       style={{ background: `linear-gradient(90deg, transparent 0%, ${barColor}cc 30%, ${barColor} 50%, ${barColor}cc 70%, transparent 100%)` }} />

                  <div className="p-6">
                    {/* ── Header row ── */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <div className="section-badge-3d flex-shrink-0"
                           style={{ width:'2.75rem', height:'2.75rem',
                                    background: `linear-gradient(135deg, ${barColor}30, ${barColor}18)`,
                                    border:`1px solid ${barColor}55` }}>
                        <Icon size={16} className={iconColor} />
                      </div>
                      <div>
                        <p className="text-base font-bold text-white leading-tight">{name}</p>
                        <span className={`inline-block text-[9.5px] font-semibold uppercase tracking-wider mt-0.5
                                         px-2 py-0.5 rounded-md border ${badgeColor}`}>
                          {tag}
                        </span>
                      </div>
                      {/* AUC badge */}
                      <div className="ml-auto flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold"
                           style={{ background:`${barColor}18`, border:`1px solid ${barColor}35`, color:barColor }}>
                        <span className="text-slate-500 font-normal text-[10px] mr-1">AUC-ROC</span>
                        {auc}
                      </div>
                    </div>

                    {/* ── Main content grid: gauge | bars | description ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr_1fr] gap-6 items-start">

                      {/* Arc gauge */}
                      <div className="flex flex-col items-center gap-2">
                        <ArcGauge value={accuracy} color={barColor} size={150} />
                        {/* Dataset + framework below gauge */}
                        <div className="text-center space-y-1">
                          <p className="text-[9.5px] text-slate-600 uppercase tracking-wider font-medium">Dataset</p>
                          <p className="text-[10px] text-slate-400 leading-snug">{dataset}</p>
                        </div>
                      </div>

                      {/* Performance bars */}
                      <div className="space-y-4 pt-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                          <BarChart3 size={11} />Performance Metrics
                        </p>
                        <StatBar label="Sensitivity (Recall)" value={sensitivity} color={barColor} delay={0.1} />
                        <StatBar label="Specificity"          value={specificity} color={barColor} delay={0.2} />
                        <StatBar label="Precision"            value={precision}  color={barColor} delay={0.3} />
                        <StatBar label="F₁ Score"             value={f1}         color={barColor} delay={0.4} />
                      </div>

                      {/* Description + features */}
                      <div className="space-y-4 pt-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                          <TrendingUp size={11} />About This Model
                        </p>
                        <p className="text-[11.5px] text-slate-400 leading-relaxed">{description}</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {features.map(f => (
                            <span key={f}
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-medium"
                                  style={{ background:`${barColor}14`, color:`${barColor}dd`,
                                           border:`1px solid ${barColor}30` }}>
                              <CheckCircle2 size={9} />
                              {f}
                            </span>
                          ))}
                        </div>
                        {/* Framework */}
                        <p className="text-[9.5px] text-slate-600">
                          <span className="text-slate-500 font-medium">Stack: </span>{framework}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* ── Technology stack ─────────────────────────────────────── */}
        <motion.section
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="space-y-5"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-3">
            <Zap size={14} className="text-amber-400 flex-shrink-0" />
            <h2 className="text-base font-bold text-white tracking-wide">Technology Stack</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
          </motion.div>

          <motion.div variants={fadeUp} className="card-3d-wrap">
            <div className="card-3d p-5"
                 style={{ border:'1px solid rgba(245,158,11,0.18)',
                          boxShadow:'0 2px 0 0 rgba(245,158,11,0.28), 0 12px 40px rgba(0,0,0,0.5)' }}>
              <div className="flex flex-wrap gap-2">
                {TECH.map(({ label, color }) => (
                  <span key={label}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide"
                        style={{ background:`${color}14`, color, border:`1px solid ${color}35`,
                                 boxShadow:`0 2px 0 ${color}25, 0 4px 12px rgba(0,0,0,0.3)` }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* ── Disclaimer ───────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="flex gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300/80 text-xs leading-relaxed"
        >
          <span className="text-amber-400 text-base flex-shrink-0">⚠</span>
          <p>
            Osteocare.ai is developed for <strong className="text-amber-300">educational and research purposes only</strong>.
            All predictions are AI-generated estimates and must not replace the advice of a qualified
            healthcare professional. Do not use this system for clinical decision-making without
            physician oversight.
          </p>
        </motion.div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-center space-y-2 pb-4"
        >
          <p className="text-[11px] text-slate-600">
            © 2026 Osteocare.ai — All rights reserved. Built with ❤ for Bone Health Research.
          </p>
          <div className="flex justify-center gap-4">
            <a href="https://github.com/mohanmuralikarumuri/Osteoporosis-AI-Prediction"
               target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-emerald-400 transition-colors">
              <Github size={12} />
              GitHub Repository
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
