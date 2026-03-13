import React, { useState } from 'react'
import { FiEye, FiEyeOff, FiUser, FiLock, FiLogIn, FiZap } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Car3DScene from '../components/Car3D'

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [carStatus, setCarStatus] = useState('idle')
  const { login } = useAuth()

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    if (carStatus === 'error') setCarStatus('idle')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(formData.username, formData.password)
      setCarStatus('success')
    } catch (err) {
      setError(err.message)
      setCarStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const handleAnimationComplete = () => {
    if (carStatus === 'error') setCarStatus('idle')
  }

  return (
    <div className="min-h-screen relative overflow-hidden select-none">

      {/* ═══ Deep Space Background - Rich Gradient ═══ */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0f0826] to-[#1a0a2e]" />

      {/* Animated ambient light orbs - vivid colors */}
      <motion.div
        animate={{ x: [0, 80, 0], y: [0, -40, 0], scale: [1, 1.3, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-indigo-500/[0.08] rounded-full blur-[130px]"
      />
      <motion.div
        animate={{ x: [0, -60, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-fuchsia-600/[0.07] rounded-full blur-[140px]"
      />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-cyan-500/[0.05] rounded-full blur-[110px]"
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-2/3 right-1/3 w-[300px] h-[300px] bg-rose-500/[0.04] rounded-full blur-[100px]"
      />
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-emerald-500/[0.03] rounded-full blur-[90px]"
      />

      {/* ═══ 3D Car Scene - FULL PAGE BACKGROUND ═══ */}
      <div className="absolute inset-0 z-[1]">
        <Car3DScene status={carStatus} onAnimationComplete={handleAnimationComplete} />
      </div>

      {/* ═══ Gradient Overlays for Form Readability ═══ */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-transparent via-black/10 to-black/50 pointer-events-none" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

      {/* ═══ Animated Scan Lines ═══ */}
      <motion.div
        animate={{ y: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent z-[3] pointer-events-none"
      />
      <motion.div
        animate={{ y: ['0%', '100%'] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'linear', delay: 2.5 }}
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/15 to-transparent z-[3] pointer-events-none"
      />

      {/* ═══ HUD Corner Brackets ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="absolute inset-0 z-[3] pointer-events-none"
      >
        <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-3 left-3 w-12 h-12 border-t border-l border-cyan-500/30 rounded-tl-xl" />
        <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} className="absolute top-3 right-3 w-12 h-12 border-t border-r border-purple-500/30 rounded-tr-xl" />
        <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="absolute bottom-3 left-3 w-12 h-12 border-b border-l border-cyan-500/30 rounded-bl-xl" />
        <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity, delay: 1.5 }} className="absolute bottom-3 right-3 w-12 h-12 border-b border-r border-purple-500/30 rounded-br-xl" />
      </motion.div>

      {/* ═══ Status Overlays - Full Page Effects ═══ */}
      <AnimatePresence>
        {carStatus === 'error' && (
          <>
            {/* Full-page red pulse */}
            <motion.div
              key="error-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.2, 0, 0.12, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 z-[4] bg-red-600 pointer-events-none"
            />

            {/* Shockwave ring from car area */}
            <motion.div
              key="error-shockwave"
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 6, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute top-1/2 left-[35%] -translate-x-1/2 -translate-y-1/2 z-[4] pointer-events-none"
            >
              <div className="w-28 h-28 border-2 border-red-500/50 rounded-full" />
            </motion.div>

            {/* Screen crack effect */}
            <motion.div
              key="error-crack"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-[4] pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, transparent 49%, rgba(239,68,68,0.25) 50%, transparent 51%),
                  linear-gradient(135deg, transparent 49%, rgba(239,68,68,0.18) 50%, transparent 51%),
                  linear-gradient(90deg, transparent 49%, rgba(239,68,68,0.12) 50%, transparent 51%)
                `,
                backgroundSize: '25px 100%, 30px 100%, 40px 100%',
                backgroundPosition: '38% 0, 42% 0, 35% 0'
              }}
            />

            {/* ACCESS DENIED card */}
            <motion.div
              key="error-card"
              initial={{ opacity: 0, scale: 0.5, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="absolute top-[38%] left-[32%] -translate-x-1/2 -translate-y-1/2 z-[5] pointer-events-none"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-3xl scale-150 rounded-full" />
                <div className="relative bg-gradient-to-br from-red-500/15 to-red-800/15 backdrop-blur-xl px-10 py-7 rounded-2xl border border-red-500/30 shadow-[0_0_80px_rgba(239,68,68,0.25)]">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.6 }}
                    className="text-5xl text-center mb-3"
                  >⚠️</motion.div>
                  <motion.h2
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-3xl font-black text-red-400 tracking-wider text-center"
                  >ACCESS DENIED</motion.h2>
                  <p className="text-red-300/50 text-sm text-center mt-2 font-medium">Car Systems Damaged</p>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {carStatus === 'success' && (
          <>
            {/* Green energy waves */}
            <motion.div
              key="success-wave-1"
              initial={{ scale: 0, opacity: 0.7 }}
              animate={{ scale: 6, opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute top-1/2 left-[35%] -translate-x-1/2 -translate-y-1/2 z-[4] pointer-events-none"
            >
              <div className="w-40 h-40 border-2 border-green-400/50 rounded-full" />
            </motion.div>
            <motion.div
              key="success-wave-2"
              initial={{ scale: 0.3, opacity: 0.5 }}
              animate={{ scale: 5, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.15 }}
              className="absolute top-1/2 left-[35%] -translate-x-1/2 -translate-y-1/2 z-[4] pointer-events-none"
            >
              <div className="w-40 h-40 border-2 border-cyan-400/40 rounded-full" />
            </motion.div>

            {/* Subtle green glow */}
            <motion.div
              key="success-glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.08, 0.04] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="absolute inset-0 z-[4] bg-green-500 pointer-events-none"
            />

            {/* ENGINE STARTED card */}
            <motion.div
              key="success-card"
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: 'spring', stiffness: 150, damping: 18 }}
              className="absolute bottom-28 left-[30%] -translate-x-1/2 z-[5] pointer-events-none"
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-r from-green-400/25 via-cyan-400/25 to-blue-400/25 blur-3xl scale-150 rounded-full"
                />
                <div className="relative bg-gradient-to-br from-green-500/12 via-cyan-500/12 to-blue-500/12 backdrop-blur-xl px-10 py-5 rounded-2xl border border-green-400/30 shadow-[0_0_80px_rgba(74,222,128,0.2)]">
                  <div className="flex items-center gap-5">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="text-5xl"
                    >🚀</motion.div>
                    <div>
                      <motion.h2
                        animate={{ textShadow: ['0 0 20px rgba(74,222,128,0.6)', '0 0 40px rgba(74,222,128,0.9)', '0 0 20px rgba(74,222,128,0.6)'] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-3xl font-black text-green-400 tracking-wide"
                      >ENGINE STARTED</motion.h2>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-0.5">
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              animate={{ height: ['4px', '16px', '4px'] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                              className="w-1 bg-gradient-to-t from-green-400 to-cyan-400 rounded-full"
                            />
                          ))}
                        </div>
                        <p className="text-green-300/60 text-sm font-medium">Launching Dashboard...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ AdMotion Branding - Top Left ═══ */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="absolute top-5 left-6 z-[10] pointer-events-none"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ boxShadow: ['0 0 12px rgba(6,182,212,0.25)', '0 0 24px rgba(6,182,212,0.4)', '0 0 12px rgba(6,182,212,0.25)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg"
          >
            <FiZap className="text-white w-4 h-4" />
          </motion.div>
          <div>
            <h2 className="text-white font-bold text-base leading-none tracking-tight">AdMotion</h2>
            <p className="text-cyan-400/40 text-[9px] tracking-[0.2em] uppercase mt-0.5">Advertising in Motion</p>
          </div>
        </div>
      </motion.div>

      {/* ═══ Left Side Info - Visible on Desktop ═══ */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="hidden lg:block absolute bottom-32 left-8 z-[10] pointer-events-none max-w-xs"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <h3 className="text-white/80 text-2xl font-bold mb-2 leading-tight">
            Next-Gen Vehicle
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Advertising Platform
            </span>
          </h3>
          <p className="text-white/30 text-sm leading-relaxed">
            Transform fleet vehicles into dynamic digital billboards with real-time analytics and intelligent scheduling.
          </p>

          {/* Stats row */}
          <div className="flex gap-6 mt-5">
            <div>
              <motion.p
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-cyan-400 text-xl font-bold"
              >50K+</motion.p>
              <p className="text-white/25 text-[10px] uppercase tracking-wider">Impressions</p>
            </div>
            <div>
              <motion.p
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                className="text-purple-400 text-xl font-bold"
              >120+</motion.p>
              <p className="text-white/25 text-[10px] uppercase tracking-wider">Vehicles</p>
            </div>
            <div>
              <motion.p
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                className="text-pink-400 text-xl font-bold"
              >98%</motion.p>
              <p className="text-white/25 text-[10px] uppercase tracking-wider">Uptime</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ═══ Login Form Card - Floating on Right ═══ */}
      <div className="relative z-[10] min-h-screen flex items-center justify-center lg:justify-end p-4 sm:p-6 lg:p-10 xl:pr-20 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="w-full max-w-[400px] pointer-events-auto"
        >
          <div className="relative group">
            {/* Animated outer glow - changes with status */}
            <motion.div
              animate={{
                opacity: carStatus === 'error' ? [0.4, 0.7, 0.4] : carStatus === 'success' ? [0.4, 0.7, 0.4] : [0.15, 0.3, 0.15]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute -inset-px rounded-3xl blur-sm transition-colors duration-700 ${
                carStatus === 'error'
                  ? 'bg-gradient-to-br from-red-500/50 to-orange-600/50'
                  : carStatus === 'success'
                  ? 'bg-gradient-to-br from-green-500/50 to-cyan-500/50'
                  : 'bg-gradient-to-br from-cyan-500/25 via-blue-500/15 to-purple-500/25'
              }`}
            />

            {/* Glass card body */}
            <div className={`relative backdrop-blur-2xl rounded-3xl border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7)] p-7 sm:p-8 transition-all duration-700 ${
              carStatus === 'error'
                ? 'bg-red-950/20 border-red-500/15'
                : carStatus === 'success'
                ? 'bg-green-950/20 border-green-500/15'
                : 'bg-white/[0.05] border-white/[0.08]'
            }`}>

              {/* Header */}
              <div className="text-center mb-7">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 backdrop-blur-sm border transition-all duration-700 ${
                    carStatus === 'error'
                      ? 'bg-red-500/15 border-red-500/20'
                      : carStatus === 'success'
                      ? 'bg-green-500/15 border-green-500/20'
                      : 'bg-gradient-to-br from-cyan-500/15 to-blue-600/15 border-white/10'
                  }`}
                >
                  <FiLogIn className={`w-7 h-7 transition-colors duration-700 ${
                    carStatus === 'error' ? 'text-red-400' : carStatus === 'success' ? 'text-green-400' : 'text-cyan-400'
                  }`} />
                </motion.div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
                <p className="text-white/35 text-sm mt-1">Sign in to access your dashboard</p>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="mb-5"
                  >
                    <motion.div
                      animate={{ x: [0, -4, 4, -4, 4, 0] }}
                      transition={{ duration: 0.4 }}
                      className="p-3 bg-red-500/10 border border-red-500/15 rounded-xl"
                    >
                      <p className="text-red-300 text-sm">{error}</p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-white/50 text-[11px] font-semibold uppercase tracking-wider pl-1">Username</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <FiUser className="h-4 w-4 text-white/20 group-focus-within/input:text-cyan-400 transition-colors duration-300" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500/15 focus:bg-white/[0.06] transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.1]"
                      placeholder="Enter your username"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-white/50 text-[11px] font-semibold uppercase tracking-wider pl-1">Password</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <FiLock className="h-4 w-4 text-white/20 group-focus-within/input:text-cyan-400 transition-colors duration-300" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-11 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500/15 focus:bg-white/[0.06] transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.1]"
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/20 hover:text-white/50 transition-colors duration-200"
                    >
                      {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(6, 182, 212, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-cyan-500/15 hover:shadow-cyan-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                >
                  {/* Animated shine */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <FiLogIn className="w-4 h-4" />
                        Sign In
                      </>
                    )}
                  </span>
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.04]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-transparent text-white/15 text-[10px] tracking-widest uppercase">System Access</span>
                </div>
              </div>

              {/* Footer info */}
              <div className="text-center space-y-2">
                <p className="text-white/20 text-xs">
                  Default credentials: <span className="text-white/40 font-medium">muneeb / muneeb</span>
                </p>
                <div className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1.5 h-1.5 bg-green-400/50 rounded-full"
                  />
                  <p className="text-white/15 text-[10px] tracking-wide">Secure Connection Established</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ Bottom Status Bar ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[10] pointer-events-none"
      >
        <div className="flex items-center gap-3 bg-white/[0.03] backdrop-blur-lg px-5 py-1.5 rounded-full border border-white/[0.05]">
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative"
          >
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
            <div className="absolute inset-0 bg-cyan-400 rounded-full blur-sm" />
          </motion.div>
          <span className="text-white/25 text-[10px] font-medium tracking-wide">System Online</span>
          <span className="text-white/10">|</span>
          <span className="text-cyan-400/30 text-[10px]">v2.0</span>
          <span className="text-white/10">|</span>
          <span className="text-white/15 text-[10px]">AdMotion Platform</span>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
