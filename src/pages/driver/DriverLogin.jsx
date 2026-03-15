import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiLock, FiEye, FiEyeOff, FiLogIn, FiArrowRight } from 'react-icons/fi'
import { Car, CreditCard } from 'lucide-react'
import { useDriverAuth } from '../../contexts/DriverAuthContext'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
}
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }

// Format CNIC as #####-#######-#
const formatCNIC = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 13)
  let formatted = digits
  if (digits.length > 5) {
    formatted = digits.slice(0, 5) + '-' + digits.slice(5)
  }
  if (digits.length > 12) {
    formatted = digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12)
  }
  return formatted
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cnic' ? formatCNIC(value) : value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await loginDriver(formData.cnic, formData.password)
      setSuccess(true)
      setTimeout(() => navigate('/driver'), 800)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden select-none bg-[#030712]">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#1e1b4b_0%,#030712_50%,#030712_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,#0c1445_0%,transparent_50%)]" />

      {/* Animated orbs */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-amber-500/[0.06] rounded-full blur-[100px]"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-blue-600/[0.05] rounded-full blur-[100px]"
      />

      {/* Scan line */}
      <motion.div
        animate={{ y: ['0%', '100%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent z-[3] pointer-events-none"
      />

      {/* Branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="absolute top-5 left-5 z-10"
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ boxShadow: ['0 0 10px rgba(251,191,36,0.2)', '0 0 20px rgba(251,191,36,0.35)', '0 0 10px rgba(251,191,36,0.2)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg"
          >
            <Car className="text-white w-5 h-5" />
          </motion.div>
          <div>
            <h2 className="text-white font-bold text-base leading-none tracking-tight">AdMotion</h2>
            <p className="text-amber-400/40 text-[9px] tracking-[0.2em] uppercase mt-0.5">Driver Portal</p>
          </div>
        </div>
      </motion.div>

      {/* Login Form */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="w-full max-w-[420px]">
          {/* Glow */}
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className={`absolute -inset-1 rounded-[28px] blur-xl transition-colors duration-700 ${
              success ? 'bg-emerald-500/20' : error ? 'bg-red-500/15' : 'bg-amber-500/10'
            }`}
          />

          {/* Card */}
          <motion.div
            variants={fadeUp}
            className={`relative rounded-[24px] border backdrop-blur-xl shadow-2xl transition-all duration-700 ${
              success ? 'bg-[#0a1a10]/80 border-emerald-500/20' : error ? 'bg-[#1a0a0a]/80 border-red-500/15' : 'bg-[#0f1629]/80 border-white/[0.08]'
            }`}
          >
            {/* Animated accent line */}
            <div className="relative h-[2px] rounded-t-[24px] overflow-hidden">
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className={`absolute inset-0 w-[200%] ${
                  success ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-amber-500 to-transparent'
                }`}
              />
            </div>

            <div className="p-7 sm:p-9">
              {/* Status */}
              <motion.div variants={fadeUp} className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  <span className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-medium">Driver Portal</span>
                </div>
                <div className="flex gap-[3px]">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} animate={{ height: [3, 10, 3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      className="w-[2px] bg-amber-500/40 rounded-full" />
                  ))}
                </div>
              </motion.div>

              {/* Header */}
              <motion.div variants={fadeUp} className="text-center mb-7">
                <div className="relative inline-flex items-center justify-center mb-4">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute w-20 h-20 rounded-full border border-dashed border-amber-500/15" />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                    className="absolute w-16 h-16 rounded-full border border-blue-500/20" />
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-lg border border-white/[0.06]">
                    <Car className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <h1 className="text-[24px] font-bold text-white tracking-tight mb-1">
                  Driver <span className="bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">Sign In</span>
                </h1>
                <p className="text-white/35 text-sm">Access your dashboard & earnings</p>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} className="mb-4">
                    <motion.div animate={{ x: [0, -3, 3, -3, 0] }} transition={{ duration: 0.4 }}
                      className="flex items-center gap-3 p-3 bg-red-500/8 border border-red-500/15 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-red-400 text-xs">&#10005;</span>
                      </div>
                      <p className="text-red-300/90 text-sm">{error}</p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success */}
              <AnimatePresence>
                {success && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-4">
                    <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-400 text-xs">&#10003;</span>
                      </div>
                      <p className="text-emerald-300/90 text-sm">Welcome back! Launching dashboard...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <motion.div variants={stagger} className="space-y-4">
                  {/* CNIC */}
                  <motion.div variants={fadeUp}>
                    <label className="block text-white/40 text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 pl-1">CNIC Number</label>
                    <div className={`relative rounded-xl transition-all duration-300 ${focused === 'cnic' ? 'ring-2 ring-amber-500/25' : ''}`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-300 ${focused === 'cnic' ? 'bg-gradient-to-b from-amber-400 to-orange-500' : 'bg-transparent'}`} />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <CreditCard className={`h-[18px] w-[18px] transition-colors duration-300 ${focused === 'cnic' ? 'text-amber-400' : 'text-white/20'}`} />
                      </div>
                      <input
                        type="text"
                        name="cnic"
                        value={formData.cnic}
                        onChange={handleChange}
                        onFocus={() => setFocused('cnic')}
                        onBlur={() => setFocused(null)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white text-[15px] placeholder-white/20 focus:outline-none focus:bg-white/[0.09] focus:border-white/[0.12] transition-all duration-300 tracking-wider font-mono"
                        placeholder="35201-1234567-1"
                        required
                        maxLength={15}
                        inputMode="numeric"
                      />
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div variants={fadeUp}>
                    <label className="block text-white/40 text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 pl-1">Password</label>
                    <div className={`relative rounded-xl transition-all duration-300 ${focused === 'password' ? 'ring-2 ring-amber-500/25' : ''}`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-300 ${focused === 'password' ? 'bg-gradient-to-b from-amber-400 to-orange-500' : 'bg-transparent'}`} />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLock className={`h-[18px] w-[18px] transition-colors duration-300 ${focused === 'password' ? 'text-amber-400' : 'text-white/20'}`} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setFocused('password')}
                        onBlur={() => setFocused(null)}
                        className="w-full pl-12 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white text-[15px] placeholder-white/20 focus:outline-none focus:bg-white/[0.09] focus:border-white/[0.12] transition-all duration-300"
                        placeholder="Enter password"
                        required
                        autoComplete="current-password"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/20 hover:text-white/50 transition-colors">
                        {showPassword ? <FiEyeOff className="h-[18px] w-[18px]" /> : <FiEye className="h-[18px] w-[18px]" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Submit */}
                  <motion.div variants={fadeUp} className="pt-2">
                    <motion.button
                      whileHover={{ y: -2, boxShadow: '0 20px 40px -12px rgba(251,191,36,0.3)' }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading || success}
                      className={`w-full relative overflow-hidden py-4 rounded-xl font-semibold text-[15px] transition-all duration-500 disabled:opacity-60 disabled:cursor-not-allowed group ${
                        success
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30'
                      }`}
                    >
                      <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
                      <span className="relative z-10 flex items-center justify-center gap-2.5 text-white">
                        {loading ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                              className="w-5 h-5 border-2 border-white/25 border-t-white rounded-full" />
                            Signing in...
                          </>
                        ) : success ? (
                          <>
                            <FiArrowRight className="w-5 h-5" />
                            Launching...
                          </>
                        ) : (
                          <>
                            <FiLogIn className="w-5 h-5" />
                            Sign In
                            <FiArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </>
                        )}
                      </span>
                    </motion.button>
                  </motion.div>
                </motion.div>
              </form>

              {/* Divider */}
              <motion.div variants={fadeUp} className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-[#0f1629]/80 text-white/15 text-[10px] tracking-[0.2em] uppercase">Driver Access</span>
                </div>
              </motion.div>

              {/* Admin link */}
              <motion.div variants={fadeUp} className="text-center space-y-2.5">
                <p className="text-white/20 text-[11px]">
                  Admin? <Link to="/login" className="text-cyan-400/50 hover:text-cyan-400/80 transition-colors font-medium">Sign in to Dashboard</Link>
                </p>
                <div className="flex items-center justify-center gap-2.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-amber-400 opacity-60" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-amber-500" />
                  </span>
                  <p className="text-white/15 text-[10px] tracking-wider">Secure Connection</p>
                  <span className="text-white/8">&#8226;</span>
                  <p className="text-white/10 text-[10px]">AdMotion Driver</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default DriverLogin
