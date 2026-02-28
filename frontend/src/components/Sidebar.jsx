import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  ClipboardList,
  FileText,
  Scan,
  Activity,
  ChevronRight,
  Bone,
  X,
  Users,
  Layers,
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../context/LanguageContext'

export default function Sidebar({ onClose, mobile = false }) {
  const location = useLocation()
  const { t } = useLang()

  const NAV_ITEMS = [
    { to: '/',       label: t.navHome,   icon: Home,          desc: t.navHomeDesc   },
    { to: '/manual', label: t.navManual, icon: ClipboardList, desc: t.navManualDesc },
    { to: '/report', label: t.navReport, icon: FileText,      desc: t.navReportDesc },
    { to: '/xray',   label: t.navXray,   icon: Scan,          desc: t.navXrayDesc   },
    { to: '/mri',    label: t.navMri,    icon: Layers,        desc: t.navMriDesc    },
    { to: '/about',  label: t.navAbout,  icon: Users,         desc: t.navAboutDesc  },
  ]

  return (
    <aside className="flex flex-col h-full w-64 glass-sidebar select-none">

      {/* ─── Logo ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30
                          flex items-center justify-center shadow-glow-sm">
            <Bone size={18} className="text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">{t.appName}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{t.appSub}</p>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        )}
      </div>

      {/* ─── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-slate-600 px-3 pb-2 font-medium">
          Navigation
        </p>

        {NAV_ITEMS.map(({ to, label, icon: Icon, desc }) => {
          const active = location.pathname === to
          return (
            <NavLink
              key={to}
              to={to}
              onClick={mobile ? onClose : undefined}
              className={`
                group flex items-center gap-3 px-3 py-3 rounded-xl text-sm
                font-medium transition-all duration-200 relative overflow-hidden
                ${active
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40 nav-active-glow'
                  : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 border border-transparent'}
              `}
            >
              {active && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-brand-600/10 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                transition-colors duration-200
                ${active ? 'bg-brand-600/30 text-brand-300' : 'bg-white/[0.05] text-slate-500 group-hover:bg-white/[0.09] group-hover:text-slate-300'}
              `}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate">{label}</p>
                <p className={`text-[11px] truncate transition-colors ${active ? 'text-brand-400/70' : 'text-slate-600 group-hover:text-slate-500'}`}>
                  {desc}
                </p>
              </div>
              {active && <ChevronRight size={14} className="text-brand-400 flex-shrink-0" />}
            </NavLink>
          )
        })}
      </nav>

      {/* ─── Status footer ────────────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <div className="glass-card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow shadow-[0_0_6px_#34d399]" />
            <span className="text-xs text-slate-400 font-medium">{t.mlStatus}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{t.mlBackend}</span>
            <span className="text-amber-400 font-mono">{t.mlMockMode}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{t.mlModels}</span>
            <span className="text-emerald-400 font-mono">{t.mlActive}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 px-1">
          <Activity size={12} className="text-slate-600" />
          <p className="text-[10px] text-slate-600">
            Built for educational use only.
          </p>
        </div>
      </div>
    </aside>
  )
}
