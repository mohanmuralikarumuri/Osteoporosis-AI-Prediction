import { motion } from 'framer-motion'
import {
  ShieldAlert, CheckCircle2, AlertTriangle,
  Pill, Activity, TrendingDown, TrendingUp, Minus,
  Sparkles, Stethoscope, HeartPulse, FlaskConical,
  Dumbbell, Apple, Moon, Sun, Droplets, Wind,
  Bone, Syringe, Zap, BadgeInfo, TriangleAlert, CheckCheck,
} from 'lucide-react'
import { useLang } from '../context/LanguageContext'

/* ── Suggestion icon picker ─────────────────────────────────────────────── */
const SUGGESTION_ICONS = [
  { keywords: ['exercise','walk','physical','activ','weight-bear'], icon: Dumbbell,    color: '#f97316' },
  { keywords: ['diet','calcium','vitamin','nutriti','food','eat'],  icon: Apple,        color: '#22c55e' },
  { keywords: ['sleep','rest'],                                      icon: Moon,         color: '#818cf8' },
  { keywords: ['sun','sunlight','outdoor'],                          icon: Sun,          color: '#facc15' },
  { keywords: ['water','hydrat'],                                    icon: Droplets,     color: '#38bdf8' },
  { keywords: ['smoke','alcohol','avoid'],                           icon: Wind,         color: '#fb7185' },
  { keywords: ['bone','density','scan','dexa'],                      icon: Bone,         color: '#a78bfa' },
  { keywords: ['doctor','physician','consult','specialist','follow'], icon: Stethoscope,  color: '#34d399' },
]

function pickSuggestionIcon(text = '') {
  const lower = text.toLowerCase()
  for (const s of SUGGESTION_ICONS) {
    if (s.keywords.some(k => lower.includes(k))) return s
  }
  return { icon: CheckCheck, color: '#6366f1' }
}

/* ── Medication color palette ────────────────────────────────────────────── */
const MED_PALETTE = [
  { bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.22)',  icon: 'rgba(99,102,241,0.25)',  iconColor: '#a5b4fc', top: '#6366f1', badge: 'rgba(99,102,241,0.15)',  badgeText: '#a5b4fc'  },
  { bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.22)',  icon: 'rgba(14,165,233,0.25)', iconColor: '#7dd3fc', top: '#0ea5e9', badge: 'rgba(14,165,233,0.15)',  badgeText: '#7dd3fc'  },
  { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.22)',  icon: 'rgba(168,85,247,0.25)', iconColor: '#d8b4fe', top: '#a855f7', badge: 'rgba(168,85,247,0.15)',  badgeText: '#d8b4fe'  },
  { bg: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.22)',  icon: 'rgba(20,184,166,0.25)', iconColor: '#5eead4', top: '#14b8a6', badge: 'rgba(20,184,166,0.15)',  badgeText: '#5eead4'  },
  { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)',  icon: 'rgba(245,158,11,0.25)', iconColor: '#fcd34d', top: '#f59e0b', badge: 'rgba(245,158,11,0.15)',  badgeText: '#fcd34d'  },
]

/* ── Risk config ─────────────────────────────────────────────────────────── */
const RISK_CONFIG = {
  High: {
    Icon: ShieldAlert,
    gradient: 'from-red-600/30 via-red-500/10 to-transparent',
    border: 'border-red-500/40',
    glow: '0 0 40px rgba(239,68,68,0.25), 0 0 80px rgba(239,68,68,0.1)',
    iconBg: 'bg-red-500/20 border-red-500/40',
    iconColor: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-500/40',
    bar: 'from-red-500 to-rose-400',
    ring: 'rgba(239,68,68,0.6)',
    accent: '#ef4444',
    dot: 'bg-red-400',
  },
  Moderate: {
    Icon: AlertTriangle,
    gradient: 'from-amber-600/30 via-amber-500/10 to-transparent',
    border: 'border-amber-500/40',
    glow: '0 0 40px rgba(245,158,11,0.25), 0 0 80px rgba(245,158,11,0.1)',
    iconBg: 'bg-amber-500/20 border-amber-500/40',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    bar: 'from-amber-500 to-yellow-400',
    ring: 'rgba(245,158,11,0.6)',
    accent: '#f59e0b',
    dot: 'bg-amber-400',
  },
  Low: {
    Icon: CheckCircle2,
    gradient: 'from-emerald-600/30 via-emerald-500/10 to-transparent',
    border: 'border-emerald-500/40',
    glow: '0 0 40px rgba(16,185,129,0.25), 0 0 80px rgba(16,185,129,0.1)',
    iconBg: 'bg-emerald-500/20 border-emerald-500/40',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    bar: 'from-emerald-500 to-teal-400',
    ring: 'rgba(16,185,129,0.6)',
    accent: '#10b981',
    dot: 'bg-emerald-400',
  },
}

