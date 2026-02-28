import { Link } from 'react-router-dom'
import { ClipboardList, FileText, Scan, ChevronRight, Info } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../context/LanguageContext'

const COLOR_MAP = {
  brand:  { ring: 'ring-brand-500/30',  bg: 'bg-brand-600/15',  icon: 'text-brand-400',  hover: 'hover:border-brand-500/50 hover:shadow-glow-sm' },
  violet: { ring: 'ring-violet-500/30', bg: 'bg-violet-600/15', icon: 'text-violet-400', hover: 'hover:border-violet-500/50' },
  cyan:   { ring: 'ring-cyan-500/30',   bg: 'bg-cyan-600/15',   icon: 'text-cyan-400',   hover: 'hover:border-cyan-500/50' },
}

function HintBanner({ show, onDismiss }) {
  const { t } = useLang()
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20
                     flex items-center gap-2 px-4 py-2
                     bg-surface-card/90 backdrop-blur-md
                     border border-surface-border rounded-full text-xs text-slate-400
                     shadow-lg"
        >
          <Info size={12} className="text-brand-400" />
          {t.homeHint}
          <button onClick={onDismiss} className="ml-1 text-slate-600 hover:text-white">✕</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Home() {
  const [hint, setHint] = useState(true)
  const { t } = useLang()

  const TOOLS = [
    { to: '/manual', icon: ClipboardList, label: t.navManual, desc: t.navManualDesc, color: 'brand'  },
    { to: '/report', icon: FileText,      label: t.navReport, desc: t.navReportDesc, color: 'violet' },
    { to: '/xray',   icon: Scan,          label: t.navXray,   desc: t.navXrayDesc,  color: 'cyan'   },
  ]

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">

      {/* ─── Full-screen video background ───────────────────────────── */}
      <video
        autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
        src="/bg-video.mp4"
      />

      {/* ─── Overlay gradients for readability ───────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#05050f]/65 via-[#05050f]/35 to-[#05050f]/88" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_40%,rgba(99,102,241,0.12)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_0%_100%,rgba(139,92,246,0.12)_0%,transparent_60%)]" />
      </div>

      {/* Hint tooltip */}
      <HintBanner show={hint} onDismiss={() => setHint(false)} />

      {/* ─── Overlay UI ───────────────────────────────────────────────── */}
      <div className="relative flex flex-col h-full pointer-events-none" style={{ zIndex: 2 }}>

        {/* Top title */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="pt-6 px-6 pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md
                          border border-white/10 rounded-2xl px-4 py-2 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse shadow-[0_0_6px_#818cf8]" />
            <span className="text-xs font-medium text-slate-400">Osteocare.ai — AI-powered bone health analysis</span>
          </div>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom panel – Tool cards ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="pointer-events-auto px-4 pb-10"
        >
          {/* Headline */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t.homeTitle.split('AI').map((part, i, arr) =>
                i < arr.length - 1
                  ? <span key={i}>{part}<span className="text-brand-400">AI</span></span>
                  : <span key={i}>{part}</span>
              )}
            </h1>
            <p className="text-sm text-slate-400 mt-2">{t.homeSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {TOOLS.map(({ to, icon: Icon, label, desc, color }, i) => {
              const c = COLOR_MAP[color]
              return (
                <motion.div
                  key={to}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  <Link
                    to={to}
                    className={`
                      group flex items-start gap-4 p-6 rounded-2xl
                      bg-black/50 backdrop-blur-xl
                      border border-white/10
                      ${c.hover} transition-all duration-200
                      hover:scale-[1.02] active:scale-95
                      shadow-xl shadow-black/50
                    `}
                  >
                    <div className={`w-14 h-14 rounded-2xl ${c.bg} ring-1 ${c.ring}
                                    flex items-center justify-center flex-shrink-0`}>
                      <Icon size={26} className={c.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-white group-hover:text-brand-300 transition-colors">
                        {label}
                      </p>
                      <p className="text-sm text-slate-400 mt-1 leading-snug">{desc}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-600 group-hover:text-slate-400 mt-1 flex-shrink-0" />
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
