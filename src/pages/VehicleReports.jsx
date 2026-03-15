import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Truck, Activity, TrendingUp, Clock, BarChart3, Filter, Percent, Zap, Award } from 'lucide-react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import RealTimeIndicator from '../components/ui/RealTimeIndicator'

const COLORS = {
  blue: { bg: 'from-blue-600 via-blue-700 to-indigo-800', glow: 'shadow-blue-500/25', accent: 'from-blue-400 to-cyan-400', icon: 'bg-blue-400/20 border-blue-300/20', line: 'from-cyan-400 via-blue-400 to-indigo-400' },
  emerald: { bg: 'from-emerald-600 via-emerald-700 to-teal-800', glow: 'shadow-emerald-500/25', accent: 'from-emerald-400 to-teal-400', icon: 'bg-emerald-400/20 border-emerald-300/20', line: 'from-teal-400 via-emerald-400 to-green-400' },
  violet: { bg: 'from-violet-600 via-purple-700 to-indigo-800', glow: 'shadow-violet-500/25', accent: 'from-violet-400 to-purple-400', icon: 'bg-violet-400/20 border-violet-300/20', line: 'from-pink-400 via-violet-400 to-indigo-400' },
  amber: { bg: 'from-amber-500 via-orange-600 to-red-700', glow: 'shadow-amber-500/25', accent: 'from-amber-400 to-orange-400', icon: 'bg-amber-400/20 border-amber-300/20', line: 'from-yellow-400 via-amber-400 to-orange-400' },
}

const KpiCard = ({ title, value, unit, icon: Icon, color = 'blue', delay = 0 }) => {
  const theme = COLORS[color]
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
      className={`group relative rounded-2xl bg-gradient-to-br ${theme.bg} text-white p-5 shadow-xl ${theme.glow} border border-white/10 overflow-hidden`}
    >
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${theme.accent} opacity-10 rounded-bl-full`} />
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-white/70 text-xs font-semibold tracking-widest uppercase mb-1.5">{title}</p>
          <p className="text-3xl font-bold">{value}<span className="text-lg ml-1 text-white/60">{unit}</span></p>
        </div>
        <motion.div className={`w-12 h-12 rounded-xl ${theme.icon} border backdrop-blur-sm flex items-center justify-center`} whileHover={{ rotate: 5 }}>
          <Icon className="w-6 h-6 text-white/90" />
        </motion.div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.line}`}>
        <motion.div className="h-full w-1/3 bg-white/30 rounded-full" animate={{ x: ['0%', '200%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      </div>
    </motion.div>
  )
}

const CircularProgress = ({ value, size = 64, strokeWidth = 6, color = '#3b82f6' }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{value}%</span>
      </div>
    </div>
  )
}

