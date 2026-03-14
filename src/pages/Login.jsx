import React, { useState, lazy, Suspense } from 'react'
import { FiEye, FiEyeOff, FiUser, FiLock, FiLogIn, FiZap, FiArrowRight } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const Car3DScene = lazy(() => import('../components/Car3D'))

class Car3DErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error) { console.warn('3D scene failed to load:', error) }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } }

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [carStatus, setCarStatus] = useState('idle')
  const [focused, setFocused] = useState(null)
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
    <div className="min-h-screen relative overflow-hidden select-none bg-[#030712]">

      {/* Deep space gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#1e1b4b_0%,#030712_50%,#030712_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,#0c1445_0%,transparent_50%)]" />

      {/* Animated orbs */}
      <motion.div animate={{ x: [0, 60, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/[0.06] rounded-full blur-[120px]" />
      <motion.div animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-40 -right-40 w-[550px] h-[550px] bg-violet-600/[0.05] rounded-full blur-[130px]" />
      <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-500/[0.04] rounded-full blur-[100px]" />

      {/* 3D Car - background */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <Car3DErrorBoundary>
          <Suspense fallback={null}>
            <Car3DScene status={carStatus} onAnimationComplete={handleAnimationComplete} />
          </Suspense>
        </Car3DErrorBoundary>
      </div>

      {/* Overlay for readability */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/20 via-transparent to-black/40 pointer-events-none" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />

      {/* Scan line */}
      <motion.div animate={{ y: ['0%', '100%'] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent z-[3] pointer-events-none" />

      {/* Corner brackets */}
      <div className="absolute inset-0 z-[3] pointer-events-none">
        {[['top-4 left-4', 'border-t border-l'], ['top-4 right-4', 'border-t border-r'], ['bottom-4 left-4', 'border-b border-l'], ['bottom-4 right-4', 'border-b border-r']].map(([pos, border], i) => (
          <motion.div key={i} animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
            className={`absolute ${pos} w-10 h-10 ${border} border-cyan-500/25 rounded-lg`} />
        ))}
      </div>

      {/* Status overlays */}
      <AnimatePresence>
        {carStatus === 'error' && (
          <>
            <motion.div key="err-pulse" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.15, 0] }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }}
              className="absolute inset-0 z-[4] bg-red-600 pointer-events-none" />
            <motion.div key="err-card" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="absolute top-[38%] left-[32%] -translate-x-1/2 -translate-y-1/2 z-[5] pointer-events-none">
              <div className="relative bg-red-500/10 backdrop-blur-xl px-10 py-7 rounded-2xl border border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.2)]">
                <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }} transition={{ duration: 0.6 }} className="text-5xl text-center mb-3">&#9888;&#65039;</motion.div>
                <motion.h2 animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-3xl font-black text-red-400 tracking-wider text-center">ACCESS DENIED</motion.h2>
                <p className="text-red-300/50 text-sm text-center mt-2">Authentication Failed</p>
              </div>
            </motion.div>
          </>
        )}
        {carStatus === 'success' && (
          <>
            <motion.div key="suc-glow" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.06, 0.03] }} exit={{ opacity: 0 }} transition={{ duration: 2 }}
              className="absolute inset-0 z-[4] bg-emerald-500 pointer-events-none" />
            <motion.div key="suc-card" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
              transition={{ type: 'spring', stiffness: 150, damping: 18 }}
              className="absolute bottom-28 left-[30%] -translate-x-1/2 z-[5] pointer-events-none">
              <div className="relative bg-emerald-500/10 backdrop-blur-xl px-10 py-5 rounded-2xl border border-emerald-400/30 shadow-[0_0_60px_rgba(16,185,129,0.15)]">
                <div className="flex items-center gap-5">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-4xl">&#128640;</motion.div>
                  <div>
                    <h2 className="text-2xl font-black text-emerald-400 tracking-wide">ENGINE STARTED</h2>
                    <p className="text-emerald-300/50 text-sm mt-1">Launching Dashboard...</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Branding */}
      <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
        className="absolute top-5 left-6 z-[10] pointer-events-none">
        <div className="flex items-center gap-3">
          <motion.div animate={{ boxShadow: ['0 0 12px rgba(6,182,212,0.2)', '0 0 24px rgba(6,182,212,0.35)', '0 0 12px rgba(6,182,212,0.2)'] }} transition={{ duration: 3, repeat: Infinity }}
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
            <FiZap className="text-white w-4 h-4" />
          </motion.div>
          <div>
            <h2 className="text-white font-bold text-base leading-none tracking-tight">AdMotion</h2>
            <p className="text-cyan-400/35 text-[9px] tracking-[0.2em] uppercase mt-0.5">Advertising in Motion</p>
          </div>
        </div>
      </motion.div>

      {/* Left info - Desktop only */}
      <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 1 }}
        className="hidden lg:flex flex-col justify-center absolute left-10 top-0 bottom-0 z-[10] pointer-events-none max-w-sm">
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
          <h3 className="text-white/90 text-3xl font-bold mb-3 leading-tight">
            Next-Gen Vehicle<br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">Advertising Platform</span>
          </h3>
          <p className="text-white/30 text-sm leading-relaxed mb-8">
            Transform fleet vehicles into dynamic digital billboards with real-time analytics and intelligent scheduling.
          </p>
          <div className="flex gap-8">
            {[{ val: '50K+', label: 'Impressions', color: 'text-cyan-400' }, { val: '120+', label: 'Vehicles', color: 'text-violet-400' }, { val: '98%', label: 'Uptime', color: 'text-emerald-400' }].map((s, i) => (
              <div key={i}>
                <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }} className={`${s.color} text-2xl font-bold`}>{s.val}</motion.p>
                <p className="text-white/20 text-[10px] uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ══════ LOGIN FORM ══════ */}
      <div className="relative z-[10] min-h-screen flex items-center justify-center lg:justify-end p-4 sm:p-6 lg:p-12 xl:pr-24">
        <motion.div
          initial="hidden" animate="visible" variants={stagger}
          className="w-full max-w-[420px]"
        >
          {/* Glow behind card */}
          <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 3, repeat: Infinity }}
            className={`absolute -inset-1 rounded-[28px] blur-xl transition-colors duration-700 ${
              carStatus === 'error' ? 'bg-red-500/20' : carStatus === 'success' ? 'bg-emerald-500/20' : 'bg-cyan-500/10'
            }`} />

          {/* Card */}
          <motion.div variants={fadeUp}
            className={`relative rounded-[24px] border backdrop-blur-xl shadow-2xl transition-all duration-700 ${
              carStatus === 'error' ? 'bg-[#1a0a0a]/80 border-red-500/20' : carStatus === 'success' ? 'bg-[#0a1a10]/80 border-emerald-500/20' : 'bg-[#0f1629]/80 border-white/[0.08]'
            }`}
          >
            {/* Animated top accent line */}
            <div className="relative h-[2px] rounded-t-[24px] overflow-hidden">
              <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className={`absolute inset-0 w-[200%] ${
                  carStatus === 'error' ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent'
                  : carStatus === 'success' ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-cyan-500 to-transparent'
                }`} />
            </div>

            <div className="p-8 sm:p-10">
              {/* Status bar */}
              <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-medium">System Active</span>
                </div>
                <div className="flex gap-[3px]">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} animate={{ height: [3, 12, 3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      className="w-[2px] bg-cyan-500/40 rounded-full" />
                  ))}
                </div>
              </motion.div>

              {/* Logo */}
              <motion.div variants={fadeUp} className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center mb-5">
                  {/* Outer ring */}
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute w-20 h-20 rounded-full border border-dashed border-cyan-500/15" />
                  {/* Middle ring */}
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                    className="absolute w-16 h-16 rounded-full border border-violet-500/20" />
                  {/* Icon */}
                  <motion.div whileHover={{ rotate: 180, scale: 1.1 }} transition={{ duration: 0.4 }}
                    className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 ${
                      carStatus === 'error' ? 'bg-red-500/15 shadow-red-500/20' : carStatus === 'success' ? 'bg-emerald-500/15 shadow-emerald-500/20' : 'bg-gradient-to-br from-cyan-500/20 to-violet-500/20 shadow-cyan-500/10'
                    } shadow-lg border border-white/[0.06]`}>
                    <FiLogIn className={`w-6 h-6 transition-colors duration-700 ${
                      carStatus === 'error' ? 'text-red-400' : carStatus === 'success' ? 'text-emerald-400' : 'text-cyan-400'
                    }`} />
                  </motion.div>
                </div>
                <h1 className="text-[26px] font-bold text-white tracking-tight mb-1">
                  Welcome <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">Back</span>
                </h1>
                <p className="text-white/35 text-sm">Sign in to your dashboard</p>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} className="mb-5">
                    <motion.div animate={{ x: [0, -3, 3, -3, 0] }} transition={{ duration: 0.4 }}
                      className="flex items-center gap-3 p-3.5 bg-red-500/8 border border-red-500/15 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-red-400 text-sm">&#10005;</span>
                      </div>
                      <p className="text-red-300/90 text-sm">{error}</p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <motion.div variants={stagger} className="space-y-5">
                  {/* Username */}
                  <motion.div variants={fadeUp}>
                    <label className="block text-white/40 text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 pl-1">Username</label>
                    <div className={`relative rounded-xl transition-all duration-300 ${focused === 'username' ? 'ring-2 ring-cyan-500/25' : ''}`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-300 ${focused === 'username' ? 'bg-gradient-to-b from-cyan-400 to-violet-500' : 'bg-transparent'}`} />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <motion.div animate={focused === 'username' ? { scale: 1.15 } : { scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                          <FiUser className={`h-[18px] w-[18px] transition-colors duration-300 ${focused === 'username' ? 'text-cyan-400' : 'text-white/20'}`} />
                        </motion.div>
                      </div>
                      <input type="text" name="username" value={formData.username} onChange={handleChange}
                        onFocus={() => setFocused('username')} onBlur={() => setFocused(null)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white text-[15px] placeholder-white/20 focus:outline-none focus:bg-white/[0.09] focus:border-white/[0.12] transition-all duration-300"
                        placeholder="Enter username" required autoComplete="username" />
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div variants={fadeUp}>
                    <label className="block text-white/40 text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 pl-1">Password</label>
                    <div className={`relative rounded-xl transition-all duration-300 ${focused === 'password' ? 'ring-2 ring-cyan-500/25' : ''}`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-300 ${focused === 'password' ? 'bg-gradient-to-b from-cyan-400 to-violet-500' : 'bg-transparent'}`} />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <motion.div animate={focused === 'password' ? { scale: 1.15 } : { scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                          <FiLock className={`h-[18px] w-[18px] transition-colors duration-300 ${focused === 'password' ? 'text-cyan-400' : 'text-white/20'}`} />
                        </motion.div>
                      </div>
                      <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                        onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                        className="w-full pl-12 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white text-[15px] placeholder-white/20 focus:outline-none focus:bg-white/[0.09] focus:border-white/[0.12] transition-all duration-300"
                        placeholder="Enter password" required autoComplete="current-password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/20 hover:text-white/50 transition-colors">
                        <motion.div animate={{ rotate: showPassword ? 180 : 0 }} transition={{ duration: 0.3 }}>
                          {showPassword ? <FiEyeOff className="h-[18px] w-[18px]" /> : <FiEye className="h-[18px] w-[18px]" />}
                        </motion.div>
                      </button>
                    </div>
                  </motion.div>

                  {/* Remember / Forgot */}
                  <motion.div variants={fadeUp} className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-8 h-[18px] bg-white/[0.08] rounded-full peer-checked:bg-cyan-500/40 transition-colors duration-300 border border-white/[0.06]" />
                        <div className="absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white/40 rounded-full peer-checked:translate-x-[14px] peer-checked:bg-cyan-400 transition-all duration-300" />
                      </div>
                      <span className="text-white/30 text-xs group-hover:text-white/45 transition-colors">Remember me</span>
                    </label>
                    <span className="text-cyan-400/40 text-xs hover:text-cyan-400/60 transition-colors cursor-pointer">Forgot password?</span>
                  </motion.div>

                  {/* Submit */}
                  <motion.div variants={fadeUp}>
                    <motion.button
                      whileHover={{ y: -2, boxShadow: '0 20px 40px -12px rgba(6,182,212,0.3)' }}
                      whileTap={{ scale: 0.98 }}
                      type="submit" disabled={loading}
                      className={`w-full relative overflow-hidden py-4 rounded-xl font-semibold text-[15px] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed group ${
                        carStatus === 'success'
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 shadow-lg shadow-cyan-500/15 hover:shadow-cyan-500/30'
                      }`}
                    >
                      {/* Shine */}
                      <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
                      {/* Glow pulse */}
                      {!loading && carStatus !== 'success' && (
                        <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2.5, repeat: Infinity }}
                          className="absolute inset-0 rounded-xl shadow-[inset_0_0_20px_rgba(6,182,212,0.15)]" />
                      )}
                      <span className="relative z-10 flex items-center justify-center gap-2.5 text-white">
                        {loading ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                              className="w-5 h-5 border-2 border-white/25 border-t-white rounded-full" />
                            <span>Authenticating...</span>
                          </>
                        ) : carStatus === 'success' ? (
                          <>
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                              <FiArrowRight className="w-5 h-5" />
                            </motion.div>
                            <span>Launching...</span>
                          </>
                        ) : (
                          <>
                            <FiLogIn className="w-5 h-5" />
                            <span>Sign In</span>
                            <FiArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 opacity-60 group-hover:opacity-100" />
                          </>
                        )}
                      </span>
                    </motion.button>
                  </motion.div>
                </motion.div>
              </form>

              {/* Divider */}
              <motion.div variants={fadeUp} className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-[#0f1629]/80 text-white/15 text-[10px] tracking-[0.2em] uppercase">Secure Access</span>
                </div>
              </motion.div>

              {/* Footer */}
              <motion.div variants={fadeUp} className="text-center space-y-3">
                <p className="text-white/20 text-[11px]">
                  Hint: use <span className="text-cyan-400/40 font-medium">muneeb</span> for both fields
                </p>
                <div className="flex items-center justify-center gap-2.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <p className="text-white/15 text-[10px] tracking-wider">Encrypted Connection</p>
                  <span className="text-white/8">&#8226;</span>
                  <p className="text-white/10 text-[10px]">v2.0</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[10] pointer-events-none">
        <div className="flex items-center gap-3 bg-white/[0.02] backdrop-blur-md px-5 py-1.5 rounded-full border border-white/[0.04]">
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="relative">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
          </motion.div>
          <span className="text-white/20 text-[10px] font-medium tracking-wide">System Online</span>
          <span className="text-white/[0.06]">&#8226;</span>
          <span className="text-cyan-400/25 text-[10px]">AdMotion</span>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
