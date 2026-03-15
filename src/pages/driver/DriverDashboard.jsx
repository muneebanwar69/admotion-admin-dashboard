import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Car, Wallet, Clock, Activity, TrendingUp, Zap, Eye, Sun, Moon, CloudSun, Radio, Wifi, WifiOff, Target, Award } from 'lucide-react'
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { useDriverAuth } from '../../contexts/DriverAuthContext'

/* ─── Helpers ─── */
const fmt = (n) => Math.round(n).toLocaleString()

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Good Morning', icon: Sun }
  if (hour < 17) return { text: 'Good Afternoon', icon: CloudSun }
  return { text: 'Good Evening', icon: Moon }
}

/* Smooth animated counter with easing */
const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const target = parseFloat(value) || 0
    if (target === 0) { setDisplay(0); return }
    const duration = 1200
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

/* Floating decorative particles */
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: 4 + (i % 3) * 2,
          height: 4 + (i % 3) * 2,
          left: `${15 + i * 14}%`,
          top: `${20 + (i % 2) * 50}%`,
          background: i % 2 === 0 ? 'rgba(245,158,11,0.25)' : 'rgba(59,130,246,0.2)',
        }}
        animate={{
          y: [0, -12, 0, 12, 0],
          x: [0, 6, 0, -6, 0],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.5 }}
      />
    ))}
  </div>
)

/* Shimmer skeleton loader */
const ShimmerCard = () => (
  <div className="rounded-2xl p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 overflow-hidden relative">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 animate-pulse" />
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse" />
      </div>
    </div>
  </div>
)

