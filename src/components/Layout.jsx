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
        {/* Primary dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#050510]/85 via-[#0a0a1e]/75 to-[#100520]/85" />
        {/* Brand color tint – top-left */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgba(99,102,241,0.18)_0%,transparent_60%)]" />
        {/* Purple accent – bottom-right */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(139,92,246,0.14)_0%,transparent_60%)]" />
        {/* Cyan accent – center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_50%_50%,rgba(6,182,212,0.06)_0%,transparent_70%)]" />
      </div>

      {/* ─── Animated ambient orbs ─────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -10 }}>
        <div className="orb absolute w-96 h-96 bg-brand-600/20 top-[-10%] left-[-5%]" style={{ animationDelay: '0s' }} />
        <div className="orb absolute w-80 h-80 bg-violet-600/15 bottom-[-5%] right-[5%]" style={{ animationDelay: '3s' }} />
        <div className="orb absolute w-64 h-64 bg-cyan-600/10 top-[40%] right-[20%]" style={{ animationDelay: '6s' }} />
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
