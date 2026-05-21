import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Wand2, ImageIcon, UploadCloud, X, Download, RefreshCw,
  Save, Loader2, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { getAiStatus, refineIdea, generateAd } from '../services/aiGenerator'

const TONES = ['Modern & bold', 'Minimal & elegant', 'Playful & colorful', 'Luxury & premium', 'Tech & futuristic']
const SIZES = [
  { v: '1024x1024', label: 'Square (1:1)' },
  { v: '1536x1024', label: 'Landscape (3:2)' },
  { v: '1024x1536', label: 'Portrait (2:3)' },
]

// Read a File → data URL
const fileToDataUrl = (file) => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file)
})

// Compress a data URL to JPEG under ~900 KB so it fits a Firestore document
const compressDataUrl = (dataUrl, maxW = 1280, quality = 0.82) => new Promise((resolve) => {
  const img = new Image()
  img.onload = () => {
    const scale = Math.min(1, maxW / img.width)
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#0a1142'; ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(img, 0, 0, c.width, c.height)
    let q = quality, out = c.toDataURL('image/jpeg', q)
    while (out.length > 900 * 1024 && q > 0.4) { q -= 0.1; out = c.toDataURL('image/jpeg', q) }
    resolve(out)
  }
  img.onerror = () => resolve(dataUrl)
  img.src = dataUrl
})