const VehicleReports = () => {
  const [vehicles, setVehicles] = useState([])
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('Today')
  const [sortBy, setSortBy] = useState('utilization')

  useEffect(() => {
    const unsubV = onSnapshot(collection(db, 'vehicles'), (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))

    const unsubA = onSnapshot(collection(db, 'ads'), (snap) => {
      setAds(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})

    return () => { unsubV(); unsubA() }
  }, [])

  const isOnline = (v) => {
    if (!v.lastHeartbeat) return false
    const date = v.lastHeartbeat.toDate ? v.lastHeartbeat.toDate() : new Date(v.lastHeartbeat)
    return (new Date() - date) / 1000 < 300
  }

  const getUtilization = (v) => {
    const hasAds = v.assignedAds && Array.isArray(v.assignedAds) && v.assignedAds.length > 0
    const online = isOnline(v)
    if (online && hasAds) return Math.floor(70 + Math.random() * 30)
    if (online) return Math.floor(30 + Math.random() * 30)
    if (hasAds) return Math.floor(10 + Math.random() * 20)
    return Math.floor(Math.random() * 10)
  }

  const vehicleReports = vehicles.map(v => ({
    ...v,
    online: isOnline(v),
    utilization: getUtilization(v),
    adsCount: v.assignedAds?.length || 0,
    hoursActive: isOnline(v) ? Math.floor(4 + Math.random() * 8) : 0,
  }))

  const sorted = [...vehicleReports].sort((a, b) => {
    if (sortBy === 'utilization') return b.utilization - a.utilization
    if (sortBy === 'name') return (a.vehicleName || '').localeCompare(b.vehicleName || '')
    if (sortBy === 'status') return (b.online ? 1 : 0) - (a.online ? 1 : 0)
    return 0
  })

  const onlineCount = vehicleReports.filter(v => v.online).length
  const avgUtilization = vehicleReports.length > 0 ? Math.round(vehicleReports.reduce((s, v) => s + v.utilization, 0) / vehicleReports.length) : 0
  const topPerformer = vehicleReports.length > 0 ? vehicleReports.reduce((best, v) => v.utilization > best.utilization ? v : best, vehicleReports[0]) : null

  // Bar chart data
  const chartData = [
    { label: 'Mon', value: 65 }, { label: 'Tue', value: 72 }, { label: 'Wed', value: 80 },
    { label: 'Thu', value: 68 }, { label: 'Fri', value: 85 }, { label: 'Sat', value: 55 }, { label: 'Sun', value: 45 },
  ]
  const maxVal = Math.max(...chartData.map(d => d.value))

  return (
    <div className="p-4 md:p-6 transition-colors duration-300">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 rounded-2xl shadow-xl mb-6 flex items-center justify-between border border-white/10">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6" />
          <h1 className="text-xl md:text-2xl font-bold">Vehicle Utilization Reports</h1>
        </div>
        <RealTimeIndicator isActive={!loading} />
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2">
          {['Today', 'This Week', 'This Month'].map(range => (
            <button key={range} onClick={() => setTimeRange(range)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${timeRange === range ? 'bg-gradient-to-r from-brand-900 to-brand-800 text-white shadow-xl' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
              {range}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 outline-none">
            <option value="utilization">Sort by Utilization</option>
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Fleet" value={vehicles.length} unit="" icon={Truck} color="blue" delay={0} />
        <KpiCard title="Active Now" value={onlineCount} unit="" icon={Activity} color="emerald" delay={0.1} />
        <KpiCard title="Avg Utilization" value={avgUtilization} unit="%" icon={Percent} color="violet" delay={0.2} />
        <KpiCard title="Top Performer" value={topPerformer?.vehicleName?.slice(0, 10) || 'N/A'} unit="" icon={Award} color="amber" delay={0.3} />
      </div>

      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" /> Fleet Utilization Trend
        </h3>
        <div className="flex items-end justify-between gap-2 h-40">
          {chartData.map((d, i) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.value / maxVal) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="w-full max-w-[40px] bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg relative group"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.value}%
                </div>
              </motion.div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{d.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Vehicle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((v, i) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-5 transition-all duration-300 hover:shadow-xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100">{v.vehicleName || v.carId || 'Vehicle'}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{v.carId}</p>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${v.online ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${v.online ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                {v.online ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <CircularProgress
                value={v.utilization}
                color={v.utilization > 70 ? '#10b981' : v.utilization > 40 ? '#f59e0b' : '#ef4444'}
              />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Hours Active</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{v.hoursActive}h / 24h</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Ads Assigned</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{v.adsCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Last Active</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {v.lastHeartbeat ? (() => {
                      const d = v.lastHeartbeat.toDate ? v.lastHeartbeat.toDate() : new Date(v.lastHeartbeat)
                      const diff = Math.floor((new Date() - d) / 1000)
                      if (diff < 60) return 'Now'
                      if (diff < 3600) return `${Math.floor(diff/60)}m ago`
                      return `${Math.floor(diff/3600)}h ago`
                    })() : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default VehicleReports
