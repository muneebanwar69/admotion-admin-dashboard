import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Activity, Truck, Layers, Plus, BarChart3, TrendingUp, Eye, Clock, ArrowRight, Zap, Upload, CalendarClock, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const WidgetCard = ({ title, icon: Icon, color = '#3b82f6', children }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5 }}
    className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-2xl"
  >
    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-80" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
    <div className="p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color }} />
        {title}
      </h3>
      {children}
    </div>
  </motion.div>
)

// Widget 1: Recent Activity
export const RecentActivityWidget = () => {
  const [logs, setLogs] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(10))
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})
    return unsub
  }, [])

  const getIcon = (type) => {
    switch (type) {
      case 'ad': return Layers
      case 'vehicle': return Truck
      case 'campaign': return CalendarClock
      default: return Activity
    }
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    const diff = Math.floor((new Date() - date) / 1000)
    if (diff < 60) return 'now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <WidgetCard title="Recent Activity" icon={Activity} color="#8b5cf6">
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No recent activity</p>
        ) : (
          logs.map(log => {
            const Icon = getIcon(log.type)
            return (
              <div key={log.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                    {log.details?.title || log.action || 'Activity'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {log.userName || 'Admin'} · {formatTime(log.timestamp)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
      <button
        onClick={() => navigate('/alerts')}
        className="w-full flex items-center justify-center gap-1 mt-3 py-2 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
      >
        View All <ArrowRight className="w-3 h-3" />
      </button>
    </WidgetCard>
  )
}

// Widget 2: Fleet Utilization
export const FleetUtilizationWidget = () => {
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vehicles'), (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})
    return unsub
  }, [])

  const isOnline = (v) => {
    if (!v.lastHeartbeat) return false
    const date = v.lastHeartbeat.toDate ? v.lastHeartbeat.toDate() : new Date(v.lastHeartbeat)
    return (new Date() - date) / 1000 < 300
  }

  const onlineCount = vehicles.filter(isOnline).length
  const utilization = vehicles.length > 0 ? Math.round((onlineCount / vehicles.length) * 100) : 0

  // SVG circular progress
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (utilization / 100) * circumference

  return (
    <WidgetCard title="Fleet Utilization" icon={Truck} color="#10b981">
      <div className="flex items-center gap-6">
        {/* Circular Progress */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="transform -rotate-90">
            <circle cx="48" cy="48" r={radius} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="8" />
            <circle
              cx="48" cy="48" r={radius} fill="none" stroke="#10b981" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-slate-700 dark:text-slate-200">{utilization}%</span>
          </div>
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Online</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{onlineCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Offline</span>
            <span className="font-bold text-slate-600 dark:text-slate-300">{vehicles.length - onlineCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Total Fleet</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{vehicles.length}</span>
          </div>
        </div>
      </div>
    </WidgetCard>
  )
}

// Widget 3: Top Performing Ads
export const TopAdsWidget = () => {
  const [ads, setAds] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ads'), (snap) => {
      const allAds = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setAds(allAds.filter(a => a.status === 'Active').sort((a, b) => (b.impressions || 0) - (a.impressions || 0)).slice(0, 5))
    }, () => {})
    return unsub
  }, [])

  const maxImpressions = Math.max(...ads.map(a => a.impressions || 1), 1)

  return (
    <WidgetCard title="Top Performing Ads" icon={TrendingUp} color="#f59e0b">
      <div className="space-y-3">
        {ads.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No active ads</p>
        ) : (
          ads.map((ad, i) => (
            <div key={ad.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 w-4 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{ad.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((ad.impressions || 0) / maxImpressions) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5 flex-shrink-0">
                    <Eye className="w-3 h-3" /> {(ad.impressions || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </WidgetCard>
  )
}

// Widget 4: Quick Actions
export const QuickActionsWidget = () => {
  const navigate = useNavigate()

  const actions = [
    { label: 'Add Vehicle', icon: Truck, route: '/vehicles', color: 'from-blue-500 to-blue-600' },
    { label: 'Upload Ad', icon: Upload, route: '/ads', color: 'from-emerald-500 to-teal-600' },
    { label: 'Run Scheduler', icon: CalendarClock, route: '/scheduling', color: 'from-violet-500 to-purple-600' },
    { label: 'View Reports', icon: BarChart3, route: '/analytics', color: 'from-amber-500 to-orange-600' },
  ]

  return (
    <WidgetCard title="Quick Actions" icon={Zap} color="#ef4444">
      <div className="grid grid-cols-2 gap-2">
        {actions.map(action => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(action.route)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${action.color} text-white shadow-lg transition-shadow hover:shadow-xl`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{action.label}</span>
            </motion.button>
          )
        })}
      </div>
    </WidgetCard>
  )
}

// Widget 5: Driver Earnings
export const DriverEarningsWidget = () => {
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vehicles'), (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})
    return unsub
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const dayOfMonth = new Date().getDate()
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100)

  const driverData = vehicles.map(v => {
    const contractRate = v.contractRate || 0
    const requiredHours = v.requiredHoursPerDay || 8
    const todayHours = (v.lastEarningsDate === today ? v.todayDisplayHours : 0) || 0
    const monthHours = (v.earningsMonth === currentMonth ? v.monthDisplayHours : 0) || 0

    const dailyRate = contractRate / 30
    const dailyProgress = Math.min(todayHours / requiredHours, 1)
    const todayEarnings = dailyProgress * dailyRate

    // Monthly earnings: approximate from monthHours vs expected
    const expectedMonthHours = dayOfMonth * requiredHours
    const monthlyEarningsRatio = expectedMonthHours > 0 ? Math.min(monthHours / expectedMonthHours, 1) : 0
    const monthlyEarnings = monthlyEarningsRatio * dayOfMonth * dailyRate

    const onTrack = dailyProgress >= 1

    return {
      id: v.id,
      ownerName: v.ownerName || 'Unknown',
      carId: v.carId || v.id,
      vehicleName: v.vehicleName || 'N/A',
      contractRate,
      requiredHours,
      todayHours,
      dailyProgress,
      todayEarnings,
      monthlyEarnings,
      onTrack,
    }
  })

  const totalMonthlyObligation = driverData.reduce((sum, d) => sum + d.contractRate, 0)
  const totalMonthlyEarned = driverData.reduce((sum, d) => sum + d.monthlyEarnings, 0)

  const formatPKR = (amount) => `Rs ${Math.round(amount).toLocaleString()}`

  return (
    <WidgetCard title="Driver Earnings" icon={DollarSign} color="#059669">
      {/* Summary Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-5 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/50 dark:border-emerald-700/30">
        <div className="flex-1 min-w-[120px]">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Monthly Obligation</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatPKR(totalMonthlyObligation)}</p>
        </div>
        <div className="flex-1 min-w-[120px]">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Earned This Month</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatPKR(totalMonthlyEarned)}</p>
        </div>
        <div className="flex-1 min-w-[120px]">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Month Progress</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${monthProgress}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{monthProgress}%</span>
          </div>
        </div>
      </div>

      {/* Driver Cards Grid */}
      {driverData.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No vehicles found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
          {driverData.map((driver, i) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
              className="relative rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              {/* Left gradient accent */}
              <div className={`absolute top-0 left-0 bottom-0 w-1 ${driver.onTrack ? 'bg-gradient-to-b from-emerald-400 to-green-500' : 'bg-gradient-to-b from-amber-400 to-orange-500'}`} />

              <div className="p-3 pl-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{driver.ownerName}</p>
                    <p className="text-[10px] text-slate-400">{driver.carId} - {driver.vehicleName}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${driver.onTrack ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {driver.onTrack ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {driver.onTrack ? 'On Track' : 'Behind'}
                  </span>
                </div>

                {/* Contract Rate */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Contract: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatPKR(driver.contractRate)}/month</span>
                </p>

                {/* Today's Hours Progress */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Today: {driver.todayHours.toFixed(1)}h / {driver.requiredHours}h</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{formatPKR(driver.todayEarnings)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(driver.dailyProgress * 100)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className={`h-full rounded-full ${driver.onTrack ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                    />
                  </div>
                </div>

                {/* Monthly Earnings */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 dark:text-slate-400">Monthly Earned</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatPKR(driver.monthlyEarnings)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </WidgetCard>
  )
}
