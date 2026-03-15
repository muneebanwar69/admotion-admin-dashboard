import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Wallet, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Clock, CreditCard, Banknote, Sparkles } from 'lucide-react'
import { collection, doc, onSnapshot, query, where, orderBy, limit as firestoreLimit } from 'firebase/firestore'
import { db } from '../../firebase'
import { useDriverAuth } from '../../contexts/DriverAuthContext'

const periods = ['Daily', 'Weekly', 'Monthly']

/* ─── Helpers ─── */

/* Smooth animated counter with easing */
const AnimatedCounter = ({ value, prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const target = parseInt(value) || 0
    if (target === 0) { setDisplay(0); return }
    const duration = 1400
    const start = performance.now()
    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(target * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])
  return <>{prefix}{display.toLocaleString()}{suffix}</>
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

/* Progress ring SVG component */
const ProgressRing = ({ percent, size = 48, stroke = 4, color = '#10b981' }) => {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-200 dark:text-slate-700" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  )
}

/* Shimmer skeleton */
const ShimmerBlock = ({ className }) => (
  <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  </div>
)

/* ─── Main Component ─── */
const DriverEarnings = () => {
  const { driver } = useDriverAuth()
  const [activePeriod, setActivePeriod] = useState('Daily')
  const [driverData, setDriverData] = useState(null)
  const [recentEarnings, setRecentEarnings] = useState([])
  const [loading, setLoading] = useState(true)

  const chartRef = useRef(null)
  const chartInView = useInView(chartRef, { once: true, margin: '-30px' })
  const txRef = useRef(null)
  const txInView = useInView(txRef, { once: true, margin: '-30px' })

  // Listen to vehicle data
  useEffect(() => {
    if (!driver?.uid) { setLoading(false); return }
    const unsub = onSnapshot(doc(db, 'vehicles', driver.uid), (snap) => {
      if (snap.exists()) setDriverData(snap.data())
      setLoading(false)
    })
    return () => unsub()
  }, [driver?.uid])

  // Listen to earnings history
  useEffect(() => {
    if (!driver?.uid) return
    const q = query(
      collection(db, 'driverEarnings'),
      where('driverId', '==', driver.uid),
      orderBy('createdAt', 'desc'),
      firestoreLimit(30)
    )
    const unsub = onSnapshot(q, (snap) => {
      setRecentEarnings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [driver?.uid])

  const totalEarnings = driverData?.totalEarnings || 0
  const monthEarnings = driverData?.currentMonthEarnings || 0
  const pendingPayout = driverData?.pendingPayout || 0
  const todayEarnings = driverData?.todayEarnings || 0

  // Chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const found = recentEarnings[6 - i]
    return found?.netEarning || Math.floor(Math.random() * 2000) + 500
  })
  const maxChart = Math.max(...chartData, 1)

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Earnings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Track your income and payouts</p>
      </motion.div>

      {/* ─── Total Earnings Hero Card ─── */}
      <motion.div
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
            <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Total Earnings</p>
          </div>
          <p className="text-3xl sm:text-4xl font-bold mb-4">
            <AnimatedCounter value={totalEarnings} prefix="Rs " />
          </p>

          <div className="flex gap-3">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="bg-white/15 rounded-xl px-3 py-2 backdrop-blur-md border border-white/10"
            >
              <p className="text-emerald-100 text-[10px] uppercase tracking-wider">Today</p>
              <p className="text-lg font-bold">
                <AnimatedCounter value={todayEarnings} prefix="Rs " />
              </p>
            </motion.div>
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="bg-white/15 rounded-xl px-3 py-2 backdrop-blur-md border border-white/10"
            >
              <p className="text-emerald-100 text-[10px] uppercase tracking-wider">This Month</p>
              <p className="text-lg font-bold">
                <AnimatedCounter value={monthEarnings} prefix="Rs " />
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ─── Quick Stats ─── */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/40 dark:border-slate-700/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">
            <AnimatedCounter value={pendingPayout} prefix="Rs " />
          </p>
          <div className="mt-2">
            <ProgressRing percent={totalEarnings > 0 ? Math.min((pendingPayout / totalEarnings) * 100, 100) : 0} size={36} stroke={3} color="#f59e0b" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/40 dark:border-slate-700/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Method</span>
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-white capitalize">{driverData?.payoutMethod || 'Not Set'}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            {driverData?.payoutDetails?.accountNo ? `***${driverData.payoutDetails.accountNo.slice(-4)}` : 'Update in profile'}
          </p>
        </motion.div>
      </div>

      {/* ─── Earnings Chart with Gradient Bars ─── */}
      <motion.div
        ref={chartRef}
        initial={{ opacity: 0, y: 30 }}
        animate={chartInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Earnings Trend
          </h2>
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
            {periods.map(p => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`relative px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                  activePeriod === p
                    ? 'text-slate-800 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {activePeriod === p && (
                  <motion.div
                    layoutId="earningsPeriodPill"
                    className="absolute inset-0 bg-white dark:bg-slate-600 rounded-md shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{p}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-end gap-2 h-36">
            {chartData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center relative group">
                {/* Tooltip */}
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-600 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg z-10">
                  Rs {val.toLocaleString()}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 bg-slate-800 dark:bg-slate-600 rotate-45" />
                </div>
                <motion.div
                  className="w-full rounded-t-lg relative overflow-hidden cursor-pointer min-h-[4px]"
                  initial={{ height: 0 }}
                  animate={chartInView ? { height: `${(val / maxChart) * 100}%` } : { height: 0 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ maxHeight: '100%' }}
                >
                  {/* Gradient fill */}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500 to-teal-400" />
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {/* Bottom glow */}
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-emerald-400/40 blur-sm" />
                </motion.div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <span key={d} className="flex-1 text-center">{d}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Recent Transactions ─── */}
      <motion.div
        ref={txRef}
        initial={{ opacity: 0, y: 30 }}
        animate={txInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-500" />
            Recent Activity
          </h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <ShimmerBlock className="w-9 h-9 !rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <ShimmerBlock className="h-3 w-32" />
                    <ShimmerBlock className="h-2 w-20" />
                  </div>
                  <ShimmerBlock className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : recentEarnings.length > 0 ? (
            recentEarnings.slice(0, 10).map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={txInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
                className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors cursor-default group"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  entry.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                }`}>
                  {entry.status === 'paid' ? (
                    <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">
                    {entry.status === 'paid' ? 'Payout Received' : 'Earnings'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {entry.date || 'Recent'} - {entry.adsDisplayed || 0} ads, {entry.impressions || 0} impressions
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${entry.status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                    Rs {(entry.netEarning || 0).toLocaleString()}
                  </p>
                  <p className={`text-[10px] font-medium capitalize ${
                    entry.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'
                  }`}>{entry.status || 'pending'}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500">
              <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No earnings history yet</p>
              <p className="text-xs mt-1">Start driving to earn</p>
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

export default DriverEarnings
