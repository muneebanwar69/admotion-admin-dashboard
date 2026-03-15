import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Wifi, CheckCircle, AlertCircle, ChevronRight, CreditCard, Lock, Eye, EyeOff } from 'lucide-react'
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { comparePassword } from '../../utils/password'

// Format CNIC as #####-#######-#
const formatCNIC = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 13)
  let formatted = digits
  if (digits.length > 5) formatted = digits.slice(0, 5) + '-' + digits.slice(5)
  if (digits.length > 12) formatted = digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12)
  return formatted
}

const DisplaySetup = () => {
  const [cnic, setCnic] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [focused, setFocused] = useState(null)
  const navigate = useNavigate()

  // Check if already setup
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

      // Search vehicles by CNIC (same as driver login)
      const vehiclesRef = collection(db, 'vehicles')
      let snapshot = await getDocs(query(vehiclesRef, where('cnic', '==', cnic)))

      if (snapshot.empty) {
        snapshot = await getDocs(query(vehiclesRef, where('cnic', '==', normalizedCnic)))
      }
      if (snapshot.empty && normalizedCnic.length === 13) {
        const formatted = `${normalizedCnic.slice(0, 5)}-${normalizedCnic.slice(5, 12)}-${normalizedCnic.slice(12)}`
        snapshot = await getDocs(query(vehiclesRef, where('cnic', '==', formatted)))
      }

      if (snapshot.empty) {
        throw new Error('No vehicle found with this CNIC')
      }

      const vehicleDoc = snapshot.docs[0]
      const vehicleData = vehicleDoc.data()

      // Verify password
      let passwordMatch = false
      if (vehicleData.password) {
        if (vehicleData.password.startsWith('$2')) {
          passwordMatch = await comparePassword(password, vehicleData.password)
        } else {
          passwordMatch = vehicleData.password === password
          // Auto-migrate to bcrypt
          if (passwordMatch) {
            try {
              const { hashPassword } = await import('../../utils/password')
              const hashed = await hashPassword(password)
              await updateDoc(doc(db, 'vehicles', vehicleDoc.id), { password: hashed })
            } catch (e) { /* silent */ }
          }
        }
      }

      if (!passwordMatch) {
        throw new Error('Invalid CNIC or password')
      }

      // Save device registration
      localStorage.setItem('display_vehicle_id', vehicleDoc.id)
      localStorage.setItem('display_vehicle_carId', vehicleData.carId || '')
      localStorage.setItem('display_vehicle_name', vehicleData.vehicleName || '')

      // Update vehicle with display device info
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
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0B1452_0%,#030712_70%)]" />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute w-[600px] h-[600px] bg-cyan-500 rounded-full blur-[200px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      />

      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Scan line */}
      <motion.div
        animate={{ y: ['0%', '100%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent z-[3] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg"
      >
        {/* Glow */}
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
          className={`absolute -inset-2 rounded-3xl blur-2xl transition-colors duration-700 ${
            success ? 'bg-emerald-500/15' : error ? 'bg-red-500/10' : 'bg-cyan-500/10'
          }`}
        />

        <div className={`relative rounded-3xl border backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-700 ${
          success ? 'bg-[#0a1a10]/90 border-emerald-500/20' : error ? 'bg-[#1a0a0a]/90 border-red-500/15' : 'bg-[#0a0f1f]/90 border-white/[0.06]'
        }`}>
          {/* Top accent */}
          <div className="relative h-[2px] overflow-hidden">
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className={`absolute inset-0 w-[200%] ${
                success ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent'
                : 'bg-gradient-to-r from-transparent via-cyan-500 to-transparent'
              }`}
            />
          </div>

          <div className="p-8 sm:p-10">
            {/* Icon */}
            <div className="flex justify-center mb-7">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-3 rounded-2xl border border-dashed border-cyan-500/15" />
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/20 relative">
                  <Monitor className="w-10 h-10 text-cyan-400" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full"
                />
              </motion.div>
            </div>

            {/* Title */}
            <div className="text-center mb-7">
              <h1 className="text-2xl font-bold text-white mb-2">
                Vehicle <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">Display</span>
              </h1>
              <p className="text-white/35 text-sm">Sign in with vehicle credentials to start ad playback</p>
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-cyan-500" />
              </span>
              <span className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-medium">Kiosk Mode</span>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-5"
                >
                  <motion.div animate={{ x: [0, -3, 3, -3, 0] }} transition={{ duration: 0.4 }}
                    className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-5"
                >
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 0.6 }}>
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                    <div>
                      <p className="text-emerald-300 font-semibold">Authenticated!</p>
                      <p className="text-emerald-400/60 text-xs mt-0.5">Launching ad player...</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSetup}>
              <div className="space-y-4">
                {/* CNIC */}
                <div>
                  <label className="block text-white/40 text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 pl-1">
                    CNIC Number
                  </label>
                  <div className={`relative rounded-xl transition-all duration-300 ${focused === 'cnic' ? 'ring-2 ring-cyan-500/25' : ''}`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-300 ${focused === 'cnic' ? 'bg-gradient-to-b from-cyan-400 to-blue-500' : 'bg-transparent'}`} />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CreditCard className={`h-[18px] w-[18px] transition-colors duration-300 ${focused === 'cnic' ? 'text-cyan-400' : 'text-white/20'}`} />
                    </div>
                    <input
                      type="text"
                      value={cnic}
                      onChange={(e) => { setCnic(formatCNIC(e.target.value)); setError('') }}
                      onFocus={() => setFocused('cnic')}
                      onBlur={() => setFocused(null)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white text-[15px] placeholder-white/20 focus:outline-none focus:bg-white/[0.09] focus:border-white/[0.12] transition-all duration-300 tracking-wider font-mono"
                      placeholder="35201-1234567-1"
                      required
                      maxLength={15}
                      inputMode="numeric"
                      disabled={success}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-white/40 text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 pl-1">
                    Password
                  </label>
                  <div className={`relative rounded-xl transition-all duration-300 ${focused === 'password' ? 'ring-2 ring-cyan-500/25' : ''}`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-300 ${focused === 'password' ? 'bg-gradient-to-b from-cyan-400 to-blue-500' : 'bg-transparent'}`} />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className={`h-[18px] w-[18px] transition-colors duration-300 ${focused === 'password' ? 'text-cyan-400' : 'text-white/20'}`} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError('') }}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      className="w-full pl-12 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white text-[15px] placeholder-white/20 focus:outline-none focus:bg-white/[0.09] focus:border-white/[0.12] transition-all duration-300"
                      placeholder="Vehicle password"
                      required
                      disabled={success}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/20 hover:text-white/50 transition-colors">
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ y: -2, boxShadow: '0 20px 40px -12px rgba(6,182,212,0.3)' }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || success}
                className={`w-full mt-6 relative overflow-hidden py-4 rounded-xl font-semibold text-[15px] text-white transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed group ${
                  success
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 shadow-lg shadow-cyan-500/15 hover:shadow-cyan-500/30'
                }`}
              >
                <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  {loading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                      Authenticating...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Launching Player...
                    </>
                  ) : (
                    <>
                      <Monitor className="w-5 h-5" />
                      Start Display
                      <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </>
                  )}
                </span>
              </motion.button>
            </form>

            {/* Footer info */}
            <div className="mt-7 pt-5 border-t border-white/[0.05]">
              <div className="text-center space-y-2">
                <p className="text-white/15 text-[10px]">
                  Use the same CNIC & password from vehicle registration
                </p>
                <div className="flex items-center justify-center gap-2.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-cyan-400 opacity-60" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-cyan-500" />
                  </span>
                  <span className="text-white/15 text-[10px] tracking-wider">Encrypted</span>
                  <span className="text-white/8">&#8226;</span>
                  <span className="text-white/10 text-[10px]">AdMotion Display v1.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DisplaySetup
