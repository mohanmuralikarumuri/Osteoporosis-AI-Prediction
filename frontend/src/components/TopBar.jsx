import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronDown, Check, Menu, Bone, Info, X, Brain, ShieldCheck, Activity } from 'lucide-react'
import { LANGUAGES, useLang } from '../context/LanguageContext'

/**
 * TopBar – persistent header bar across every page.
 * Contains: app brand (mobile), page breadcrumb, About Us popover, and language switcher.
 */

function AboutPopover({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute right-0 top-[calc(100%+10px)] z-50 w-72
                 rounded-2xl overflow-hidden
                 bg-[#0f0f1e]/95 backdrop-blur-xl
                 border border-white/[0.09]
                 shadow-2xl shadow-black/80"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-brand-600/25 border border-brand-500/30 flex items-center justify-center">
            <Bone size={12} className="text-brand-400" />
          </div>
          <span className="text-sm font-semibold text-white">About Osteocare.ai</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.07] transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        <p className="text-xs text-slate-400 leading-relaxed">
          An AI-powered clinical decision-support tool for early osteoporosis detection,
          built with state-of-the-art machine learning models trained on real patient data.
        </p>

        {/* Accuracy highlight */}
        <div className="rounded-xl bg-brand-600/10 border border-brand-500/20 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-brand-400 font-semibold">Model Performance</p>

          {/* Manual predictor — hero stat */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
              <Brain size={14} className="text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Manual Predictor</span>
                <span className="text-sm font-bold text-brand-300">96%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '96%' }}
                  transition={{ delay: 0.25, duration: 0.7, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Tabular Stacking Ensemble · 16 clinical features</p>
            </div>
          </div>

          {/* X-ray predictor */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <Activity size={14} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">X-Ray Predictor</span>
                <span className="text-sm font-bold text-cyan-300">CNN</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">EfficientNet-B3 · Fine-tuned on bone X-rays</p>
            </div>
          </div>
        </div>

        {/* Badge row */}
        <div className="flex flex-wrap gap-1.5">
          {['FastAPI', 'PyTorch', 'scikit-learn', 'React'].map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.07] flex items-center gap-1.5">
        <ShieldCheck size={11} className="text-green-400 flex-shrink-0" />
        <p className="text-[10px] text-slate-500">For clinical decision support only — not a medical diagnosis.</p>
      </div>
    </motion.div>
  )
}

export default function TopBar({ onMenuOpen }) {
  const { lang, setLang, t, currentLang } = useLang()
  const [open, setOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const dropdownRef = useRef(null)
  const aboutRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
      if (aboutRef.current && !aboutRef.current.contains(e.target)) setAboutOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="flex-shrink-0 flex items-center justify-between h-14 px-4 md:px-6 glass-topbar z-30 relative">

      {/* ─── Left: mobile menu + brand ──────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Hamburger – only on mobile */}
        {onMenuOpen && (
          <button
            onClick={onMenuOpen}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white
                       hover:bg-surface-hover transition-colors"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        )}

        {/* Brand mark – visible only on mobile (desktop sidebar handles it) */}
        <div className="flex lg:hidden items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600/20 border border-brand-500/30
                          flex items-center justify-center">
            <Bone size={14} className="text-brand-400" />
          </div>
          <span className="text-sm font-bold text-white tracking-wide">Osteocare.ai</span>
        </div>

        {/* Desktop tagline */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-slow" />
          <span className="text-xs text-slate-500 font-medium">{t.topBarTagline}</span>
        </div>
      </div>

      {/* ─── Right: About Us + language switcher ────────────────────── */}
      <div className="flex items-center gap-2">

        {/* About Us pill button */}
        <div ref={aboutRef} className="relative">
          <button
            onClick={() => { setAboutOpen((v) => !v); setOpen(false) }}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
              border transition-all duration-200 select-none
              ${aboutOpen
                ? 'bg-brand-600/20 border-brand-500/40 text-brand-300 shadow-glow-sm'
                : 'bg-white/[0.05] border-white/[0.09] text-slate-400 hover:text-white hover:border-brand-500/30 hover:bg-brand-600/10'
              }
            `}
          >
            <Info size={13} className="flex-shrink-0" />
            <span className="hidden sm:inline">About Us</span>
          </button>

          <AnimatePresence>
            {aboutOpen && <AboutPopover onClose={() => setAboutOpen(false)} />}
          </AnimatePresence>
        </div>

        {/* ─── Language switcher ──────────────────────────────────── */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm
            border transition-all duration-200 select-none
            ${open
              ? 'bg-brand-600/20 border-brand-500/40 text-white shadow-glow-sm'
              : 'bg-white/[0.05] border-white/[0.09] text-slate-400 hover:text-white hover:border-brand-500/30 hover:bg-brand-600/10'
            }
          `}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <Globe size={14} className="flex-shrink-0" />
          <span className="text-base leading-none" aria-hidden>{currentLang?.flag}</span>
          <span className="hidden sm:inline font-medium text-xs">{currentLang?.label}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={12} className="text-slate-500" />
          </motion.span>
        </button>

        {/* Dropdown list */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute right-0 top-[calc(100%+8px)] z-50
                         w-48 rounded-2xl overflow-hidden
                         glass-dropdown
                         shadow-2xl shadow-black/80"
              role="listbox"
              aria-label={t.language}
            >
              {/* Header */}
              <div className="px-3 py-2 border-b border-white/[0.07]">
                <p className="text-[10px] uppercase tracking-widest text-slate-600 font-medium flex items-center gap-1.5">
                  <Globe size={10} />
                  {t.language}
                </p>
              </div>

              {/* Options */}
              <div className="py-1 max-h-72 overflow-y-auto">
                {LANGUAGES.map((l) => {
                  const active = l.code === lang
                  return (
                    <button
                      key={l.code}
                      role="option"
                      aria-selected={active}
                      onClick={() => { setLang(l.code); setOpen(false) }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 text-sm
                        transition-colors duration-150
                        ${active
                          ? 'bg-brand-600/20 text-brand-300'
                          : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'}
                      `}
                    >
                      <span className="text-base w-5 text-center leading-none" aria-hidden>
                        {l.flag}
                      </span>
                      <span className="flex-1 text-left font-medium">{l.label}</span>
                      {active && (
                        <Check size={12} className="text-brand-400 flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </header>
  )
}
