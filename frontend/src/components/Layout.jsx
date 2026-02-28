import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#05050f]">

      {/* ─── Video Background ──────────────────────────────────────────── */}
      <video
        autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: -20, opacity: 0.45 }}
        src="/bg-video.mp4"
      />

      {/* ─── Overlay layers for depth & readability ────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: -15 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#050510]/88 via-[#0a0a1e]/78 to-[#100520]/88" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgba(99,102,241,0.22)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(168,85,247,0.18)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_50%_50%,rgba(6,182,212,0.09)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_20%,rgba(236,72,153,0.10)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_15%_78%,rgba(20,184,166,0.09)_0%,transparent_60%)]" />
      </div>

      {/* ─── 3-D perspective grid floor ────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-72 pointer-events-none" style={{ zIndex: -12 }}>
        <div className="perspective-grid" />
      </div>

      {/* ─── Animated ambient orbs ─────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -10 }}>
        <div className="orb absolute w-[30rem] h-[30rem] bg-indigo-600/25  top-[-12%] left-[-6%]"  style={{ animationDelay: '0s',  animationDuration: '12s' }} />
        <div className="orb absolute w-96         h-96         bg-violet-600/20 bottom-[-6%] right-[4%]"  style={{ animationDelay: '3s',  animationDuration: '14s' }} />
        <div className="orb absolute w-72         h-72         bg-cyan-500/18   top-[38%] right-[18%]"  style={{ animationDelay: '6s',  animationDuration: '10s' }} />
        <div className="orb absolute w-60         h-60         bg-pink-500/14   top-[10%] right-[10%]"  style={{ animationDelay: '2s',  animationDuration: '16s' }} />
        <div className="orb absolute w-64         h-64         bg-teal-500/14   bottom-[22%] left-[8%]" style={{ animationDelay: '8s',  animationDuration: '13s' }} />
        <div className="orb absolute w-52         h-52         bg-fuchsia-500/12 top-[55%] left-[35%]" style={{ animationDelay: '5s',  animationDuration: '18s' }} />
        <div className="orb absolute w-44         h-44         bg-amber-500/10  top-[22%] left-[45%]"  style={{ animationDelay: '9s',  animationDuration: '15s' }} />
      </div>

      {/* ─── 3-D floating geometric shapes ─────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -9 }}>
        <div className="shape-cube shape-cube--1" />
        <div className="shape-cube shape-cube--2" />
        <div className="shape-ring shape-ring--1" />
        <div className="shape-ring shape-ring--2" />
        <div className="shape-tri  shape-tri--1"  />
        <div className="shape-tri  shape-tri--2"  />
      </div>

      {/* ─── Desktop sidebar (always visible) ─────────────────────────── */}
      <div className="hidden lg:flex flex-shrink-0 relative" style={{ zIndex: 10 }}>
        <Sidebar />
      </div>

      {/* ─── Mobile sidebar overlay ────────────────────────────────────── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              key="mobile-sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
            >
              <Sidebar mobile onClose={() => setMobileSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative" style={{ zIndex: 1 }}>

        {/* Top bar – visible on all screen sizes */}
        <TopBar onMenuOpen={() => setMobileSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
