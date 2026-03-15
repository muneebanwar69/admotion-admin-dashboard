import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Bell, AlertTriangle, Info, CheckCircle, XCircle, Clock, BellRing } from 'lucide-react'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useDriverAuth } from '../../contexts/DriverAuthContext'

/* ─── Alert type configs ─── */
const alertIcons = {
  warning: { icon: AlertTriangle, bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-700/30' },
  error: { icon: XCircle, bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-200/50 dark:border-red-700/30' },
  info: { icon: Info, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200/50 dark:border-blue-700/30' },
  success: { icon: CheckCircle, bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-700/30' },
}

/* Animated bell that shakes when there are unread alerts */
const ShakingBell = ({ hasUnread }) => (
  <motion.div
    animate={hasUnread ? {
      rotate: [0, 15, -15, 10, -10, 5, 0],
    } : {}}
    transition={hasUnread ? {
      duration: 0.8,
      repeat: Infinity,
      repeatDelay: 3,
    } : {}}
    className="relative"
  >
    {hasUnread ? (
      <BellRing className="w-6 h-6 text-amber-500" />
    ) : (
      <Bell className="w-6 h-6 text-slate-400 dark:text-slate-500" />
    )}
    {hasUnread && (
      <motion.span
        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    )}
  </motion.div>
)

/* Shimmer skeleton */
const ShimmerCard = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden relative">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse" />
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse" />
      </div>
    </div>
  </div>
)

/* ─── Main Component ─── */
const DriverAlerts = () => {
  const { driver } = useDriverAuth()
  const [alerts, setAlerts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const listRef = useRef(null)
  const listInView = useInView(listRef, { once: true, margin: '-20px' })

  useEffect(() => {
    if (!driver?.uid) { setLoading(false); return }

    const q = query(
      collection(db, 'driverAlerts'),
      where('driverId', 'in', [driver.uid, 'all']),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => {
      setLoading(false)
    })

    return () => unsub()
  }, [driver?.uid])

  const filteredAlerts = filter === 'all'
    ? alerts
    : filter === 'unread'
    ? alerts.filter(a => !a.read)
    : alerts.filter(a => a.type === filter)

  const unreadCount = alerts.filter(a => !a.read).length

  const markAsRead = async (alertId) => {
    try {
      await updateDoc(doc(db, 'driverAlerts', alertId), { read: true })
    } catch (e) { /* silent */ }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now'
    const date = timestamp.toDate?.() || new Date(timestamp)
    const diff = Date.now() - date.getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'warning', label: 'Warnings' },
    { key: 'info', label: 'Info' },
    { key: 'error', label: 'Critical' },
  ]

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <ShakingBell hasUnread={unreadCount > 0} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Alerts
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-500/30"
                >
                  {unreadCount}
                </motion.span>
              )}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Stay updated on important notifications</p>
          </div>
        </div>
      </motion.div>

      {/* ─── Filter Bar with animated pill ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
      >
        {filterOptions.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 touch-manipulation ${
              filter === f.key
                ? 'text-blue-700 dark:text-blue-300'
                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-600'
            }`}
          >
            {filter === f.key && (
              <motion.div
                layoutId="alertFilterPill"
                className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 rounded-lg"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1">
              {f.label}
              {f.key === 'unread' && unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px]">
                  {unreadCount}
                </span>
              )}
            </span>
          </button>
        ))}
      </motion.div>

      {/* ─── Alerts List ─── */}
      <div ref={listRef} className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div key="loading" className="space-y-3">
              {[1, 2, 3].map(i => <ShimmerCard key={i} />)}
            </motion.div>
          ) : filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert, i) => {
              const config = alertIcons[alert.type] || alertIcons.info
              const Icon = config.icon
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -40 }}
                  animate={listInView ? { opacity: 1, x: 0 } : {}}
                  exit={{ opacity: 0, x: 40, scale: 0.95 }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !alert.read && markAsRead(alert.id)}
                  className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border transition-all duration-300 cursor-pointer hover:shadow-lg group ${
                    alert.read
                      ? 'border-slate-100 dark:border-slate-700/50 opacity-70'
                      : `${config.border} bg-gradient-to-r from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-800/80`
                  }`}
                >
                  <div className="flex gap-3">
                    <motion.div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Icon className={`w-5 h-5 ${config.text}`} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm text-slate-800 dark:text-white ${!alert.read ? 'font-semibold' : 'font-medium'}`}>
                          {alert.title || 'Notification'}
                        </p>
                        {!alert.read && (
                          <motion.span
                            className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5 shadow-lg shadow-blue-500/30"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {alert.message || alert.description || ''}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(alert.createdAt)}
                      </p>
                    </div>
                    {/* Swipe hint arrow */}
                    <div className="flex items-center opacity-0 group-hover:opacity-40 transition-opacity self-center">
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-slate-400"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Bell className="w-14 h-14 mx-auto text-slate-200 dark:text-slate-700 mb-3" />
              </motion.div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No alerts</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                {filter !== 'all' ? 'Try a different filter' : 'You\'re all caught up!'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

export default DriverAlerts
