import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Car, Wallet, Clock, Activity, TrendingUp, Zap, Eye, MapPin, Sun, Moon, CloudSun, Radio, Wifi, WifiOff } from 'lucide-react'
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { useDriverAuth } from '../../contexts/DriverAuthContext'

/* ─── Helpers ─── */
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Good Morning', icon: Sun }
  if (hour < 17) return { text: 'Good Afternoon', icon: CloudSun }
  return { text: 'Good Evening', icon: Moon }
}

/* Smooth animated counter with easing */
const AnimatedCounter = ({ value, prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const target = parseInt(value) || 0
    if (target === 0) { setDisplay(0); return }
    const duration = 1200
    const start = performance.now()
    const from = 0
    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(from + (target - from) * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])
  return <>{prefix}{display.toLocaleString()}{suffix}</>
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

/* 3D Tilt stat card */
const StatCard = ({ icon: Icon, label, value, prefix, suffix, color, delay = 0 }) => {
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
            {inView ? <AnimatedCounter value={value} prefix={prefix} suffix={suffix} /> : `${prefix || ''}0${suffix || ''}`}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main Component ─── */
const DriverDashboard = () => {
  const { driver } = useDriverAuth()
  const [vehicle, setVehicle] = useState(null)
  const [currentAds, setCurrentAds] = useState([])
  const [earnings, setEarnings] = useState({ today: 0, month: 0, pending: 0 })
  const [stats, setStats] = useState({ impressions: 0, hoursOnline: 0, uptime: 0 })
  const [vehicleOnline, setVehicleOnline] = useState(false)
  const [loading, setLoading] = useState(true)

  const greeting = getGreeting()
  const GreetingIcon = greeting.icon
  const vehicleRef = useRef(null)
  const vehicleInView = useInView(vehicleRef, { once: true, margin: '-30px' })
  const adsRef = useRef(null)
  const adsInView = useInView(adsRef, { once: true, margin: '-30px' })

  // Listen to assigned vehicle
  useEffect(() => {
    if (!driver?.assignedVehicleId) { setLoading(false); return }
    const unsub = onSnapshot(doc(db, 'vehicles', driver.assignedVehicleId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setVehicle(data)
        // Check both status field AND lastSeen freshness (within 2 min = heartbeat window)
        const lastSeen = data.lastSeen?.toDate?.()
        const isFresh = lastSeen && (Date.now() - lastSeen.getTime()) < 2 * 60 * 1000
        setVehicleOnline(data.status === 'Active' && isFresh !== false)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [driver?.assignedVehicleId])

  // Listen to vehicle record for earnings/stats
  useEffect(() => {
    if (!driver?.uid) return
    const unsub = onSnapshot(doc(db, 'vehicles', driver.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setEarnings({
          today: data.todayEarnings || 0,
          month: data.currentMonthEarnings || 0,
          pending: data.pendingPayout || 0,
        })
        setStats({
          impressions: data.totalImpressions || 0,
          hoursOnline: data.totalHoursOnline || 0,
          uptime: data.adUptime || 0,
        })
      }
    })
    return () => unsub()
  }, [driver?.uid])

  // Listen to current ads
  useEffect(() => {
    if (!driver?.assignedVehicleId) return
    const q = query(
      collection(db, 'assignments'),
      where('vehicleId', '==', driver.assignedVehicleId)
    )
    const unsub = onSnapshot(q, (snap) => {
      setCurrentAds(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [driver?.assignedVehicleId])

  return (
    <div className="space-y-5">
      {/* ─── Hero Greeting Card ─── */}
      <motion.div
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
            className="flex items-center gap-3 text-white/50 text-sm"
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
        </div>
      </motion.div>

      {/* ─── Stats Grid ─── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <ShimmerCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Wallet} label="Today's Earnings" value={earnings.today} prefix="Rs " color="bg-gradient-to-br from-emerald-500 to-emerald-600" delay={0.1} />
          <StatCard icon={TrendingUp} label="This Month" value={earnings.month} prefix="Rs " color="bg-gradient-to-br from-blue-500 to-blue-600" delay={0.15} />
          <StatCard icon={Eye} label="Impressions" value={stats.impressions} color="bg-gradient-to-br from-violet-500 to-violet-600" delay={0.2} />
          <StatCard icon={Clock} label="Hours Online" value={stats.hoursOnline} suffix="h" color="bg-gradient-to-br from-amber-500 to-amber-600" delay={0.25} />
        </div>
      )}

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
                { label: 'Screen', value: vehicle.displayDevice?.screenResolution || 'Standard' },
                { label: 'Ad Uptime', value: `${stats.uptime}%` },
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

      {/* ─── Pending Payout ─── */}
      {earnings.pending > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="relative rounded-2xl p-4 border border-amber-200/50 dark:border-amber-700/30 overflow-hidden"
        >
          {/* Animated gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20" />
          <div className="absolute inset-0 opacity-40" style={{
            background: 'radial-gradient(circle at 90% 50%, rgba(245,158,11,0.2) 0%, transparent 60%)',
          }} />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider">Pending Payout</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                <AnimatedCounter value={earnings.pending} prefix="Rs " />
              </p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center"
            >
              <Wallet className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </motion.div>
          </div>
        </motion.div>
      )}

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