/* ── Circular confidence gauge ───────────────────────────────────────────── */
function ConfidenceGauge({ value, accent }) {
  const pct  = Math.round(value * 100)
  const r    = 40
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-30"
        style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
      />
      <svg width="112" height="112" className="rotate-[-90deg]">
        <circle cx="56" cy="56" r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle
          cx="56" cy="56" r={r}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.6" />
            <stop offset="100%" stopColor={accent} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-black text-white font-mono leading-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {pct}%
        </motion.span>
        <span className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">confidence</span>
      </div>
    </div>
  )
}

/* ── Metric tile ─────────────────────────────────────────────────────────── */
function MetricTile({ label, value, icon, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden rounded-2xl p-4 text-center group"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 50% 0%, ${accent}18 0%, transparent 70%)` }}
      />
      <div className="flex items-center justify-center gap-1 mb-2">
        {icon}
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">{label}</p>
      </div>
      <p className="text-xl font-black font-mono text-white leading-none">{value}</p>
    </motion.div>
  )
}

/* ── T-Score icon ────────────────────────────────────────────────────────── */
function TScoreIcon({ score }) {
  if (score <= -2.5) return <TrendingDown size={12} className="text-red-400" />
  if (score <= -1.0) return <Minus size={12} className="text-amber-400" />
  return <TrendingUp size={12} className="text-emerald-400" />
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function ResultCard({ result }) {
  if (!result) return null
  const { t } = useLang()
  const cfg     = RISK_CONFIG[result.riskLevel] ?? RISK_CONFIG.Moderate
  const { Icon } = cfg

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  }
  const rise = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

      {/* ── BLOCK 1: Hero Diagnosis ─────────────────────────────────── */}
      <motion.div
        variants={rise}
        className={`relative overflow-hidden rounded-3xl border ${cfg.border}`}
        style={{
          background: 'rgba(5,5,20,0.7)',
          backdropFilter: 'blur(24px)',
          boxShadow: cfg.glow,
        }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} pointer-events-none`} />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.accent}80, transparent)` }}
        />

        <div className="relative p-6">
          <div className="flex items-start gap-5">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
              className={`relative w-16 h-16 rounded-2xl border ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}
              style={{ boxShadow: `0 0 24px ${cfg.ring}` }}
            >
              <motion.div
                className={`absolute inset-0 rounded-2xl border ${cfg.border}`}
                animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
              <Icon size={28} className={cfg.iconColor} />
            </motion.div>

            <div className="flex-1 min-w-0 pt-1">
              <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1 font-medium">
                {t.resultDiagnosis}
              </p>
              <motion.h2
                className="text-2xl font-black text-white leading-tight"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {result.diagnosis}
              </motion.h2>
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 }}
                className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold border ${cfg.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                {result.riskLevel} {t.resultRisk}
              </motion.span>
            </div>

            <div className="flex-shrink-0 hidden sm:block">
              <ConfidenceGauge value={result.confidence} accent={cfg.accent} />
            </div>
          </div>

          {/* Mobile confidence bar */}
          <div className="sm:hidden mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>{t.resultConfidence}</span>
              <span className="font-mono text-white font-bold">{Math.round(result.confidence * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(result.confidence * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                className={`h-full rounded-full bg-gradient-to-r ${cfg.bar}`}
                style={{ boxShadow: `0 0 10px ${cfg.accent}` }}
              />
            </div>
          </div>

          {/* Metric tiles */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <MetricTile label={t.resultTScore}   value={result.tScore ?? '--'}          icon={<TScoreIcon score={result.tScore} />}                      accent={cfg.accent} delay={0.30} />
            <MetricTile label={t.resultBMD}       value={result.bmd ?? '--'}             icon={<Activity   size={11} className="text-brand-400" />}       accent={cfg.accent} delay={0.38} />
            <MetricTile label={t.resultFracture}  value={result.fractureRisk10yr ?? '--'} icon={<HeartPulse size={11} className="text-pink-400" />}       accent={cfg.accent} delay={0.46} />
          </div>
        </div>
      </motion.div>

      {/* ── BLOCK 2: Recommendations ────────────────────────────────── */}
      <motion.div
        variants={rise}
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Section header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', boxShadow: '0 0 16px rgba(251,191,36,0.15)' }}
          >
            <Sparkles size={16} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{t.resultSuggestions}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{result.suggestions.length} personalised recommendations</p>
          </div>
          <span
            className="ml-auto flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: 'rgba(251,191,36,0.7)' }}
          >
            <Stethoscope size={9} />
            {t.resultConsult}
          </span>
        </div>

        {/* Suggestion cards */}
        <div className="p-4 space-y-3">
          {result.suggestions.map((s, i) => {
            const { icon: SIcon, color: sColor } = pickSuggestionIcon(s)
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.45 + i * 0.07 }}
                className="group relative flex items-start gap-4 rounded-2xl p-4"
                style={{ background: `${sColor}08`, border: `1px solid ${sColor}22` }}
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                  style={{ background: `linear-gradient(180deg, ${sColor}cc, ${sColor}30)` }}
                />

                {/* Icon */}
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
                  style={{ background: `${sColor}18`, border: `1px solid ${sColor}35`, boxShadow: `0 0 12px ${sColor}20` }}
                >
                  <SIcon size={16} style={{ color: sColor }} />
                </div>

                {/* Text */}
                <p className="flex-1 text-sm text-slate-200 leading-relaxed group-hover:text-white transition-colors">{s}</p>

                {/* Step badge */}
                <div
                  className="flex-shrink-0 self-start text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: `${sColor}20`, border: `1px solid ${sColor}40`, color: sColor }}
                >
                  {i + 1}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {result.suggestions.map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{ width: i === 0 ? '16px' : '6px', height: '4px', background: i === 0 ? cfg.accent : 'rgba(255,255,255,0.12)', transition: 'all 0.3s' }}
            />
          ))}
        </div>
      </motion.div>

      {/* ── BLOCK 3: Medications ────────────────────────────────────── */}
      <motion.div
        variants={rise}
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Section header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)', boxShadow: '0 0 16px rgba(99,102,241,0.2)' }}
          >
            <FlaskConical size={16} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{t.resultMeds}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{result.medications.length} prescribed items</p>
          </div>
          <span
            className="ml-auto text-[10px] px-2.5 py-1 rounded-full font-mono"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}
          >
            Rx
          </span>
        </div>

        {/* Med cards */}
        <div className="p-4 space-y-3">
          {result.medications.map((med, i) => {
            const pal     = MED_PALETTE[i % MED_PALETTE.length]
            const isStr   = typeof med === 'string'
            const name    = isStr ? med    : (med.name    ?? med)
            const cls     = isStr ? null   : med.class
            const dosage  = isStr ? null   : med.dosage
            const note    = isStr ? null   : med.note

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.55 + i * 0.08 }}
                className="group relative overflow-hidden rounded-2xl"
                style={{ background: pal.bg, border: `1px solid ${pal.border}` }}
                whileHover={{ y: -2, boxShadow: `0 8px 32px ${pal.top}18`, transition: { duration: 0.2 } }}
              >
                {/* Top color stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: `linear-gradient(90deg, transparent, ${pal.top}90, transparent)` }}
                />

                {/* Hover wash */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 0% 50%, ${pal.top}10 0%, transparent 60%)` }}
                />

                <div className="relative flex items-start gap-4 p-4">

                  {/* Pill icon with pulse */}
                  <div
                    className="relative flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: pal.icon, border: `1px solid ${pal.top}40`, boxShadow: `0 0 16px ${pal.top}20` }}
                  >
                    <Pill size={18} style={{ color: pal.iconColor }} />
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      style={{ border: `1px solid ${pal.top}50` }}
                      animate={{ scale: [1, 1.25], opacity: [0.5, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: i * 0.5 }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Name + class row */}
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white leading-snug flex-1">{name}</p>
                      {cls && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: pal.badge, border: `1px solid ${pal.top}30`, color: pal.badgeText }}
                        >
                          {cls}
                        </span>
                      )}
                    </div>

                    {/* Dosage chip */}
                    {dosage && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Zap size={9} style={{ color: pal.iconColor }} />
                        <span
                          className="text-[11px] font-mono px-2.5 py-0.5 rounded-lg"
                          style={{ background: `${pal.top}14`, color: pal.badgeText, border: `1px solid ${pal.top}25` }}
                        >
                          {dosage}
                        </span>
                      </div>
                    )}

                    {/* Note */}
                    {note && (
                      <div className="flex items-start gap-1.5 mt-2">
                        <BadgeInfo size={11} className="text-slate-600 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-500 leading-relaxed italic">{note}</p>
                      </div>
                    )}
                  </div>

                  {/* Index badge */}
                  <div
                    className="self-start flex-shrink-0 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: `${pal.top}20`, color: pal.badgeText, border: `1px solid ${pal.top}30` }}
                  >
                    {i + 1}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Medication warning */}
        <div
          className="flex items-center gap-2 mx-4 mb-4 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
        >
          <TriangleAlert size={12} className="text-amber-500 flex-shrink-0" />
          <p className="text-[10px] text-amber-600/80 leading-relaxed">
            Always consult your physician before starting, changing, or stopping any medication.
          </p>
        </div>
      </motion.div>

      {/* ── Disclaimer ─────────────────────────────────────────────── */}
      <motion.div
        variants={rise}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] text-slate-500"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <ShieldAlert size={14} className="text-slate-600 flex-shrink-0" />
        {t.resultDisclaimer}
      </motion.div>

    </motion.div>
  )
}