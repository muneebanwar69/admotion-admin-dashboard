import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Wallet, TrendingUp, Calendar, Clock, Banknote, Sparkles, Target, Award, ChevronRight, CreditCard } from 'lucide-react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { useDriverAuth } from '../../contexts/DriverAuthContext'

/* ─── Helpers ─── */
const fmt = (n) => Math.round(n).toLocaleString()

const getDaysInMonth = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

const getDaysRemaining = () => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return lastDay - now.getDate()
}

const getEndOfMonth = () => {
  const now = new Date()
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return last.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* Smooth animated counter with easing */
const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const target = parseFloat(value) || 0
    if (target === 0) { setDisplay(0); return }
    const duration = 1400
    const start = performance.now()
    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = target * eased
      setDisplay(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.floor(current))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value, decimals])
  return <>{prefix}{decimals > 0 ? display.toFixed(decimals) : display.toLocaleString()}{suffix}</>
}

/* Sparkle/confetti decorative particles */
const SparkleParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: 3 + (i % 3),
          height: 3 + (i % 3),
          left: `${10 + i * 11}%`,
          top: `${15 + (i % 3) * 25}%`,
          background: i % 3 === 0 ? 'rgba(255,255,255,0.4)' : i % 3 === 1 ? 'rgba(52,211,153,0.5)' : 'rgba(245,158,11,0.4)',
        }}
        animate={{
          y: [0, -8, 0, 8, 0],
          x: [0, 4, 0, -4, 0],
          opacity: [0.2, 0.8, 0.2],
          scale: [0.8, 1.3, 0.8],
        }}
        transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
      />
    ))}
  </div>
)

