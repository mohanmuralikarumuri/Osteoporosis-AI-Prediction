import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronDown, Check, Menu, Bone } from 'lucide-react'
import { LANGUAGES, useLang } from '../context/LanguageContext'

/**
 * TopBar – persistent header bar across every page.
 * Contains: app brand (mobile), page breadcrumb, and language switcher.
 */
export default function TopBar({ onMenuOpen }) {
  const { lang, setLang, t, currentLang } = useLang()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
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

      {/* ─── Right: language switcher ────────────────────────────────── */}
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
    </header>
  )
}
