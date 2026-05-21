import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiLock, FiEye, FiEyeOff, FiLogIn, FiArrowRight } from 'react-icons/fi'
import { Car, CreditCard } from 'lucide-react'
import { useDriverAuth } from '../../contexts/DriverAuthContext'

// Format CNIC as #####-#######-#
const formatCNIC = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 13)
  let f = digits
  if (digits.length > 5) f = digits.slice(0, 5) + '-' + digits.slice(5)
  if (digits.length > 12) f = digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12)
  return f
}

const DriverLogin = () => {
  const [formData, setFormData] = useState({ cnic: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [focused, setFocused] = useState(null)
  const { loginDriver } = useDriverAuth()
  const navigate = useNavigate()
  const reduce = useReducedMotion()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === 'cnic' ? formatCNIC(value) : value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await loginDriver(formData.cnic, formData.password)
      setSuccess(true)
      setTimeout(() => navigate('/driver'), 800)
    } catch (err) {
      setError(err?.message || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputBase = 'w-full pl-12 pr-4 py-4 bg-white/[0.06] border border-white/10 rounded-2xl text-white text-base placeholder-white/25 outline-none transition-all focus:bg-white/[0.1] focus:border-amber-400/50 focus-visible:ring-2 focus-visible:ring-amber-400/40'

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[#0a1142] text-white px-4 py-[max(1.25rem,env(safe-area-inset-top))]">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#1a0f4d_0%,#13205f_42%,#0a1142_100%)]" />
      {!reduce && <>
        <motion.div animate={{ x: [0, 40, 0], y: [0, -24, 0], scale: [1, 1.15, 1] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-24 w-[60vw] max-w-[420px] aspect-square bg-amber-500/15 rounded-full blur-[90px]" />
        <motion.div animate={{ x: [0, -30, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -left-24 w-[60vw] max-w-[420px] aspect-square bg-cyan-500/12 rounded-full blur-[90px]" />
      </>}

      {/* Brand */}
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-5 flex items-center gap-2.5 z-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Car className="text-[#0a1142] w-5 h-5" />
        </div>
        <div>
          <p className="font-black text-[16px] leading-none">Ad<span className="text-amber-400">Motion</span></p>
          <p className="text-amber-300/60 text-[9px] tracking-[0.22em] uppercase mt-1">Driver Portal</p>
        </div>
      </div>

      {/* Card */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-[440px] z-10">
        <div aria-hidden className={`absolute -inset-[2px] rounded-[26px] blur-lg transition-colors duration-500 ${success ? 'bg-emerald-500/25' : error ? 'bg-red-500/25' : 'bg-amber-500/15'}`} />
        <div className="relative rounded-[24px] bg-[#0c1238]/85 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="relative h-[3px] overflow-hidden">
            <motion.div animate={reduce ? {} : { x: ['-100%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          </div>

          <div className="p-7 sm:p-9">
            {/* Header */}
            <div className="text-center mb-7">
              <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/25 to-orange-500/25 border border-white/10 items-center justify-center mb-4">
                <Car className="w-7 h-7 text-amber-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Driver <span className="text-amber-400">Sign In</span></h1>
              <p className="text-white/45 text-sm mt-1">Access your dashboard &amp; earnings</p>
            </div>

            {/* Error / success — live region */}
            <div aria-live="assertive">
              <AnimatePresence>
                {error && (
                  <motion.div role="alert" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 16 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="flex items-center gap-3 p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl">
                    <span className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center text-red-300 flex-shrink-0">✕</span>
                    <p className="text-red-200/90 text-sm">{error}</p>
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    className="flex items-center gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300 flex-shrink-0">✓</span>
                    <p className="text-emerald-200/90 text-sm">Welcome back! Launching dashboard…</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="cnic" className="block text-white/55 text-xs font-semibold uppercase tracking-[0.12em] mb-2">CNIC Number</label>
                <div className="relative">
                  <CreditCard aria-hidden className={`absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] ${focused === 'cnic' ? 'text-amber-400' : 'text-white/30'}`} />
                  <input id="cnic" name="cnic" type="text" value={formData.cnic} onChange={handleChange}
                    onFocus={() => setFocused('cnic')} onBlur={() => setFocused(null)}
                    inputMode="numeric" maxLength={15} required autoComplete="username" aria-invalid={!!error}
                    placeholder="35201-1234567-1"
                    className={`${inputBase} font-mono tracking-wider`} />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-white/55 text-xs font-semibold uppercase tracking-[0.12em] mb-2">Password</label>
                <div className="relative">
                  <FiLock aria-hidden className={`absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] ${focused === 'password' ? 'text-amber-400' : 'text-white/30'}`} />
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    required autoComplete="current-password" aria-invalid={!!error}
                    placeholder="Enter your password"
                    className={`${inputBase} pr-14`} />
                  <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-xl text-white/35 hover:text-white/70 focus-visible:ring-2 focus-visible:ring-amber-400/40 outline-none transition-colors">
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <motion.button type="submit" disabled={loading || success}
                whileHover={reduce ? {} : { y: -2 }} whileTap={reduce ? {} : { scale: 0.985 }}
                className="w-full relative overflow-hidden py-4 rounded-2xl font-bold text-base text-[#0a1142] bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 shadow-lg shadow-amber-500/25 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1238] focus-visible:ring-amber-300 outline-none">
                {!reduce && <motion.span aria-hidden animate={{ x: ['-120%', '220%'] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent" />}
                <span className="relative flex items-center justify-center gap-2.5">
                  {loading ? <><span className="w-5 h-5 border-2 border-[#0a1142]/30 border-t-[#0a1142] rounded-full animate-spin" /> Signing in…</>
                    : success ? <><FiArrowRight className="w-5 h-5" /> Launching…</>
                    : <><FiLogIn className="w-5 h-5" /> Sign In</>}
                </span>
              </motion.button>
            </form>

            {/* Footer */}
            <div className="mt-7 pt-5 border-t border-white/10 text-center space-y-2.5">
              <p className="text-white/35 text-xs">Admin? <Link to="/login" className="text-cyan-300/70 hover:text-cyan-200 font-medium transition-colors">Sign in to the Dashboard</Link></p>
              <p className="flex items-center justify-center gap-2 text-white/25 text-[10px] tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Secure connection · AdMotion Driver
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DriverLogin