/* Monthly Progress Ring SVG */
const MonthlyProgressRing = ({ percent, monthEarnings, contractRate, inView }) => {
  const size = 160
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const capped = Math.min(percent, 100)
  const offset = circumference - (capped / 100) * circumference

  const ringColor = capped >= 100 ? '#10b981' : capped >= 50 ? '#3b82f6' : '#8b5cf6'

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="currentColor" strokeWidth={stroke}
            className="text-slate-200 dark:text-slate-700"
          />
          {/* Glow */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={ringColor} strokeWidth={stroke + 6} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={inView ? { strokeDashoffset: offset } : {}}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            opacity={0.15}
            style={{ filter: 'blur(6px)' }}
          />
          {/* Main arc */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={ringColor} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={inView ? { strokeDashoffset: offset } : {}}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center"
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">Monthly</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">
              {Math.round(capped)}%
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Rs {fmt(monthEarnings)}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/* Hours Circular Progress */
const HoursCircle = ({ hours, required, inView }) => {
  const size = 100
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const percent = Math.min((hours / required) * 100, 100)
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative inline-block">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-200 dark:text-slate-700" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#8b5cf6" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={inView ? { strokeDashoffset: offset } : {}}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-lg font-bold text-slate-800 dark:text-white">{hours.toFixed(1)}</p>
        <p className="text-[9px] text-slate-400 dark:text-slate-500">of {required}h</p>
      </div>
    </div>
  )
}

/* Shimmer skeleton */
const ShimmerBlock = ({ className }) => (
  <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  </div>
)

/* 3D Tilt wrapper */
const TiltCard = ({ children, className, delay = 0 }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-30px' })
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -8, y: x * 8 })
  }
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.15s ease-out',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── Main Component ─── */
const DriverEarnings = () => {
  const { driver } = useDriverAuth()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)

  const heroRef = useRef(null)
  const heroInView = useInView(heroRef, { once: true, margin: '-20px' })
  const ringRef = useRef(null)
  const ringInView = useInView(ringRef, { once: true, margin: '-30px' })
  const chartRef = useRef(null)
  const chartInView = useInView(chartRef, { once: true, margin: '-30px' })
  const hoursRef = useRef(null)
  const hoursInView = useInView(hoursRef, { once: true, margin: '-30px' })

  // Listen to vehicle data (driver.uid = vehicle doc id)
  useEffect(() => {
    if (!driver?.uid) { setLoading(false); return }
    const unsub = onSnapshot(doc(db, 'vehicles', driver.uid), (snap) => {
      if (snap.exists()) setVehicle({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
    return () => unsub()
  }, [driver?.uid])

  // ── Compute earnings ──
  const contractRate = vehicle?.contractRate || 0
  const requiredHoursPerDay = vehicle?.requiredHoursPerDay || 8
  const todayDisplayHours = vehicle?.todayDisplayHours || 0
  const monthDisplayHours = vehicle?.monthDisplayHours || 0

  const dailyRate = contractRate / 30
  const todayEarnings = Math.min(todayDisplayHours / requiredHoursPerDay, 1) * dailyRate
  const monthEarnings = Math.min((monthDisplayHours / (requiredHoursPerDay * 30)) * contractRate, contractRate)
  const monthPercent = contractRate > 0 ? (monthEarnings / contractRate) * 100 : 0
  const dailyPercent = Math.min((todayDisplayHours / requiredHoursPerDay) * 100, 100)

  const daysRemaining = getDaysRemaining()
  const daysInMonth = getDaysInMonth()
  const daysPassed = daysInMonth - daysRemaining
  const estimatedPayout = contractRate > 0 ? Math.min((monthEarnings / Math.max(daysPassed, 1)) * daysInMonth, contractRate) : 0

  // Placeholder chart data for last 7 days (daily earnings approximation)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    if (i === 6) return todayEarnings // today is last bar
    // Placeholder for previous days - show proportional estimate
    const avgDaily = daysPassed > 1 ? (monthEarnings - todayEarnings) / Math.max(daysPassed - 1, 1) : 0
    return Math.max(avgDaily + (Math.random() - 0.5) * avgDaily * 0.3, 0)
  })
  const maxChart = Math.max(...chartData, 1)

  const dayLabels = (() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date().getDay()
    const result = []
    for (let i = 6; i >= 0; i--) {
      result.push(days[(today - i + 7) % 7])
    }
    return result
  })()

  if (loading) {
    return (
      <div className="space-y-5">
        <ShimmerBlock className="h-10 w-40" />
        <ShimmerBlock className="h-48 w-full !rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <ShimmerBlock key={i} className="h-28 !rounded-2xl" />)}
        </div>
        <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Earnings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Track your display earnings and payouts</p>
      </motion.div>

      {/* ─── Hero Earnings Card ─── */}
      <motion.div
        ref={heroRef}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl p-5 sm:p-6 text-white overflow-hidden shadow-xl shadow-emerald-500/20"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600" />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)',
        }} />
        <SparkleParticles />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Sparkles className="w-4 h-4 text-emerald-200" />
            </motion.div>
            <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Today's Earnings</p>
          </div>
          <p className="text-3xl sm:text-4xl font-bold mb-1">
            <AnimatedCounter value={todayEarnings} prefix="Rs " />
          </p>
          <p className="text-emerald-200/60 text-xs mb-4">
            {todayDisplayHours.toFixed(1)}h displayed of {requiredHoursPerDay}h target ({Math.round(dailyPercent)}%)
          </p>

          <div className="flex gap-3">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="bg-white/15 rounded-xl px-3 py-2 backdrop-blur-md border border-white/10 flex-1"
            >
              <p className="text-emerald-100 text-[10px] uppercase tracking-wider">This Month</p>
              <p className="text-lg font-bold">
                <AnimatedCounter value={monthEarnings} prefix="Rs " />
              </p>
            </motion.div>
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="bg-white/15 rounded-xl px-3 py-2 backdrop-blur-md border border-white/10 flex-1"
            >
              <p className="text-emerald-100 text-[10px] uppercase tracking-wider">Contract</p>
              <p className="text-lg font-bold">
                <AnimatedCounter value={contractRate} prefix="Rs " />
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ─── Monthly Progress Ring Card ─── */}
      <TiltCard
        delay={0.15}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            Monthly Progress
          </h2>
        </div>
        <div ref={ringRef} className="p-5 flex flex-col sm:flex-row items-center gap-5">
          <MonthlyProgressRing
            percent={monthPercent}
            monthEarnings={monthEarnings}
            contractRate={contractRate}
            inView={ringInView}
          />
          <div className="flex-1 space-y-3 w-full">
            <div className="flex items-center justify-between bg-slate-50/80 dark:bg-slate-700/30 rounded-xl px-3 py-2.5">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Earned</p>
                <p className="text-base font-bold text-slate-800 dark:text-white">Rs {fmt(monthEarnings)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              <div className="text-right">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Target</p>
                <p className="text-base font-bold text-slate-800 dark:text-white">Rs {fmt(contractRate)}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={ringInView ? { width: `${Math.min(monthPercent, 100)}%` } : {}}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{monthDisplayHours.toFixed(1)}h displayed</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{(requiredHoursPerDay * 30).toFixed(0)}h total target</span>
              </div>
            </div>
          </div>
        </div>
      </TiltCard>

      {/* ─── Daily Earnings Chart ─── */}
      <motion.div
        ref={chartRef}
        initial={{ opacity: 0, y: 30 }}
        animate={chartInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Last 7 Days
          </h2>
        </div>
        <div className="p-4">
          <div className="flex items-end gap-2 h-36">
            {chartData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center relative group">
                {/* Tooltip */}
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-600 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg z-10">
                  Rs {fmt(val)}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 bg-slate-800 dark:bg-slate-600 rotate-45" />
                </div>
                <motion.div
                  className="w-full rounded-t-lg relative overflow-hidden cursor-pointer min-h-[4px]"
                  initial={{ height: 0 }}
                  animate={chartInView ? { height: `${(val / maxChart) * 100}%` } : { height: 0 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ maxHeight: '100%' }}
                >
                  <div className={`absolute inset-0 ${
                    i === 6
                      ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-t from-blue-500/70 to-blue-400/70'
                  }`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-emerald-400/40 blur-sm" />
                </motion.div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {dayLabels.map((d, i) => (
              <span key={i} className={`flex-1 text-center ${i === 6 ? 'text-emerald-500 font-bold' : ''}`}>
                {i === 6 ? 'Today' : d}
              </span>
            ))}
          </div>
          {/* Daily rate line */}
          <div className="mt-2 text-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Daily target: Rs {fmt(dailyRate)}</span>
          </div>
        </div>
      </motion.div>

      {/* ─── Payment Info Card ─── */}
      <TiltCard
        delay={0.2}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-500" />
            Payment Info
          </h2>
        </div>
        <div className="p-4 space-y-3">
          {[
            { icon: Banknote, label: 'Contract Rate', value: `Rs ${fmt(contractRate)}/month`, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
            { icon: Wallet, label: 'Estimated Payout', value: `Rs ${fmt(estimatedPayout)}`, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
            { icon: Calendar, label: 'Payment Due', value: getEndOfMonth(), color: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400' },
            { icon: Clock, label: 'Days Remaining', value: `${daysRemaining} days`, color: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
              className="flex items-center gap-3 p-3 bg-slate-50/80 dark:bg-slate-700/30 rounded-xl backdrop-blur-sm"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                <item.icon className={`w-4 h-4 ${item.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">{item.label}</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </TiltCard>

      {/* ─── Hours Breakdown Card ─── */}
      <motion.div
        ref={hoursRef}
        initial={{ opacity: 0, y: 30 }}
        animate={hoursInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-500" />
            Hours Breakdown
          </h2>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-6">
            {/* Today's hours circle */}
            <div className="flex flex-col items-center">
              <HoursCircle hours={todayDisplayHours} required={requiredHoursPerDay} inView={hoursInView} />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">Today</p>
            </div>
            {/* Stats next to circle */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Today's Progress</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{Math.round(dailyPercent)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={hoursInView ? { width: `${dailyPercent}%` } : {}}
                    transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50/80 dark:bg-slate-700/30 rounded-lg p-2.5">
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Displayed</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{todayDisplayHours.toFixed(1)}h</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-700/30 rounded-lg p-2.5">
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Remaining</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{Math.max(requiredHoursPerDay - todayDisplayHours, 0).toFixed(1)}h</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50/80 dark:bg-slate-700/30 rounded-lg p-2.5">
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Month Hours</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{monthDisplayHours.toFixed(1)}h</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-700/30 rounded-lg p-2.5">
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Earning/hr</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Rs {fmt(requiredHoursPerDay > 0 ? dailyRate / requiredHoursPerDay : 0)}</p>
                </div>
              </div>
            </div>
          </div>
          {/* Full target completion badge */}
          {dailyPercent >= 100 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2 border border-emerald-200/50 dark:border-emerald-700/30"
            >
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Award className="w-5 h-5 text-emerald-500" />
              </motion.div>
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Daily target complete!</p>
                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70">You have earned the full daily rate of Rs {fmt(dailyRate)}</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

export default DriverEarnings
