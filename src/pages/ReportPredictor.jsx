import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Upload, X, Search, CheckCircle2, ImageOff, FlaskConical } from 'lucide-react'
import { analyzeReport } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ResultCard from '../components/ResultCard'
import { useLang } from '../context/LanguageContext'

const ACCEPTED = {
  'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.webp'],
  'application/pdf': ['.pdf'],
}

export default function ReportPredictor() {
  const { t } = useLang()
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)
  const [isPDF, setIsPDF]       = useState(false)
  const [loading, setLoading]   = useState(false)
  const [scanning, setScanning] = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState(null)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError(null)
    if (f.type === 'application/pdf') {
      setIsPDF(true)
      setPreview(null)
    } else {
      setIsPDF(false)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(f)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    multiple: false,
    maxSize: 20 * 1024 * 1024, // 20 MB
  })

  const handleRemove = (e) => {
    e.stopPropagation()
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setIsPDF(false)
  }

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setScanning(true)
    setResult(null)
    setError(null)
    try {
      const data = await analyzeReport(file)
      setResult(data)
    } catch {
      setError('Analysis failed. Please try again with a valid medical report.')
    } finally {
      setLoading(false)
      setScanning(false)
    }
    setTimeout(() => document.getElementById('report-results')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <div className="min-h-full p-4 md:p-8 max-w-5xl mx-auto fade-in-up">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30
                        flex items-center justify-center">
          <FileText size={20} className="text-violet-400" />
        </div>
        <div>
          <h1 className="section-title">{t.reportTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t.reportSub}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ─── Upload panel ──────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`
              glass-card border-2 border-dashed cursor-pointer
              transition-all duration-200 overflow-hidden
              ${isDragActive
                ? 'border-violet-500/60 bg-violet-500/10 shadow-[0_0_30px_rgba(139,92,246,0.2)]'
                : file
                  ? 'border-violet-500/30 bg-violet-500/5'
                  : 'border-surface-border hover:border-violet-500/40 hover:bg-surface-hover'}
            `}
          >
            <input {...getInputProps()} />

            {!file ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
                <motion.div
                  animate={{ y: isDragActive ? -6 : 0 }}
                  className="w-14 h-14 rounded-2xl bg-violet-600/15 border border-violet-500/30
                             flex items-center justify-center"
                >
                  <Upload size={22} className="text-violet-400" />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {isDragActive ? t.reportDropActive : t.reportDrop}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.reportFormats}
                  </p>
                </div>
                <span className="text-xs text-violet-400 bg-violet-600/15 border border-violet-500/30
                                 px-3 py-1 rounded-full">
                  {t.reportBrowse}
                </span>
              </div>
            ) : (
              <div className="p-4">
                {/* Image preview */}
                {preview && !isPDF && (
                  <div className="relative rounded-xl overflow-hidden bg-black mb-3">
                    <img
                      src={preview}
                      alt="Medical report preview"
                      className="w-full max-h-64 object-contain"
                    />

                    {/* Scan line overlay */}
                    {scanning && (
                      <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-violet-500/5" />
                        <div className="scan-line" style={{ background: 'linear-gradient(90deg, transparent, #8b5cf6, #a78bfa, #8b5cf6, transparent)' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-surface-card/90 border border-violet-500/30 rounded-xl
                                          px-4 py-2 text-xs text-violet-300 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                            Analyzing report…
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PDF indicator */}
                {isPDF && (
                  <div className="flex items-center gap-3 bg-surface-hover rounded-xl p-3 mb-3">
                    <FileText size={20} className="text-violet-400" />
                    <div>
                      <p className="text-sm text-slate-200 font-medium">{file.name}</p>
                      <p className="text-[11px] text-slate-500">PDF Document · {(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                )}

                {/* File info bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-xs text-slate-400 truncate max-w-[180px]">{file.name}</span>
                    <span className="text-[10px] text-slate-600">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    onClick={handleRemove}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="btn-primary w-full flex items-center justify-center gap-2
                       bg-violet-600 hover:bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.3)]
                       hover:shadow-[0_0_24px_rgba(139,92,246,0.4)]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                {t.reportAnalyzing}
              </>
            ) : (
              <>
                <Search size={16} />
                {t.reportAnalyze}
              </>
            )}
          </button>

          {/* Guidance cards */}
          <div className="glass-card p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-300 mb-3">Supported Report Types</p>
            {[
              'DEXA scan results with T-score and BMD measurements',
              'Radiology reports mentioning bone density',
              'Laboratory reports with calcium / Vitamin D values',
              'Clinical letters summarizing fracture risk assessment',
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1 w-1 h-1 rounded-full bg-violet-400 flex-shrink-0" />
                <p className="text-[11px] text-slate-500">{t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Results ───────────────────────────────────────────────── */}
        <div id="report-results" className="space-y-4">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="glass-card p-6">
                  <LoadingSpinner
                    message={t.reportLoading}
                    subtext={t.reportLoadingSub}
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

                {/* ── Clinical Data Extraction Panel ── */}
                {(result.extractedData || result.evidenceSource) && (
                  <div className="glass-card p-4 border border-violet-500/25 bg-violet-500/5">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FlaskConical size={14} className="text-violet-400" />
                        <span className="text-xs font-semibold text-violet-300">
                          Clinical Data Extracted from Report
                        </span>
                      </div>
                      {result.extractedData && Object.keys(result.extractedData).length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full
                                         bg-violet-600/20 border border-violet-500/30 text-violet-300 font-medium">
                          {Object.keys(result.extractedData).length} fields found
                        </span>
                      )}
                    </div>

                    {result.extractedData && Object.keys(result.extractedData).length > 0 ? (
                      <>
                        {/* 2-column grid of extracted clinical fields */}
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(result.extractedData).map(([field, value]) => (
                            <div key={field}
                                 className="flex items-start gap-2 p-2 rounded-lg
                                            bg-surface-hover border border-surface-border">
                              <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 leading-tight">{field}</p>
                                <p className="text-xs font-medium text-slate-200 truncate">{value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {result.evidenceSource && (
                          <p className="text-[10px] text-slate-500 mt-2 italic leading-snug pl-0.5">
                            {result.evidenceSource}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 italic">{result.evidenceSource}</p>
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
                  <p className="text-sm font-medium text-slate-400">{t.reportPlaceholder}</p>
                  <p className="text-xs text-slate-600 mt-1">{t.reportPlaceholderSub}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