const AIAdGenerator = () => {
  const toast = useToast()
  const { currentUser } = useAuth()

  const [status, setStatus] = useState(null) // {configured, offline}
  const [idea, setIdea] = useState('')
  const [product, setProduct] = useState('')
  const [tone, setTone] = useState(TONES[0])
  const [size, setSize] = useState(SIZES[0].v)
  const [refImage, setRefImage] = useState(null) // data URL
  const [prompt, setPrompt] = useState('')
  const [headline, setHeadline] = useState('')
  const [caption, setCaption] = useState('')
  const [refining, setRefining] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null) // { image, isUrl }
  const [saving, setSaving] = useState(false)
  const [saveMeta, setSaveMeta] = useState({ title: '', company: '', budget: '' })
  const fileRef = useRef(null)

  useEffect(() => { getAiStatus().then(setStatus) }, [])

  const onPickFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return
    if (!f.type.startsWith('image/')) { toast.error('Please choose an image file'); return }
    const url = await fileToDataUrl(f)
    setRefImage(await compressDataUrl(url, 1024, 0.85))
  }

  const handleRefine = async () => {
    if (!idea.trim()) { toast.error('Describe your ad idea first'); return }
    setRefining(true)
    try {
      const r = await refineIdea({ idea, product, tone })
      setPrompt(r.prompt || idea)
      setHeadline(r.headline || '')
      setCaption(r.caption || '')
      setSaveMeta(m => ({ ...m, title: r.headline || m.title, company: product || m.company }))
      toast.success('Idea refined — review the prompt, then generate')
    } catch (e) {
      toast.error(e.message || 'Refine failed')
    } finally { setRefining(false) }
  }

  const handleGenerate = async () => {
    const finalPrompt = (prompt || idea).trim()
    if (!finalPrompt) { toast.error('Enter an idea or refined prompt first'); return }
    setGenerating(true); setResult(null)
    try {
      const r = await generateAd({ prompt: finalPrompt, size, referenceImage: refImage })
      setResult({ image: r.image, isUrl: !!r.isUrl })
      setSaveMeta(m => ({ ...m, title: m.title || headline || product || 'AI Generated Ad', company: m.company || product }))
      toast.success('Ad generated!')
    } catch (e) {
      toast.error(e.message || 'Generation failed')
    } finally { setGenerating(false) }
  }

  const handleSave = async () => {
    if (!result?.image) return
    if (!saveMeta.title.trim()) { toast.error('Give the ad a title before saving'); return }
    setSaving(true)
    try {
      let media = result.image
      if (!result.isUrl) media = await compressDataUrl(result.image, 1280, 0.82)
      const docData = {
        adId: `AD-${Date.now().toString().slice(-6)}`,
        title: saveMeta.title.trim(),
        company: saveMeta.company.trim(),
        category: 'AI Generated',
        budget: saveMeta.budget || '',
        status: 'Active',
        type: 'Image',
        mediaType: 'Image',
        mediaBase64: result.isUrl ? '' : media,
        mediaUrl: result.isUrl ? media : '',
        preview: media,
        mediaName: 'ai-generated.jpg',
        aiGenerated: true,
        aiPrompt: prompt || idea,
        caption,
        timeSlots: [], weatherTargets: [], targetAreas: [],
        createdBy: currentUser?.displayName || currentUser?.username || 'Admin',
        createdAt: new Date().toISOString(),
      }
      await addDoc(collection(db, 'ads'), docData)
      toast.success('Saved to Ads ✓')
      // reset result so they can make another
      setResult(null)
      setSaveMeta({ title: '', company: '', budget: '' })
    } catch (e) {
      toast.error(e.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const notReady = status && !status.configured

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-violet-700 via-fuchsia-700 to-indigo-700 text-white px-6 py-5 rounded-2xl shadow-xl mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center"><Sparkles className="w-6 h-6" /></div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">AI Ad Generator</h1>
            <p className="text-white/70 text-xs mt-0.5">Describe an idea (optionally add a product photo) → generate a ready-to-run ad → save it.</p>
          </div>
        </div>
        {status && (
          <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-full ${status.configured ? 'bg-emerald-400/20 text-emerald-100' : 'bg-amber-400/20 text-amber-100'}`}>
            {status.configured ? `● Ready · ${status.imageModel}` : status.offline ? '● Backend offline' : '● API key not set'}
          </span>
        )}
      </motion.div>

      {notReady && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">AI generator not configured</p>
            <p className="text-amber-700/80 dark:text-amber-400/80">
              {status.offline
                ? 'Start the backend (python main.py) and ensure VITE_API_URL points to it.'
                : 'Add OPENAI_API_KEY to the backend .env and restart it.'} Image model is set via OPENAI_IMAGE_MODEL (default gpt-image-1).
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Inputs ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Ad idea *</label>
            <textarea value={idea} onChange={e => setIdea(e.target.value)} rows={3}
              placeholder="e.g. A summer deal for a burger restaurant — juicy burger, bold colours, '50% OFF this weekend'"
              className="w-full px-3.5 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Product / brand</label>
              <input value={product} onChange={e => setProduct(e.target.value)} placeholder="e.g. Cheezious"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Tone</label>
              <select value={tone} onChange={e => setTone(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40">
                {TONES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Aspect ratio</label>
            <div className="flex gap-2">
              {SIZES.map(s => (
                <button key={s.v} onClick={() => setSize(s.v)}
                  className={`flex-1 px-2 py-2 text-xs font-semibold rounded-xl border transition-all ${size === s.v ? 'bg-violet-500 text-white border-violet-500' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-violet-400'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference image (optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Reference product image (optional)</label>
            {refImage ? (
              <div className="relative inline-block">
                <img src={refImage} alt="reference" className="h-28 rounded-xl border border-slate-200 dark:border-slate-700 object-cover" />
                <button onClick={() => { setRefImage(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-1.5 py-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:border-violet-400 hover:text-violet-500 transition-colors">
                <UploadCloud className="w-6 h-6" />
                <span className="text-xs">Click to upload a product photo</span>
                <span className="text-[10px] text-slate-400">AI will use it as a reference. Leave empty to generate from text only.</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={handleRefine} disabled={refining || generating || notReady}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 disabled:opacity-50 transition-colors">
              {refining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Refine idea
            </button>
            <button onClick={handleGenerate} disabled={generating || notReady}
              className="flex-[1.4] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:opacity-50 transition-all">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate Ad</>}
            </button>
          </div>

          {/* Refined prompt (editable) */}
          {(prompt || headline) && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Image prompt (editable)</label>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" />
              </div>
              {headline && <p className="text-xs text-slate-500"><b className="text-slate-700 dark:text-slate-300">Headline:</b> {headline}</p>}
              {caption && <p className="text-xs text-slate-500"><b className="text-slate-700 dark:text-slate-300">Caption:</b> {caption}</p>}
            </div>
          )}
        </div>

        {/* ── Result ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col">
          <div className="flex-1 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 min-h-[320px] overflow-hidden">
            <AnimatePresence mode="wait">
              {generating ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Generating your ad… (10–30s)</p>
                </motion.div>
              ) : result?.image ? (
                <motion.img key="img" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  src={result.image} alt="Generated ad" className="max-h-[420px] w-auto object-contain rounded-lg" />
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center px-6">
                  <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Your generated ad will appear here</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {result?.image && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
              <div className="flex gap-2">
                <button onClick={handleGenerate} disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
                <a href={result.image} download="admotion-ad.png"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
              {/* Save panel */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <input value={saveMeta.title} onChange={e => setSaveMeta(m => ({ ...m, title: e.target.value }))} placeholder="Ad title *"
                  className="px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                <input value={saveMeta.company} onChange={e => setSaveMeta(m => ({ ...m, company: e.target.value }))} placeholder="Company / brand"
                  className="px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                <input value={saveMeta.budget} onChange={e => setSaveMeta(m => ({ ...m, budget: e.target.value }))} placeholder="Budget (PKR, optional)" inputMode="numeric"
                  className="px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/25 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save to Ads
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIAdGenerator
