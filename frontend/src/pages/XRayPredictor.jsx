import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Scan, Upload, X, CheckCircle2, ImageOff, ZoomIn, ZoomOut, Maximize2, Activity } from 'lucide-react'
import { analyzeXRay } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ResultCard from '../components/ResultCard'
import { useLang } from '../context/LanguageContext'
import BoneBackground from '../three/BoneBackground'

const ACCEPTED_XRAY = {
  'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.dcm', '.webp'],
}

export default function XRayPredictor() {
  const { t } = useLang()
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [scanning, setScanning] = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState(null)
  const [zoom, setZoom]         = useState(1)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError(null)
    setZoom(1)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_XRAY,
    multiple: false,
    maxSize: 30 * 1024 * 1024, // 30 MB
  })

  const handleRemove = (e) => {
    e.stopPropagation()
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setScanning(true)
    setResult(null)
    setError(null)
    try {
      const data = await analyzeXRay(file)
      setResult(data)
    } catch {
      setError('X-Ray analysis failed. Please ensure the image is a valid bone radiograph.')
    } finally {
      setLoading(false)
      setScanning(false)
    }
    setTimeout(() => document.getElementById('xray-results')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <div className="relative min-h-full">
      {/* 3-D bone background – cyan/teal theme */}
      <BoneBackground
        accentColor="#06b6d4"
        secondColor="#14b8a6"
        gradientFrom="rgba(3,14,28,0.96)"
        gradientTo="rgba(3,22,30,0.96)"
        boneCount={14}
      />

      {/* Page content */}
      <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto fade-in-up">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30
                        flex items-center justify-center">
          <Scan size={20} className="text-cyan-400" />
        </div>
        <div>
          <h1 className="section-title">{t.xrayTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t.xraySub}</p>
        </div>
      </div>

      {/* ─── Two-column layout: Viewer | Results ─────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Left: X-ray viewer ───────────────────────────────────── */}
        <div className="space-y-4">

          {/* Drop zone / viewer */}
          <div
            {...(preview ? {} : getRootProps())}
            className={`
              glass-card border-2 border-dashed overflow-hidden
              transition-all duration-200
              ${!preview
                ? isDragActive
                  ? 'border-cyan-500/60 bg-cyan-500/10 cursor-pointer shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                  : 'border-surface-border hover:border-cyan-500/40 hover:bg-surface-hover cursor-pointer'
                : 'border-cyan-500/20 cursor-default'
              }
            `}
          >
            {!preview ? (
              <>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                  <motion.div
                    animate={{ y: isDragActive ? -6 : 0 }}
                    className="relative"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-cyan-600/10 border border-cyan-500/20
                                    flex items-center justify-center">
                      <Scan size={36} className="text-cyan-500/60" />
                    </div>
                    {/* Scan lines */}
                    <div className="absolute inset-0 overflow-hidden rounded-2xl">
                      {[0.2, 0.4, 0.6, 0.8].map((t, i) => (
                        <div
                          key={i}
                          className="absolute left-0 right-0"
                          style={{ top: `${t * 100}%`, height: '1px', background: `rgba(6,182,212,${0.06 + i*0.04})` }}
                        />
                      ))}
                    </div>
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                    {isDragActive ? t.xrayDropActive : t.xrayDrop}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{t.xrayFormats}</p>
                  </div>
                  <span className="text-xs text-cyan-400 bg-cyan-600/10 border border-cyan-500/20
                                   px-3 py-1 rounded-full">
                    {t.xrayBrowse}
                  </span>
                </div>
              </>
            ) : (
              /* ── X-ray image viewer ─────────────────────────────── */
              <div className="relative bg-black rounded-2xl overflow-hidden" style={{ minHeight: 300 }}>
                {/* Viewer toolbar */}
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1
                                bg-black/60 backdrop-blur-sm rounded-lg p-1 border border-white/10">
                  <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                          className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white">
                    <ZoomOut size={13} />
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 px-1 min-w-[36px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                          className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white">
                    <ZoomIn size={13} />
                  </button>
                  <button onClick={() => setZoom(1)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white">
                    <Maximize2 size={13} />
                  </button>
                  <button onClick={handleRemove} className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 ml-1">
                    <X size={13} />
                  </button>
                </div>

                {/* Image */}
                <div className="overflow-auto" style={{ maxHeight: 420 }}>
                  <img
                    src={preview}
                    alt="X-ray preview"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.2s ease',
                      filter: 'brightness(1.1) contrast(1.1)',
                    }}
                    className="w-full object-contain block"
                    draggable={false}
                  />
                </div>

                {/* Scanning overlay */}
                {scanning && (
                  <div className="absolute inset-0 bg-cyan-500/5 rounded-2xl overflow-hidden pointer-events-none">
                    <div className="scan-line" />
                    {/* Grid overlay */}
                    <div className="absolute inset-0 opacity-10"
                         style={{
                           backgroundImage: 'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)',
                           backgroundSize: '40px 40px',
                         }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-[#0f0f1a]/90 border border-cyan-500/40 rounded-xl
                                      px-5 py-3 text-xs text-cyan-300 font-medium flex items-center gap-2
                                      backdrop-blur shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        AI scanning bone structure…
                      </div>
                    </div>
                  </div>
                )}

                {/* File info chip */}
                <div className="absolute bottom-2 left-2 flex items-center gap-2
                                bg-black/70 backdrop-blur rounded-lg px-2 py-1.5 border border-white/10">
                  <CheckCircle2 size={11} className="text-emerald-400" />
                  <span className="text-[10px] text-slate-400 truncate max-w-[160px]">{file?.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Re-upload button when file selected */}
          {preview && !scanning && (
            <div className="flex gap-3">
              <div {...getRootProps()} className="flex-shrink-0">
                <input {...getInputProps()} />
                <button type="button" className="btn-secondary flex items-center gap-2 text-sm h-full">
                  <Upload size={14} />
                  {t.xrayReplace}
                </button>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={!file || loading}
                className="flex-1 btn-primary flex items-center justify-center gap-2
                           bg-cyan-600 hover:bg-cyan-500
                           shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:shadow-[0_0_24px_rgba(6,182,212,0.4)]"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    {t.xrayAnalyzing}
                  </>
                ) : (
                  <>
                    <Scan size={16} />
                    {t.xrayAnalyze}
                  </>
                )}
              </button>
            </div>
          )}

          {/* If no file yet – single CTA */}
          {!preview && (
            <button
              disabled
              className="btn-primary w-full opacity-40 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Scan size={16} />
              Analyze X-Ray
            </button>
          )}

          {/* Tips */}
          <div className="glass-card p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-300 mb-2">Best Results With</p>
            {[
              'Hip, spine, or wrist radiograph (AP view preferred)',
              'High-resolution images (≥ 300 DPI recommended)',
              'DICOM or lossless formats (TIFF, PNG) for accuracy',
              'Dedicated bone densitometry (DEXA) images',
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1 w-1 h-1 rounded-full bg-cyan-400 flex-shrink-0" />
                <p className="text-[11px] text-slate-500">{t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Results (independently scrollable on xl) ─────── */}
        <div id="xray-results" className="xl:sticky xl:top-4 xl:max-h-[calc(100vh-8rem)] results-scroll space-y-4 pr-0.5">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="glass-card p-6">
                  <LoadingSpinner
                    message={t.xrayLoading}
                    subtext={t.xrayLoadingSub}
                  />
                </div>
              </motion.div>
            )}

            {error && !loading && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="glass-card p-5 border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                  {error}
                </div>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">

                {/* ── Image Analysis Metrics Panel ── */}
                {result.extractedData && Object.keys(result.extractedData).length > 0 && (
                  <div className="glass-card p-4 border border-cyan-500/25 bg-cyan-500/5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="text-cyan-400" />
                        <span className="text-xs font-semibold text-cyan-300">
                          Image Analysis Metrics
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full
                                       bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 font-medium">
                        {Object.keys(result.extractedData).length} features computed
                      </span>
                    </div>

                    {/* 2-column grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(result.extractedData).map(([key, val]) => (
                        <div key={key}
                             className="flex items-start gap-2 p-2 rounded-lg
                                        bg-surface-hover border border-surface-border">
                          <CheckCircle2 size={12} className="text-cyan-400 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 leading-tight">{key}</p>
                            <p className="text-xs font-medium text-slate-200 truncate">{val}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {result.evidenceSource && (
                      <p className="text-[10px] text-slate-500 mt-2 italic leading-snug pl-0.5">
                        {result.evidenceSource}
                      </p>
                    )}
                  </div>
                )}

                <ResultCard result={result} />
              </motion.div>
            )}

            {!loading && !result && !error && (
              <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="glass-card p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface-hover border border-surface-border
                                  flex items-center justify-center mx-auto mb-4">
                    <ImageOff size={24} className="text-slate-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">{t.xrayPlaceholder}</p>
                  <p className="text-xs text-slate-600 mt-1">{t.xrayPlaceholderSub}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
    </div>
  )
}
