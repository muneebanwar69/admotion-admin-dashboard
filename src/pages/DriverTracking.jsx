// src/pages/DriverTracking.jsx
// Admin view: track every driver's ad PLAY HISTORY and EARNINGS in real time.
// Reads `vehicles` (earnings/hours), `ads` (titles), and `impressions` (plays)
// live via Firestore onSnapshot.
import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import RealTimeIndicator from '../components/ui/RealTimeIndicator'
import {
  DollarSign, Users, PlayCircle, Eye, Search, Truck, Layers, Clock,
  CheckCircle, AlertTriangle, MapPin, CloudSun, TrendingUp, History
} from 'lucide-react'

const formatPKR = (amount) => `Rs ${Math.round(amount || 0).toLocaleString()}`

const tsToMillis = (imp) => {
  if (imp.timestamp?.toMillis) return imp.timestamp.toMillis()
  if (imp.recordedAt) return Date.parse(imp.recordedAt)
  if (imp.date) return Date.parse(imp.date)
  return 0
}
const fmtAgo = (ms) => {
  if (!ms) return '--'
  const diff = Date.now() - ms
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(ms).toLocaleDateString()
}
const fmtTime = (ms) => ms ? new Date(ms).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--'

export default function DriverTracking() {
  const [vehicles, setVehicles] = useState([])
  const [ads, setAds] = useState([])
  const [impressions, setImpressions] = useState([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('earnings') // 'earnings' | 'history'

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'vehicles'), s => setVehicles(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {})
    const u2 = onSnapshot(collection(db, 'ads'), s => setAds(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {})
    const u3 = onSnapshot(collection(db, 'impressions'), s => {
      const rows = s.docs.map(d => ({ id: d.id, ...d.data() }))
      rows.sort((a, b) => tsToMillis(b) - tsToMillis(a))
      setImpressions(rows.slice(0, 300))
    }, () => {})
    return () => { u1(); u2(); u3() }
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const dayOfMonth = new Date().getDate()

  const adTitleById = useMemo(() => {
    const m = {}; ads.forEach(a => { m[a.id] = a.title || a.adId || a.id }); return m
  }, [ads])
  const vehicleById = useMemo(() => {
    const m = {}; vehicles.forEach(v => { m[v.id] = v }); return m
  }, [vehicles])

  // ---- Per-driver earnings (same model as the driver portal) ----
  const drivers = useMemo(() => vehicles.map(v => {
    const contractRate = v.contractRate || 0
    const requiredHours = v.requiredHoursPerDay || 8
    const todayHours = (v.lastEarningsDate === today ? v.todayDisplayHours : 0) || 0
    const monthHours = (v.earningsMonth === currentMonth ? v.monthDisplayHours : 0) || 0
    const dailyRate = contractRate / 30
    const dailyProgress = requiredHours > 0 ? Math.min(todayHours / requiredHours, 1) : 0
    const todayEarnings = dailyProgress * dailyRate
    const monthEarnings = Math.min((monthHours / (requiredHours * 30)) * contractRate, contractRate)
    return {
      id: v.id,
      ownerName: v.ownerName || 'Unknown',
      carId: v.carId || v.id,
      vehicleName: v.vehicleName || 'N/A',
      city: v.location?.address || v.location?.city || '',
      contractRate, requiredHours, todayHours, monthHours,
      todayEarnings, monthEarnings, dailyProgress,
      onTrack: dailyProgress >= 1,
    }
  }), [vehicles, today, currentMonth])

  const filteredDrivers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return drivers
    return drivers.filter(d =>
      d.ownerName.toLowerCase().includes(q) ||
      d.carId.toLowerCase().includes(q) ||
      d.vehicleName.toLowerCase().includes(q))
  }, [drivers, search])

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return impressions
    return impressions.filter(imp => {
      const v = vehicleById[imp.vehicleId]
      const name = (v?.ownerName || '').toLowerCase()
      const car = (v?.carId || '').toLowerCase()
      const ad = (adTitleById[imp.adId] || '').toLowerCase()
      return name.includes(q) || car.includes(q) || ad.includes(q)
    })
  }, [impressions, search, vehicleById, adTitleById])

  // ---- KPIs ----
  const totalMonthEarned = drivers.reduce((s, d) => s + d.monthEarnings, 0)
  const totalObligation = drivers.reduce((s, d) => s + d.contractRate, 0)
  const playsToday = impressions.filter(i => i.date === today).length
  const reachToday = impressions.filter(i => i.date === today)
    .reduce((s, i) => s + (i.estimatedReach || 0), 0)

  const kpis = [
    { label: 'Active Drivers', value: drivers.length, icon: Users, from: 'from-blue-500', to: 'to-indigo-600' },
    { label: 'Earned This Month', value: formatPKR(totalMonthEarned), icon: DollarSign, from: 'from-emerald-500', to: 'to-teal-600' },
    { label: 'Plays Today', value: playsToday.toLocaleString(), icon: PlayCircle, from: 'from-fuchsia-500', to: 'to-purple-600' },
    { label: 'Est. Reach Today', value: Math.round(reachToday).toLocaleString(), icon: Eye, from: 'from-amber-500', to: 'to-orange-600' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 rounded-2xl shadow-xl mb-6 flex flex-wrap items-center justify-between gap-3 border border-white/10">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-amber-300" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Driver Tracking</h1>
            <p className="text-white/60 text-xs">Live play history &amp; earnings across the fleet</p>
          </div>
        </div>
        <RealTimeIndicator isActive={true} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 overflow-hidden">
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${k.from} ${k.to} opacity-10`} />
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.from} ${k.to} flex items-center justify-center shadow-lg mb-3`}>
              <k.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">{k.label}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{k.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Controls: tabs + search */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2">
          <button onClick={() => setTab('earnings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'earnings' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
            <DollarSign className="w-4 h-4" /> Earnings
          </button>
          <button onClick={() => setTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'history' ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
            <History className="w-4 h-4" /> Play History
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search driver, car or ad…"
            className="pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-amber-400 w-full sm:w-64" />
        </div>
      </div>

      {/* ---- Earnings tab ---- */}
      {tab === 'earnings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500" /> Driver Earnings</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Obligation: {formatPKR(totalObligation)}/mo</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40">
                  <th className="px-5 py-3 font-semibold">Driver</th>
                  <th className="px-5 py-3 font-semibold">Contract</th>
                  <th className="px-5 py-3 font-semibold">Today (hrs)</th>
                  <th className="px-5 py-3 font-semibold">Today Earnings</th>
                  <th className="px-5 py-3 font-semibold">Month Earnings</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredDrivers.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No drivers found</td></tr>
                ) : filteredDrivers.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-100">{d.ownerName}</div>
                          <div className="text-xs text-slate-400">{d.carId} · {d.vehicleName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatPKR(d.contractRate)}<span className="text-xs text-slate-400">/mo</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${d.onTrack ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${d.dailyProgress * 100}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{d.todayHours.toFixed(1)}/{d.requiredHours}h</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">{formatPKR(d.todayEarnings)}</td>
                    <td className="px-5 py-3 font-bold text-emerald-600 dark:text-emerald-400">{formatPKR(d.monthEarnings)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${d.onTrack ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {d.onTrack ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {d.onTrack ? 'On Track' : 'Behind'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ---- Play history tab ---- */}
      {tab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><History className="w-4 h-4 text-fuchsia-500" /> Live Play History</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{filteredHistory.length} play{filteredHistory.length === 1 ? '' : 's'}</span>
          </div>
          {filteredHistory.length === 0 ? (
            <div className="p-10 text-center">
              <PlayCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No plays recorded yet</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Plays appear here in real time once a vehicle display starts showing ads.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80 backdrop-blur">
                    <th className="px-5 py-3 font-semibold">When</th>
                    <th className="px-5 py-3 font-semibold">Driver / Car</th>
                    <th className="px-5 py-3 font-semibold">Ad</th>
                    <th className="px-5 py-3 font-semibold">Location</th>
                    <th className="px-5 py-3 font-semibold">Duration</th>
                    <th className="px-5 py-3 font-semibold">Est. Reach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  <AnimatePresence initial={false}>
                    {filteredHistory.map(imp => {
                      const v = vehicleById[imp.vehicleId]
                      const ms = tsToMillis(imp)
                      return (
                        <motion.tr key={imp.id} initial={{ opacity: 0, backgroundColor: 'rgba(217,70,239,0.08)' }} animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }} transition={{ duration: 0.8 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="text-slate-700 dark:text-slate-200">{fmtAgo(ms)}</div>
                            <div className="text-[11px] text-slate-400">{fmtTime(ms)}</div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-100">{v?.ownerName || 'Unknown'}</div>
                            <div className="text-xs text-slate-400">{v?.carId || imp.vehicleId}</div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="font-medium text-slate-700 dark:text-slate-200">{adTitleById[imp.adId] || imp.adId}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {(imp.city || imp.area) ? (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><MapPin className="w-3 h-3" />{[imp.city, imp.area].filter(Boolean).join(' · ')}</span>
                            ) : <span className="text-xs text-slate-400">—</span>}
                            {imp.weather && <span className="ml-1 inline-flex items-center gap-1 text-xs text-sky-500"><CloudSun className="w-3 h-3" />{imp.weather}</span>}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300"><Clock className="w-3.5 h-3.5 text-slate-400" />{Math.round(imp.duration || 0)}s</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold">
                              <Eye className="w-3.5 h-3.5" />{Math.round(imp.estimatedReach || 0).toLocaleString()}
                            </span>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
