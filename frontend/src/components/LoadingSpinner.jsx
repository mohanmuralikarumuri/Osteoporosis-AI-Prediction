import { motion } from 'framer-motion'

/**
 * Reusable full-region loading overlay.
 * @param {string} message – text shown beneath the spinner
 * @param {string} subtext  – smaller description line
 */
export default function LoadingSpinner({ message = 'Analyzing…', subtext = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-5 py-16"
    >
      {/* Rotating rings */}
      <div className="relative w-16 h-16">
        <span className="absolute inset-0 rounded-full border-2 border-brand-600/20" />
        <span className="absolute inset-0 rounded-full border-t-2 border-brand-400 animate-spin" />
        <span
          className="absolute inset-2 rounded-full border-t-2 border-brand-300 animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '0.7s' }}
        />
        <span className="absolute inset-4 rounded-full bg-brand-600/20 blur-sm" />
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-slate-200">{message}</p>
        {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-400"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  )
}
