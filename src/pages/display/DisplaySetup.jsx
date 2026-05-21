import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Monitor, CheckCircle, AlertCircle, ChevronRight, CreditCard, Lock, Eye, EyeOff } from 'lucide-react'
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { comparePassword } from '../../utils/password'

// Swap manifest so "Add to Home Screen" opens /display/setup
const useDisplayManifest = () => {
  useEffect(() => {
    const existing = document.querySelector('link[rel="manifest"]')
    if (existing) existing.remove()
    const link = document.createElement('link')
    link.rel = 'manifest'
    link.href = '/manifest-display.json'
    document.head.appendChild(link)
    document.title = 'AdMotion Display'
    return () => { link.remove() }
  }, [])
}

// Format CNIC as #####-#######-#
const formatCNIC = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 13)
  let f = digits
  if (digits.length > 5) f = digits.slice(0, 5) + '-' + digits.slice(5)
  if (digits.length > 12) f = digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12)
  return f
}

const DisplaySetup = () => {
  useDisplayManifest()
  const [cnic, setCnic] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [focused, setFocused] = useState(null)
  const navigate = useNavigate()
  const reduce = useReducedMotion()

  // Already set up? go straight to the player
  useEffect(() => {
    const saved = localStorage.getItem('display_vehicle_id')
    if (saved) navigate('/display/play', { replace: true })
  }, [navigate])

  const handleSetup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (!cnic.trim()) throw new Error('Please enter your CNIC')
      if (!password) throw new Error('Please enter the password')

      const normalizedCnic = cnic.replace(/\D/g, '')
      const vehiclesRef = collection(db, 'vehicles')
      let snapshot = await getDocs(query(vehiclesRef, where('cnic', '==', cnic)))
      if (snapshot.empty) snapshot = await getDocs(query(vehiclesRef, where('cnic', '==', normalizedCnic)))
      if (snapshot.empty && normalizedCnic.length === 13) {
        const formatted = `${normalizedCnic.slice(0, 5)}-${normalizedCnic.slice(5, 12)}-${normalizedCnic.slice(12)}`
        snapshot = await getDocs(query(vehiclesRef, where('cnic', '==', formatted)))
      }
      if (snapshot.empty) throw new Error('No vehicle found with this CNIC')

      const vehicleDoc = snapshot.docs[0]
      const vehicleData = vehicleDoc.data()

      let passwordMatch = false
      if (vehicleData.password) {
        if (vehicleData.password.startsWith('$2')) {
          passwordMatch = await comparePassword(password, vehicleData.password)
        } else {
          passwordMatch = vehicleData.password === password
          if (passwordMatch) {
            try {
              const { hashPassword } = await import('../../utils/password')
              const hashed = await hashPassword(password)
              await updateDoc(doc(db, 'vehicles', vehicleDoc.id), { password: hashed })
            } catch (e) { /* silent */ }
          }
        }
      }
      if (!passwordMatch) throw new Error('Invalid CNIC or password')

      localStorage.setItem('display_vehicle_id', vehicleDoc.id)
      localStorage.setItem('display_vehicle_carId', vehicleData.carId || '')
      localStorage.setItem('display_vehicle_name', vehicleData.vehicleName || '')

      await updateDoc(doc(db, 'vehicles', vehicleDoc.id), {
        displayDevice: {
          deviceId: `display_${Date.now()}`,
          registeredAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
        },
        status: 'Active',
        lastSeen: serverTimestamp(),
      })

      setSuccess(true)
      setTimeout(() => navigate('/display/play'), 1500)
    } catch (err) {
      setError(err?.message || 'Setup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Larger sizing — this also runs on Android-TV boxes viewed from a distance
  const inputBase = 'w-full pl-14 pr-4 py-4 bg-white/[0.06] border border-white/10 rounded-2xl text-white text-lg placeholder-white/25 outline-none transition-all focus:bg-white/[0.1] focus:border-cyan-400/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50'

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[#0a1142] text-white px-4 py-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#13205f_0%,#0a1142_70%)]" />
      {!reduce && (
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.12, 0.06] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute w-[70vw] max-w-[600px] aspect-square bg-cyan-500 rounded-full blur-[160px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      )}
      <div aria-hidden className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />

      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-xl z-10">
        <div aria-hidden className={`absolute -inset-2 rounded-[28px] blur-2xl transition-colors duration-500 ${success ? 'bg-emerald-500/20' : error ? 'bg-red-500/15' : 'bg-cyan-500/15'}`} />
        <div className="relative rounded-[26px] bg-[#0b1233]/90 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="relative h-[3px] overflow-hidden">
            <motion.div animate={reduce ? {} : { x: ['-100%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          </div>

          <div className="p-8 sm:p-11">
            {/* Icon + title */}
            <div className="text-center mb-8">
              <motion.div animate={reduce ? {} : { y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/25 to-blue-600/25 border border-cyan-400/30 items-center justify-center mb-5">
                <Monitor className="w-10 h-10 text-cyan-300" />
              </motion.div>
              <h1 className="text-3xl font-black tracking-tight">Vehicle <span className="text-cyan-300">Display</span></h1>
              <p className="text-white/45 text-base mt-2">Sign in with your vehicle credentials to start ad playback</p>
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] text-white/45 uppercase tracking-[0.15em] font-medium">Kiosk Mode</span>
              </div>
            </div>

            {/* Error / success — live region */}
            <div aria-live="assertive">
              <AnimatePresence>
                {error && (
                  <motion.div role="alert" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 20 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl">
                    <AlertCircle className="w-6 h-6 text-red-300 flex-shrink-0" />
                    <p className="text-red-200/90 text-base">{error}</p>
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                    className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl">
                    <CheckCircle className="w-7 h-7 text-emerald-300 flex-shrink-0" />
                    <div><p className="text-emerald-200 font-semibold">Authenticated!</p><p className="text-emerald-300/60 text-sm mt-0.5">Launching ad player…</p></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Form */}
            <form onSubmit={handleSetup} noValidate className="space-y-5">
              <div>
                <label htmlFor="d-cnic" className="block text-white/55 text-sm font-semibold uppercase tracking-[0.12em] mb-2">CNIC Number</label>
                <div className="relative">
                  <CreditCard aria-hidden className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${focused === 'cnic' ? 'text-cyan-300' : 'text-white/30'}`} />
                  <input id="d-cnic" type="text" value={cnic} onChange={(e) => { setCnic(formatCNIC(e.target.value)); if (error) setError('') }}
                    onFocus={() => setFocused('cnic')} onBlur={() => setFocused(null)}
                    inputMode="numeric" maxLength={15} required disabled={success} autoComplete="username" aria-invalid={!!error}
                    placeholder="35201-1234567-1" className={`${inputBase} font-mono tracking-wider`} />
                </div>
              </div>

              <div>
                <label htmlFor="d-pass" className="block text-white/55 text-sm font-semibold uppercase tracking-[0.12em] mb-2">Password</label>
                <div className="relative">
                  <Lock aria-hidden className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${focused === 'password' ? 'text-cyan-300' : 'text-white/30'}`} />
                  <input id="d-pass" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); if (error) setError('') }}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    required disabled={success} autoComplete="current-password" aria-invalid={!!error}
                    placeholder="Vehicle password" className={`${inputBase} pr-16`} />
                  <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-xl text-white/35 hover:text-white/70 focus-visible:ring-2 focus-visible:ring-cyan-400/50 outline-none transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <motion.button type="submit" disabled={loading || success}
                whileHover={reduce ? {} : { y: -2 }} whileTap={reduce ? {} : { scale: 0.985 }}
                className="w-full relative overflow-hidden py-5 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 shadow-lg shadow-cyan-500/25 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1233] focus-visible:ring-cyan-300 outline-none">
                {!reduce && <motion.span aria-hidden animate={{ x: ['-120%', '220%'] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent" />}
                <span className="relative flex items-center justify-center gap-2.5">
                  {loading ? <><span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authenticating…</>
                    : success ? <><CheckCircle className="w-6 h-6" /> Launching player…</>
                    : <><Monitor className="w-6 h-6" /> Start Display <ChevronRight className="w-5 h-5 opacity-70" /></>}
                </span>
              </motion.button>
            </form>

            <div className="mt-8 pt-5 border-t border-white/10 text-center space-y-2">
              <p className="text-white/35 text-sm">Use the same CNIC &amp; password from vehicle registration.</p>
              <p className="flex items-center justify-center gap-2 text-white/25 text-[11px] tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Encrypted · AdMotion Display v1.0
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DisplaySetup
