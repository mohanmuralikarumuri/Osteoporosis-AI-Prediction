import { Html } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle } from 'lucide-react'

/**
 * BoneAnnotation – renders a floating HTML panel attached to a 3D hotspot.
 * Uses @react-three/drei <Html> to position it in 3D space.
 */
export default function BoneAnnotation({ title, description, conditions, position, onClose }) {
  return (
    <Html
      position={position}
      center
      distanceFactor={8}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'auto' }}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          transition={{ duration: 0.25, ease: 'backOut' }}
          className="w-64 rounded-2xl bg-[#16162a]/95 backdrop-blur-md
                     border border-[#2a2a4a] shadow-2xl shadow-black/60
                     text-white overflow-hidden"
          style={{ fontFamily: 'Inter, ui-sans-serif' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          bg-indigo-600/20 border-b border-indigo-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-indigo-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-indigo-200">{title}</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors p-0.5 rounded"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-3 space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">{description}</p>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2 font-medium">
                Common Conditions
              </p>
              <ul className="space-y-1.5">
                {conditions.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    <span className="text-[11px] text-slate-300">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </Html>
  )
}