/* ─── Earnings Progress Ring (SVG) ─── */
const EarningsRing = ({ percent, todayEarnings, dailyRate, inView }) => {
  const size = 180
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const capped = Math.min(percent, 100)
  const offset = circumference - (capped / 100) * circumference

  // color based on progress
  const ringColor = capped >= 100 ? '#10b981' : capped >= 60 ? '#3b82f6' : '#f59e0b'

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
          {/* Background track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="currentColor" strokeWidth={stroke}
            className="text-white/10"
          />
          {/* Glow behind progress */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={ringColor} strokeWidth={stroke + 6} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={inView ? { strokeDashoffset: offset } : {}}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            opacity={0.2}
            style={{ filter: 'blur(6px)' }}
          />
          {/* Main progress arc */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={ringColor} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={inView ? { strokeDashoffset: offset } : {}}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center"
          >
            <p className="text-[10px] uppercase tracking-wider text-white/50 font-medium">Earned Today</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              <AnimatedCounter value={todayEarnings} prefix="Rs " />
            </p>
            <p className="text-[10px] text-white/40 mt-0.5">of Rs {fmt(dailyRate)}</p>
          </motion.div>
        </div>
      </div>
      {/* Percentage label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.8 }}
        className="mt-2 flex items-center gap-1.5"
      >
        <Target className="w-3.5 h-3.5 text-amber-300" />
        <span className="text-sm font-semibold text-white/80">{Math.round(capped)}% of daily target</span>
        {capped >= 100 && (
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Award className="w-4 h-4 text-emerald-400" />
          </motion.span>
        )}
      </motion.div>
    </div>
  )
}

/* 3D Tilt stat card */
const StatCard = ({ icon: Icon, label, value, prefix, suffix, color, delay = 0, decimals = 0, subtext, children }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
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
      whileTap={{ scale: 0.97 }}
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/40 dark:border-slate-700/50 cursor-default group"
    >
      <div className="flex items-center gap-3">
        <motion.div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} shadow-lg`}
          animate={inView ? { scale: [0.5, 1.15, 1] } : {}}
          transition={{ delay: delay + 0.2, duration: 0.5 }}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-slate-800 dark:text-white">
            {inView ? <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} /> : `${prefix || ''}0${suffix || ''}`}
          </p>
          {subtext && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{subtext}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  )
}

/* ─── Main Component ─── */
const DriverDashboard = () => {
  const { driver } = useDriverAuth()
  const [vehicle, setVehicle] = useState(null)
  const [currentAds, setCurrentAds] = useState([])
  const [vehicleOnline, setVehicleOnline] = useState(false)
  const [loading, setLoading] = useState(true)

  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  const heroRef = useRef(null)
  const heroInView = useInView(heroRef, { once: true, margin: '-20px' })
  const vehicleRef = useRef(null)
  const vehicleInView = useInView(vehicleRef, { once: true, margin: '-30px' })
  const adsRef = useRef(null)
  const adsInView = useInView(adsRef, { once: true, margin: '-30px' })
  const progressRef = useRef(null)
  const progressInView = useInView(progressRef, { once: true, margin: '-30px' })

  // ── Compute earnings from vehicle doc fields ──
  const contractRate = vehicle?.contractRate || 0
  const requiredHoursPerDay = vehicle?.requiredHoursPerDay || 8
  const todayDisplayHours = vehicle?.todayDisplayHours || 0
  const monthDisplayHours = vehicle?.monthDisplayHours || 0

  const dailyRate = contractRate / 30
  const todayEarnings = Math.min(todayDisplayHours / requiredHoursPerDay, 1) * dailyRate
  const monthEarnings = Math.min((monthDisplayHours / (requiredHoursPerDay * 30)) * contractRate, contractRate)
  const dailyProgressPercent = Math.min((todayDisplayHours / requiredHoursPerDay) * 100, 100)

  // ── Listen to vehicle doc (driver.uid = vehicle doc id) ──
  useEffect(() => {
    if (!driver?.uid) { setLoading(false); return }
    const unsub = onSnapshot(doc(db, 'vehicles', driver.uid), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setVehicle(data)
        const lastSeen = data.lastSeen?.toDate?.()
        const isFresh = lastSeen && (Date.now() - lastSeen.getTime()) < 2 * 60 * 1000
        setVehicleOnline(data.status === 'Active' && isFresh !== false)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [driver?.uid])

  // ── Listen to current ads ──
  useEffect(() => {
    if (!driver?.uid) return
    const q = query(
      collection(db, 'assignments'),
      where('vehicleId', '==', driver.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      setCurrentAds(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [driver?.uid])

  // Progress bar milestone markers
  const milestones = [25, 50, 75, 100]

  return (
    <div className="space-y-5">
      {/* ─── Hero Greeting Card with Earnings Ring ─── */}
      <motion.div
        ref={heroRef}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl p-5 sm:p-6 text-white overflow-hidden shadow-xl"
      >
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-[#1a237e]" />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 20% 80%, rgba(245,158,11,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.12) 0%, transparent 50%), radial-gradient(circle at 60% 60%, rgba(20,184,166,0.08) 0%, transparent 50%)',
        }} />
        <FloatingParticles />

        <div className="relative z-10">
          <motion.div
            className="flex items-center gap-2 mb-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <GreetingIcon className="w-5 h-5 text-amber-300" />
            </motion.div>
            <span className="text-amber-300/80 text-sm font-medium">{greeting.text}</span>
          </motion.div>
          <motion.h1
            className="text-2xl sm:text-3xl font-bold mb-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {driver?.name || 'Driver'}
          </motion.h1>
          <motion.div
            className="flex items-center gap-3 text-white/50 text-sm mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {driver?.assignedVehiclePlate && (
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <Car className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-amber-200/80">{driver.assignedVehiclePlate}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              {vehicleOnline ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-emerald-400">Screen Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400">Screen Offline</span>
                </>
              )}
            </span>
          </motion.div>

          {/* Earnings Ring */}
          <EarningsRing
            percent={dailyProgressPercent}
            todayEarnings={todayEarnings}
            dailyRate={dailyRate}
            inView={heroInView}
          />
        </div>
      </motion.div>

      {/* ─── Stats Grid (2x2) ─── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <ShimmerCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Wallet}
            label="Today's Earnings"
            value={todayEarnings}
            prefix="Rs "
            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
            delay={0.1}
            subtext={`${todayDisplayHours.toFixed(1)}h of ${requiredHoursPerDay}h displayed`}
          />
          <StatCard
            icon={TrendingUp}
            label="Monthly Earnings"
            value={monthEarnings}
            prefix="Rs "
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            delay={0.15}
            subtext={`${monthDisplayHours.toFixed(1)}h this month`}
          />
          <StatCard
            icon={Eye}
            label="Display Hours Today"
            value={todayDisplayHours}
            suffix="h"
            decimals={1}
            color="bg-gradient-to-br from-violet-500 to-violet-600"
            delay={0.2}
            subtext={`Target: ${requiredHoursPerDay}h`}
          >
            {/* Mini progress bar inside card */}
            <div className="mt-2.5">
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((todayDisplayHours / requiredHoursPerDay) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          </StatCard>
          <StatCard
            icon={Award}
            label="Contract Rate"
            value={contractRate}
            prefix="Rs "
            suffix="/mo"
            color="bg-gradient-to-br from-amber-500 to-amber-600"
            delay={0.25}
            subtext={`Rs ${fmt(dailyRate)}/day`}
          />
        </div>
      )}

      {/* ─── Daily Progress Section ─── */}
      <motion.div
        ref={progressRef}
        initial={{ opacity: 0, y: 30 }}
        animate={progressInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            Daily Display Progress
          </h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {todayDisplayHours.toFixed(1)}h / {requiredHoursPerDay}h
          </span>
        </div>
        <div className="p-4 space-y-3">
          {/* Progress bar with milestones */}
          <div className="relative">
            <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden relative">
              <motion.div
                className="h-full rounded-full relative"
                style={{
                  background: dailyProgressPercent >= 100
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : dailyProgressPercent >= 60
                    ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                    : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                }}
                initial={{ width: 0 }}
                animate={progressInView ? { width: `${Math.min(dailyProgressPercent, 100)}%` } : {}}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              >
                {/* Shimmer effect on bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2s_infinite]" />
              </motion.div>
            </div>
            {/* Milestone markers */}
            <div className="absolute inset-0 flex items-center pointer-events-none">
              {milestones.map(m => (
                <div
                  key={m}
                  className="absolute top-0 bottom-0 flex items-center"
                  style={{ left: `${m}%`, transform: 'translateX(-50%)' }}
                >
                  <div className={`w-0.5 h-5 rounded-full ${
                    dailyProgressPercent >= m
                      ? 'bg-white/60'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`} />
                </div>
              ))}
            </div>
          </div>
          {/* Milestone labels */}
          <div className="flex justify-between px-1">
            {milestones.map(m => {
              const hrs = (m / 100) * requiredHoursPerDay
              return (
                <span
                  key={m}
                  className={`text-[10px] font-medium ${
                    dailyProgressPercent >= m
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {hrs}h
                </span>
              )
            })}
          </div>
          {/* Earning status text */}
          <div className="flex items-center justify-between bg-slate-50/80 dark:bg-slate-700/30 rounded-xl px-3 py-2.5">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Earnings rate</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Rs {fmt(dailyRate)} / {requiredHoursPerDay}h
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Remaining</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                {Math.max(requiredHoursPerDay - todayDisplayHours, 0).toFixed(1)}h to go
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Vehicle Status Card ─── */}
      <motion.div
        ref={vehicleRef}
        initial={{ opacity: 0, y: 30 }}
        animate={vehicleInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-500" />
            Vehicle Status
          </h2>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            vehicleOnline
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {vehicleOnline ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
            {vehicleOnline ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="p-4">
          {vehicle ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Vehicle', value: vehicle.vehicleName || 'N/A' },
                { label: 'Plate', value: vehicle.plateNumber || driver?.assignedVehiclePlate || 'N/A' },
                { label: 'Total Online', value: `${(vehicle.totalHoursOnline || 0).toFixed(1)}h` },
                { label: 'Screen', value: vehicle.displayDevice?.screenResolution || 'Standard' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={vehicleInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="bg-slate-50/80 dark:bg-slate-700/30 rounded-xl p-3 backdrop-blur-sm"
                >
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                  <p className="font-semibold text-sm text-slate-800 dark:text-white">{item.value}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 dark:text-slate-500">
              <Car className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No vehicle assigned yet</p>
              <p className="text-xs mt-1">Contact admin to get assigned</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Current Ads (Staggered slide-in) ─── */}
      <motion.div
        ref={adsRef}
        initial={{ opacity: 0, y: 30 }}
        animate={adsInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Zap className="w-4 h-4 text-amber-500" />
            </motion.div>
            Now Playing on Screen
          </h2>
        </div>
        <div className="p-4">
          {currentAds.length > 0 ? (
            <div className="space-y-2.5">
              {currentAds.slice(0, 5).map((ad, i) => (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={adsInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 p-3 bg-slate-50/80 dark:bg-slate-700/30 rounded-xl backdrop-blur-sm hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors cursor-default"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {ad.thumbnail || ad.mediaUrl ? (
                      <img src={ad.thumbnail || ad.mediaUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Activity className="w-5 h-5 text-blue-500/60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{ad.adTitle || ad.title || 'Ad Campaign'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{ad.advertiser || 'Advertiser'}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      Live
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 dark:text-slate-500">
              <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No ads currently scheduled</p>
              <p className="text-xs mt-1">Ads will appear here when assigned</p>
            </div>
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

export default DriverDashboard
