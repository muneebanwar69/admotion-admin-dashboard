import React, { useState, useRef, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { FiEye, FiEyeOff, FiUser, FiLock, FiLogIn, FiArrowRight, FiZap, FiChevronDown } from 'react-icons/fi'
import {
  motion, AnimatePresence, useScroll, useTransform, useReducedMotion, useMotionValue, useSpring
} from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const LoginScene = lazy(() => import('../components/LoginScene'))

/* If WebGL/Three fails, silently fall back to the CSS background only */
class SceneBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(e) { console.warn('LoginScene failed:', e) }
  render() { return this.state.hasError ? null : this.props.children }
}

const fadeUp = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [focused, setFocused] = useState(null)
  const { login } = useAuth()
  const reduce = useReducedMotion()

  /* scroll-driven parallax */
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -160])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0.15])
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12])

  /* mouse-tilt for the login card */
  const tiltX = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 })
  const tiltY = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 })
  const onCardMove = (e) => {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    tiltY.set(px * 8); tiltX.set(-py * 8)
  }
  const onCardLeave = () => { tiltX.set(0); tiltY.set(0) }

  const handleChange = (e) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(formData.username, formData.password)
      setSuccess(true)
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative bg-[#070b2a] text-white">
      {/* ── Fixed Three.js scene + gradient (behind everything) ── */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#1a0f4d_0%,#13205f_38%,#0a1142_100%)]" />
        <motion.div style={{ scale: sceneScale }} className="absolute inset-0">
          <SceneBoundary>
            <Suspense fallback={null}><LoginScene /></Suspense>
          </SceneBoundary>
        </motion.div>
        {/* readability veil */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,transparent_0%,rgba(7,11,42,0.55)_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b2a] via-transparent to-[#070b2a]/40" />
      </div>

      {/* ── Top brand bar ── */}
      <header className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-5 sm:px-8 py-4 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <FiZap className="text-[#0a1142] w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-[17px] leading-none tracking-tight">Ad<span className="text-amber-400">Motion</span></p>
            <p className="text-[9px] tracking-[0.25em] uppercase text-cyan-300/60 mt-1">Advertising in Motion</p>
          </div>
        </div>
        <Link to="/driver/login" className="pointer-events-auto text-xs font-semibold text-cyan-200/70 hover:text-cyan-200 transition-colors border border-white/10 hover:border-cyan-300/40 rounded-full px-4 py-2 backdrop-blur-sm">
          Driver Portal →
        </Link>
      </header>

      {/* ════════ SECTION 1 — hero + login ════════ */}
      <section className="relative z-10 min-h-screen grid lg:grid-cols-2 items-center gap-8 px-5 sm:px-10 lg:px-16 pt-24 pb-16">
        {/* Hero (left) — parallax */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }}
          initial="hidden" animate="visible" variants={stagger}
          className="hidden lg:block max-w-xl">
          <motion.span variants={fadeUp} className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.3em] uppercase text-amber-300/80 border border-amber-400/25 rounded-full px-4 py-1.5 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> AI-Powered Platform
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-5xl xl:text-6xl font-black leading-[1.05] tracking-tight">
            Turn vehicles into
            <br /><span className="bg-gradient-to-r from-amber-300 via-amber-400 to-cyan-300 bg-clip-text text-transparent">smart moving billboards</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-white/55 text-lg leading-relaxed mt-6 max-w-md">
            Launch, track and optimise city-wide ad campaigns in real time — driven by an AI engine that decides which ad runs where, when, and on which vehicle.
          </motion.p>
          <motion.div variants={fadeUp} className="flex gap-10 mt-10">
            {[{ v: 'AI', l: 'Scheduling' }, { v: 'GPS', l: 'Live Tracking' }, { v: 'Real-Time', l: 'Analytics' }].map((s, i) => (
              <div key={i}>
                <p className="text-2xl font-black bg-gradient-to-r from-amber-300 to-cyan-300 bg-clip-text text-transparent">{s.v}</p>
                <p className="text-white/35 text-[11px] uppercase tracking-widest mt-1">{s.l}</p>
              </div>
            ))}
          </motion.div>
          <motion.div variants={fadeUp} className="flex items-center gap-2 text-white/30 text-xs mt-14">
            <motion.span animate={reduce ? {} : { y: [0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity }}><FiChevronDown /></motion.span>
            Scroll to explore
          </motion.div>
        </motion.div>

        {/* Login card (right) — always visible in first viewport */}
        <div className="flex justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            onMouseMove={onCardMove} onMouseLeave={onCardLeave}
            style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1000 }}
            className="relative w-full max-w-[420px]"
          >
            {/* glow */}
            <div aria-hidden className={`absolute -inset-[2px] rounded-[26px] blur-lg transition-colors duration-500 ${error ? 'bg-red-500/25' : success ? 'bg-emerald-500/25' : 'bg-amber-500/15'}`} />

            <div className="relative rounded-[24px] bg-[#0c1238]/85 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden">
              {/* animated top accent */}
              <div className="relative h-[3px] overflow-hidden">
                <motion.div animate={reduce ? {} : { x: ['-100%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              </div>

              <div className="p-8 sm:p-10">
                <div className="mb-7">
                  <h2 className="text-[26px] font-black tracking-tight">Welcome <span className="text-amber-400">back</span></h2>
                  <p className="text-white/45 text-sm mt-1">Sign in to your AdMotion dashboard</p>
                </div>

                {/* error — accessible live region */}
                <div aria-live="assertive" className="mb-2">
                  <AnimatePresence>
                    {error && (
                      <motion.div role="alert" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 18 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="flex items-center gap-3 p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl">
                        <span className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center text-red-300 text-sm flex-shrink-0">!</span>
                        <p className="text-red-200/90 text-sm">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* Username */}
                  <div>
                    <label htmlFor="username" className="block text-white/55 text-xs font-semibold uppercase tracking-[0.12em] mb-2">Username</label>
                    <div className="relative">
                      <FiUser aria-hidden className={`absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors ${focused === 'username' ? 'text-amber-400' : 'text-white/30'}`} />
                      <input id="username" name="username" type="text" value={formData.username} onChange={handleChange}
                        onFocus={() => setFocused('username')} onBlur={() => setFocused(null)}
                        autoComplete="username" required aria-invalid={!!error}
                        placeholder="Enter your username"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/[0.06] border border-white/10 rounded-xl text-[15px] text-white placeholder-white/25 outline-none transition-all focus:bg-white/[0.1] focus:border-amber-400/50 focus-visible:ring-2 focus-visible:ring-amber-400/40" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-white/55 text-xs font-semibold uppercase tracking-[0.12em] mb-2">Password</label>
                    <div className="relative">
                      <FiLock aria-hidden className={`absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors ${focused === 'password' ? 'text-amber-400' : 'text-white/30'}`} />
                      <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange}
                        onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                        autoComplete="current-password" required aria-invalid={!!error}
                        placeholder="Enter your password"
                        className="w-full pl-12 pr-12 py-3.5 bg-white/[0.06] border border-white/10 rounded-xl text-[15px] text-white placeholder-white/25 outline-none transition-all focus:bg-white/[0.1] focus:border-amber-400/50 focus-visible:ring-2 focus-visible:ring-amber-400/40" />
                      <button type="button" onClick={() => setShowPassword(s => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/35 hover:text-white/70 focus-visible:ring-2 focus-visible:ring-amber-400/40 outline-none transition-colors">
                        {showPassword ? <FiEyeOff className="w-[18px] h-[18px]" /> : <FiEye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember / Forgot */}
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                      <input type="checkbox" className="peer sr-only" />
                      <span className="w-9 h-5 rounded-full bg-white/10 border border-white/10 peer-checked:bg-amber-500/50 transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:rounded-full after:bg-white/60 peer-checked:after:bg-amber-300 peer-checked:after:translate-x-4 after:transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400/40" />
                      <span className="text-white/45 group-hover:text-white/70 transition-colors text-xs">Remember me</span>
                    </label>
                    <button type="button" className="text-cyan-300/60 hover:text-cyan-200 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400/40 outline-none rounded">Forgot password?</button>
                  </div>

                  {/* Submit */}
                  <motion.button type="submit" disabled={loading || success}
                    whileHover={reduce ? {} : { y: -2 }} whileTap={reduce ? {} : { scale: 0.985 }}
                    className="w-full relative overflow-hidden py-4 rounded-xl font-bold text-[15px] text-[#0a1142] bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 shadow-lg shadow-amber-500/25 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1238] focus-visible:ring-amber-300 outline-none">
                    {!reduce && (
                      <motion.span aria-hidden animate={{ x: ['-120%', '220%'] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    )}
                    <span className="relative flex items-center justify-center gap-2.5">
                      {loading ? (
                        <><span className="w-5 h-5 border-2 border-[#0a1142]/30 border-t-[#0a1142] rounded-full animate-spin" /> Authenticating…</>
                      ) : success ? (
                        <><FiArrowRight className="w-5 h-5" /> Launching dashboard…</>
                      ) : (
                        <><FiLogIn className="w-5 h-5" /> Sign In</>
                      )}
                    </span>
                  </motion.button>
                </form>

                {/* footer / hint */}
                <div className="mt-7 pt-6 border-t border-white/10 text-center space-y-2.5">
                  <p className="text-white/30 text-[11px]">Hint: use <span className="text-amber-300/70 font-semibold">muneeb</span> for both fields</p>
                  <p className="text-white/30 text-[11px]">Driver? <Link to="/driver/login" className="text-cyan-300/70 hover:text-cyan-200 font-medium transition-colors">Sign in to the Driver Portal</Link></p>
                  <p className="flex items-center justify-center gap-2 text-white/20 text-[10px] tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Encrypted connection · v2.0
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ SECTION 2 — scroll-reveal feature strip ════════ */}
      <section className="relative z-10 px-5 sm:px-10 lg:px-16 pb-24">
        <motion.h3 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
          className="text-center text-2xl sm:text-3xl font-black tracking-tight mb-3">
          One platform · <span className="text-amber-400">AI at the core</span>
        </motion.h3>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="text-center text-white/45 max-w-xl mx-auto mb-12 text-sm">
          Everything you need to run intelligent out-of-home advertising on a moving fleet.
        </motion.p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {[
            { i: '🤖', t: 'AI Ad Scheduling', d: 'Best ad per vehicle by GPS, time-slot & weather.', c: 'from-blue-500 to-cyan-400' },
            { i: '📈', t: 'Reach Estimation', d: 'Real-world impressions estimated per play.', c: 'from-fuchsia-500 to-pink-400' },
            { i: '🧠', t: 'ML Prediction', d: 'Learns from collected data to predict demand.', c: 'from-amber-500 to-orange-400' },
            { i: '🎯', t: 'Geo & Weather Targeting', d: 'Auto-targets the right audience & conditions.', c: 'from-teal-500 to-emerald-400' },
            { i: '🎙️', t: 'Voice-Command Control', d: 'Hands-free dashboard via speech recognition.', c: 'from-violet-500 to-indigo-400' },
            { i: '📊', t: 'Live Analytics', d: 'Reach, spend & trends, updated in real time.', c: 'from-rose-500 to-amber-400' },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.06, duration: 0.5 }} whileHover={reduce ? {} : { y: -5 }}
              className="rounded-2xl p-6 bg-white/[0.05] border border-white/10 backdrop-blur-md">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.c} flex items-center justify-center text-xl mb-4`}>{f.i}</div>
              <h4 className="font-bold text-[15px] mb-1.5">{f.t}</h4>
              <p className="text-white/45 text-[13px] leading-relaxed">{f.d}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-white/25 text-[11px] mt-14 tracking-wide">AdMotion · Intelligent Vehicle Advertising</p>
      </section>
    </div>
  )
}

export default Login
