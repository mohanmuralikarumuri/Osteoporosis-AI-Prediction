import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, Upload, X, CheckCircle2, ImageOff,
  ZoomIn, ZoomOut, Maximize2, Activity, Cpu, Zap,
} from 'lucide-react'
import { analyzeMriCt } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ResultCard from '../components/ResultCard'
import BoneBackground from '../three/BoneBackground'

const ACCEPTED_MRI = {
  'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.dcm', '.webp'],
}

/* Pulse ring rendered on the scan viewer while processing */
function ScanPulse() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {/* Horizontal sweep */}
      <motion.div
        className="absolute left-0 right-0 h-0.5"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.9), rgba(236,72,153,0.9), transparent)' }}
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }}
      />
      {/* Corner brackets */}
      {[
        'top-2 left-2 border-t-2 border-l-2',
        'top-2 right-2 border-t-2 border-r-2',
        'bottom-2 left-2 border-b-2 border-l-2',
        'bottom-2 right-2 border-b-2 border-r-2',
      ].map((cls, i) => (
        <motion.div
          key={i}
          className={`absolute w-5 h-5 ${cls} border-fuchsia-400/70 rounded-sm`}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.06]"
           style={{
             backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)',
             backgroundSize: '36px 36px',
           }} />
      {/* Centre label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-[#0f0f1a]/90 border border-fuchsia-500/40 rounded-xl
                        px-5 py-3 text-xs text-fuchsia-300 font-medium flex items-center gap-2
                        backdrop-blur shadow-lg">
          <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
          AI analysing cross-sectional scan…
        </div>
      </div>
    </div>
  )
}

/* Confidence booster badge */
function MprBadge() {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                    bg-fuchsia-500/10 border border-fuchsia-500/25 text-fuchsia-300 text-[10px] font-semibold">
      <Cpu size={10} />
      MPR Volumetric Boost Active
    </div>
  )
}

export default function MriCtPredictor() {
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [scanning, setScanning] = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState(null)
  const [zoom, setZoom]         = useState(1)
  const [modality, setModality] = useState('MRI')   // 'MRI' | 'CT'

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
    accept: ACCEPTED_MRI,
    multiple: false,
    maxSize: 50 * 1024 * 1024,
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
      const data = await analyzeMriCt(file)
      setResult(data)
    } catch {
      setError('MRI/CT analysis failed. Please ensure the file is a valid bone scan image.')
    } finally {
      setLoading(false)
      setScanning(false)
    }
    setTimeout(() => document.getElementById('mri-results')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <div className="relative min-h-full">
      {/* 3-D bone background – fuchsia/rose theme */}
      <BoneBackground
        accentColor="#a855f7"
        secondColor="#ec4899"
        gradientFrom="rgba(14,5,28,0.96)"
        gradientTo="rgba(24,5,20,0.96)"
        boneCount={14}
      />

      <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto fade-in-up">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="section-badge-3d"
               style={{ width:'3rem', height:'3rem', borderRadius:'0.9rem',
                        background:'linear-gradient(135deg,rgba(168,85,247,0.25),rgba(236,72,153,0.18))',
                        border:'1px solid rgba(168,85,247,0.40)',
                        boxShadow:'0 0 28px rgba(168,85,247,0.40), 0 4px 0 rgba(80,20,100,0.7)' }}>
            <Layers size={20} className="text-fuchsia-300" />
          </div>
          <div>
            <h1 className="section-title">MRI / CT Predictor</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cross-sectional bone scan AI — volumetric MPR confidence boost
            </p>
          </div>
          <MprBadge />
        </div>

        {/* ── Modality toggle ──────────────────────────────────────── */}
        <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit
                        bg-white/[0.04] border border-white/[0.07]">
          {['MRI', 'CT'].map((m) => (
            <button
              key={m}
              onClick={() => setModality(m)}
              className={`px-5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                ${modality === m
                  ? 'bg-fuchsia-600/30 border border-fuchsia-500/50 text-fuchsia-200 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                  : 'text-slate-500 hover:text-slate-300'}`}
            >
              {m} Scan
            </button>
          ))}
        </div>

        {/* ── Two-column layout ────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ── Left: scan viewer ───────────────────────────────── */}
          <div className="space-y-4">

            {/* Drop zone / viewer */}
            <div
              {...(preview ? {} : getRootProps())}
              className={`
                glass-card border-2 border-dashed overflow-hidden transition-all duration-200
                ${!preview
                  ? isDragActive
                    ? 'border-fuchsia-500/60 bg-fuchsia-500/10 cursor-pointer shadow-[0_0_30px_rgba(168,85,247,0.22)]'
                    : 'border-surface-border hover:border-fuchsia-500/40 hover:bg-surface-hover cursor-pointer'
                  : 'border-fuchsia-500/20 cursor-default'
                }
              `}
            >
              {!preview ? (
                <>
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
                    <motion.div
                      animate={{ y: isDragActive ? -6 : 0 }}
                      className="relative"
                    >
                      {/* Layered square icon simulating MRI slices */}
                      <div className="w-20 h-20 rounded-2xl bg-fuchsia-600/10 border border-fuchsia-500/20
                                      flex items-center justify-center relative">
                        {[3, 6, 9].map((offset, i) => (
                          <div key={i}
                               className="absolute rounded-lg border border-fuchsia-500/15"
                               style={{ inset: `${-offset}px`, opacity: 0.4 - i * 0.1 }} />
                        ))}
                        <Layers size={34} className="text-fuchsia-500/60 relative z-10" />
                      </div>
                    </motion.div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {isDragActive
                          ? 'Drop your scan here'
                          : `Upload ${modality} Scan Image`}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        PNG, JPG, TIFF, BMP, DICOM, WebP — max 50 MB
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs text-fuchsia-400 bg-fuchsia-600/10 border border-fuchsia-500/20
                                       px-3 py-1 rounded-full">
                        Browse or drag & drop
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Zap size={10} className="text-amber-400" />
                        <span className="text-[10px] text-slate-600">
                          Higher certainty vs. X-ray — volumetric MPR boost applied
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ── Scan image viewer ──────────────────────────────── */
                <div className="relative bg-black rounded-2xl overflow-hidden" style={{ minHeight: 300 }}>
                  {/* Toolbar */}
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
                    <button onClick={() => setZoom(1)}
                            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white">
                      <Maximize2 size={13} />
                    </button>
                    <button onClick={handleRemove}
                            className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 ml-1">
                      <X size={13} />
                    </button>
                  </div>

                  {/* Modality badge */}
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5
                                  bg-fuchsia-900/70 border border-fuchsia-500/40 rounded-lg px-2 py-1
                                  backdrop-blur text-[10px] text-fuchsia-300 font-semibold">
                    <Layers size={10} />
                    {modality} Scan
                  </div>

                  {/* Image */}
                  <div className="overflow-auto" style={{ maxHeight: 420 }}>
                    <img
                      src={preview}
                      alt={`${modality} scan preview`}
                      style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.2s ease',
                        filter: modality === 'MRI'
                          ? 'brightness(1.05) contrast(1.15) saturate(0.85)'
                          : 'brightness(1.0) contrast(1.25) saturate(0.6)',
                      }}
                      className="w-full object-contain block"
                      draggable={false}
                    />
                  </div>

                  {/* Animated scan overlay */}
                  {scanning && <ScanPulse />}

                  {/* File chip */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2
                                  bg-black/70 backdrop-blur rounded-lg px-2 py-1.5 border border-white/10">
                    <CheckCircle2 size={11} className="text-emerald-400" />
                    <span className="text-[10px] text-slate-400 truncate max-w-[160px]">{file?.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons when file selected */}
            {preview && !scanning && (
              <div className="flex gap-3">
                <div {...getRootProps()} className="flex-shrink-0">
                  <input {...getInputProps()} />
                  <button type="button"
                          className="btn-secondary flex items-center gap-2 text-sm h-full">
                    <Upload size={14} />
                    Replace
                  </button>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={!file || loading}
                  className="flex-1 btn-3d-primary"
                  style={{
                    background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 50%, #ec4899 100%)',
                    boxShadow: '0 4px 0 rgba(80,20,100,0.8), 0 8px 24px rgba(168,85,247,0.40)',
                  }}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                      Analysing {modality} scan…
                    </>
                  ) : (
                    <>
                      <Layers size={16} />
                      Analyse {modality} Scan
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Upload CTA when empty */}
            {!preview && (
              <button disabled
                      className="btn-3d-primary w-full opacity-40 cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #7e22ce, #a855f7, #ec4899)' }}>
                <Layers size={16} />
                Analyse {modality} Scan
              </button>
            )}

            {/* Tips */}
            <div className="card-3d-wrap">
              <div className="card-3d p-4 space-y-2"
                   style={{ border:'1px solid rgba(168,85,247,0.18)',
                            boxShadow:'0 2px 0 rgba(168,85,247,0.22), 0 8px 24px rgba(0,0,0,0.45)' }}>
                <p className="text-xs font-semibold text-fuchsia-300 mb-3 flex items-center gap-1.5">
                  <Zap size={11} />Why MRI / CT Gives Higher Certainty
                </p>
                {[
                  ['Volumetric MPR', '3-axis multi-planar reconstruction eliminates projection ambiguity'],
                  ['Marrow Signal', 'Fat-water ratio in bone marrow correlates directly with mineral density'],
                  ['Cortical Width', 'Direct cortical thickness measurement in mm — more precise than X-ray'],
                  ['No Overlap', 'Cross-sections remove superimposition artefacts common in plain films'],
                ].map(([title, desc]) => (
                  <div key={title} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-fuchsia-400 flex-shrink-0" />
                    <p className="text-[11px] text-slate-500">
                      <span className="text-slate-300 font-medium">{title}: </span>{desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Results ───────────────────────────────────── */}
          <div id="mri-results"
               className="xl:sticky xl:top-4 xl:max-h-[calc(100vh-8rem)] results-scroll space-y-4 pr-0.5">
            <AnimatePresence mode="wait">

              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="glass-card p-6">
                    <LoadingSpinner
                      message={`Processing ${modality} scan…`}
                      subtext="Running MPR volumetric analysis + EfficientNet-B3 inference"
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

                  {/* MRI/CT analysis metrics panel */}
                  {result.extractedData && Object.keys(result.extractedData).length > 0 && (
                    <div className="glass-card p-4 border border-fuchsia-500/25 bg-fuchsia-500/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Activity size={14} className="text-fuchsia-400" />
                          <span className="text-xs font-semibold text-fuchsia-300">
                            {modality} Volumetric Analysis
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full
                                         bg-fuchsia-600/20 border border-fuchsia-500/30 text-fuchsia-300 font-medium">
                          {Object.keys(result.extractedData).length} metrics
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(result.extractedData).map(([key, val]) => (
                          <div key={key}
                               className="flex items-start gap-2 p-2 rounded-lg
                                          bg-surface-hover border border-surface-border">
                            <CheckCircle2 size={12} className="text-fuchsia-400 mt-0.5 shrink-0" />
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
                                    flex items-center justify-center mx-auto mb-4 relative">
                      {[3, 6].map((o, i) => (
                        <div key={i}
                             className="absolute rounded-lg border border-fuchsia-500/10"
                             style={{ inset: `${-o}px` }} />
                      ))}
                      <ImageOff size={24} className="text-slate-600 relative z-10" />
                    </div>
                    <p className="text-sm font-medium text-slate-400">
                      Awaiting {modality} scan
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Upload a bone {modality} image and click Analyse
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-1.5
                                    text-[10px] text-fuchsia-500/70">
                      <Cpu size={10} />
                      MPR volumetric boost will be applied automatically
                    </div>
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
