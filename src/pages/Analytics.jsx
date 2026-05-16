import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Monitor, Truck, TrendingUp, MapPin, Activity, Eye, Target,
  BarChart3, FileDown, Users, Brain, CloudSun
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { db } from '../firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import RealTimeIndicator from '../components/ui/RealTimeIndicator'
import { getAnalytics } from '../services/analyticsService'

// Animated counter for KPI values
const AnimatedValue = ({ value }) => {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const target = parseInt(value) || 0
    if (target === 0) { setDisplay(0); return }
    let start = 0
    const inc = target / 90
    const timer = setInterval(() => {
      start += inc
      if (start >= target) { setDisplay(target); clearInterval(timer) }
      else setDisplay(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [value])
  return <>{display.toLocaleString()}</>
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']

// Card shell shared by every chart
const ChartCard = ({ title, icon: Icon, color, delay = 0, children, accent }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="group bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-2xl relative overflow-hidden"
  >
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent} opacity-80`} />
    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
      <Icon className="w-4 h-4" style={{ color }} />
      {title}
    </h3>
    {children}
  </motion.div>
)

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900/95 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-white/10">
      <p className="font-semibold mb-0.5">{label}</p>
      <p className="text-amber-300">{Number(payload[0].value).toLocaleString()} est. reach</p>
    </div>
  )
}

const EmptyChart = ({ msg }) => (
  <div className="h-[220px] flex flex-col items-center justify-center text-center">
    <Brain className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
    <p className="text-sm text-slate-400 dark:text-slate-500">{msg}</p>
    <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Data appears as vehicles play ads.</p>
  </div>
)

const ANALYTICS_COLORS = {
  blue: { bg: 'from-blue-600 via-blue-700 to-indigo-800', glow: 'shadow-blue-500/25', accent: 'from-blue-400 to-cyan-400', icon: 'bg-blue-400/20 border-blue-300/20', line: 'from-cyan-400 via-blue-400 to-indigo-400' },
  emerald: { bg: 'from-emerald-600 via-emerald-700 to-teal-800', glow: 'shadow-emerald-500/25', accent: 'from-emerald-400 to-teal-400', icon: 'bg-emerald-400/20 border-emerald-300/20', line: 'from-teal-400 via-emerald-400 to-green-400' },
  violet: { bg: 'from-violet-600 via-purple-700 to-indigo-800', glow: 'shadow-violet-500/25', accent: 'from-violet-400 to-purple-400', icon: 'bg-violet-400/20 border-violet-300/20', line: 'from-pink-400 via-violet-400 to-indigo-400' },
  amber: { bg: 'from-amber-500 via-orange-600 to-red-700', glow: 'shadow-amber-500/25', accent: 'from-amber-400 to-orange-400', icon: 'bg-amber-400/20 border-amber-300/20', line: 'from-yellow-400 via-amber-400 to-orange-400' },
}

const AnalyticsKpiCard = ({ title, value, icon: Icon, index = 0, color = 'blue', suffix }) => {
  const theme = ANALYTICS_COLORS[color] || ANALYTICS_COLORS.blue
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
      className={`group relative rounded-2xl bg-gradient-to-br ${theme.bg} text-white p-5 shadow-xl ${theme.glow} border border-white/10 overflow-hidden`}
    >
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${theme.accent} opacity-10 rounded-bl-full group-hover:opacity-20 transition-opacity duration-300`} />
      <div className='flex items-center justify-between relative z-10'>
        <div>
          <p className='text-white/70 text-xs font-semibold tracking-widest uppercase mb-1.5'>{title}</p>
          <p className='text-3xl font-bold'><AnimatedValue value={value} />{suffix}</p>
        </div>
        <motion.div
          className={`w-12 h-12 rounded-xl ${theme.icon} border backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-all duration-300`}
          whileHover={{ rotate: 5 }}
        >
          <Icon className='w-6 h-6 text-white/90' />
        </motion.div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.line}`}>
        <motion.div
          className="h-full w-1/3 bg-white/30 rounded-full"
          animate={{ x: ['0%', '200%', '0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  )
}

const Analytics = () => {
  const [ads, setAds] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('Today')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Live ads + vehicles (for KPI counts and ad-title lookup)
  useEffect(() => {
    const unsubAds = onSnapshot(query(collection(db, 'ads')), (snap) => {
      setAds(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    const unsubVeh = onSnapshot(query(collection(db, 'vehicles')), (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { unsubAds(); unsubVeh() }
  }, [])

  // Aggregated real impression analytics, refetched on period change
  useEffect(() => {
    let cancelled = false
    setStatsLoading(true)
    getAnalytics(selectedPeriod).then((res) => {
      if (!cancelled) { setStats(res); setStatsLoading(false) }
    })
    return () => { cancelled = true }
  }, [selectedPeriod])

  const totalAds = ads.length
  const activeAds = ads.filter(a => a.status === 'Active').length
  const totalVehicles = vehicles.length
  const activeVehicles = vehicles.filter(v => v.status === 'Active').length

  const adTitle = (adId) => ads.find(a => a.id === adId)?.title || 'Untitled Ad'
  const adLocation = (adId) => ads.find(a => a.id === adId)?.location || 'N/A'

  const totalReach = stats?.totalReach || 0
  const totalPlays = stats?.totalPlays || 0
  const hasData = stats?.hasData

  const topAds = (stats?.topAds || []).map(a => ({
    title: adTitle(a.adId),
    reach: a.reach,
    plays: a.plays,
    location: adLocation(a.adId),
  }))

  const handleExportPDF = () => {
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const topAdsRows = topAds.length ? topAds.map((ad, i) => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px 12px;font-size:14px;">${i + 1}</td>
        <td style="padding:10px 12px;font-size:14px;font-weight:500;">${ad.title}</td>
        <td style="padding:10px 12px;font-size:14px;">${ad.reach.toLocaleString()}</td>
        <td style="padding:10px 12px;font-size:14px;">${ad.plays.toLocaleString()}</td>
        <td style="padding:10px 12px;font-size:14px;">${ad.location}</td>
      </tr>`).join('') : `<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8;font-size:14px;">No impression data captured yet for this period.</td></tr>`

    const areaRows = (stats?.byArea || []).map(a => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:8px 12px;font-size:13px;">${a.label}</td>
        <td style="padding:8px 12px;font-size:13px;">${a.value.toLocaleString()}</td>
      </tr>`).join('') || `<tr><td colspan="2" style="padding:12px;text-align:center;color:#94a3b8;">No area data yet</td></tr>`

    const html = `<!DOCTYPE html><html><head><title>AdMotion Analytics Report</title><style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;padding:40px;}
      .header{text-align:center;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #1e3a5f;}
      .header h1{font-size:28px;color:#1e3a5f;margin-bottom:4px;}
      .header p{font-size:14px;color:#64748b;}
      .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px;}
      .kpi-card{padding:20px;border-radius:12px;text-align:center;}
      .kpi-card h3{font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;opacity:.8;}
      .kpi-card .value{font-size:30px;font-weight:700;}
      .kpi-blue{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;}
      .kpi-green{background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;}
      .kpi-violet{background:#f5f3ff;color:#7c3aed;border:1px solid #c4b5fd;}
      .kpi-amber{background:#fffbeb;color:#d97706;border:1px solid #fcd34d;}
      .section-title{font-size:18px;font-weight:600;color:#1e3a5f;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;}
      table{width:100%;border-collapse:collapse;margin-bottom:16px;}
      th{background:#1e3a5f;color:#fff;padding:12px;text-align:left;font-size:13px;text-transform:uppercase;letter-spacing:.5px;}
      tr:nth-child(even){background:#f8fafc;}
      .summary{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-top:24px;}
      .summary p{font-size:14px;color:#475569;line-height:1.6;}
      .footer{text-align:center;margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;}
      @media print{body{padding:20px;}}
    </style></head><body>
      <div class="header"><h1>AdMotion Analytics Report</h1>
        <p>Generated ${dateStr} &nbsp;|&nbsp; Period: ${selectedPeriod} &nbsp;|&nbsp; Reach is AI-estimated (area &times; time &times; weather)</p></div>
      <div class="kpi-grid">
        <div class="kpi-card kpi-blue"><h3>Est. People Reached</h3><div class="value">${totalReach.toLocaleString()}</div></div>
        <div class="kpi-card kpi-green"><h3>Ad Plays</h3><div class="value">${totalPlays.toLocaleString()}</div></div>
        <div class="kpi-card kpi-violet"><h3>Active Ads</h3><div class="value">${activeAds}</div></div>
        <div class="kpi-card kpi-amber"><h3>Active Vehicles</h3><div class="value">${activeVehicles}</div></div>
      </div>
      <h2 class="section-title">Top Performing Ads (by estimated reach)</h2>
      <table><thead><tr><th>#</th><th>Ad Title</th><th>Est. Reach</th><th>Plays</th><th>Location</th></tr></thead><tbody>${topAdsRows}</tbody></table>
      <h2 class="section-title">Reach by Area</h2>
      <table><thead><tr><th>Area</th><th>Est. Reach</th></tr></thead><tbody>${areaRows}</tbody></table>
      <div class="summary"><p>This report covers the <strong>${selectedPeriod}</strong> period. Vehicles generated <strong>${totalPlays.toLocaleString()}</strong> ad plays reaching an estimated <strong>${totalReach.toLocaleString()}</strong> people. Reach is estimated by the AdMotion engine using each vehicle's GPS-derived area type, time of day and live weather &mdash; the same signals that will train the predictive impression model.</p></div>
      <div class="footer">AdMotion &mdash; Intelligent Vehicle Advertising Platform</div>
    </body></html>`
    const w = window.open('', '_blank')
    w.document.write(html); w.document.close(); w.focus(); w.print()
  }

  return (
    <div className='p-4 md:p-6 transition-colors duration-300'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 rounded-2xl shadow-xl mb-6 flex items-center justify-between border border-white/10'
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6" />
          <div>
            <h1 className='text-xl md:text-2xl font-bold'>Analytics</h1>
            <p className="text-white/50 text-xs">AI-estimated real-world reach &middot; area &times; time &times; weather</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-medium transition-all"
          >
            <FileDown className="w-4 h-4" /> Export PDF
          </motion.button>
          <RealTimeIndicator isActive={!loading && !statsLoading} />
        </div>
      </motion.div>

      {/* Period filter */}
      <div className='flex flex-wrap gap-2 mb-6'>
        {['Today', 'This Week', 'This Month'].map((period) => (
          <motion.button
            key={period}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedPeriod(period)}
            className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              selectedPeriod === period
                ? 'bg-gradient-to-r from-brand-900 to-brand-800 text-white shadow-xl'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-900'
            }`}
          >
            {selectedPeriod === period && (
              <motion.div layoutId="activePeriod"
                className="absolute inset-0 bg-gradient-to-r from-brand-900 to-brand-800 rounded-xl -z-10"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
            )}
            {period}
          </motion.button>
        ))}
      </div>

      {/* KPI cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6'>
        <AnalyticsKpiCard title="Est. People Reached" value={totalReach} icon={Users} index={0} color="blue" />
        <AnalyticsKpiCard title="Ad Plays" value={totalPlays} icon={Eye} index={1} color="emerald" />
        <AnalyticsKpiCard title="Active Ads" value={activeAds} icon={Monitor} index={2} color="violet" />
        <AnalyticsKpiCard title="Active Vehicles" value={activeVehicles} icon={Truck} index={3} color="amber" />
      </div>

      {/* Charts row 1 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
        <ChartCard title="Estimated Reach Trend" icon={TrendingUp} color="#3b82f6" accent="from-blue-500 via-cyan-500 to-blue-400">
          {hasData && stats.trend.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gReach)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart msg={statsLoading ? 'Loading…' : 'No reach data for this period yet'} />}
        </ChartCard>

        <ChartCard title="Reach by Peak Hour" icon={Activity} color="#10b981" accent="from-emerald-500 via-green-500 to-teal-500" delay={0.1}>
          {hasData && stats.peakHours.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart msg={statsLoading ? 'Loading…' : 'No hourly data yet'} />}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
        <ChartCard title="Reach by Area Type" icon={Target} color="#8b5cf6" accent="from-purple-500 via-violet-500 to-fuchsia-500">
          {hasData && stats.byAreaType.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.byAreaType} dataKey="value" nameKey="label" cx="50%" cy="50%"
                  innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {stats.byAreaType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart msg={statsLoading ? 'Loading…' : 'No area data yet'} />}
          {hasData && (
            <div className="mt-3 space-y-1.5">
              {stats.byAreaType.map((a, i) => (
                <div key={a.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 capitalize">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {a.label.replace('_', ' ')}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{a.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Reach by Weather" icon={CloudSun} color="#f59e0b" accent="from-amber-500 via-orange-500 to-yellow-500" delay={0.1}>
          {hasData && stats.byWeather.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart layout="vertical" data={stats.byWeather} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} width={60} className="capitalize" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart msg={statsLoading ? 'Loading…' : 'No weather data yet'} />}
        </ChartCard>

        <ChartCard title="Top Performing Ads" icon={TrendingUp} color="#10b981" accent="from-emerald-500 via-green-500 to-teal-500" delay={0.2}>
          {topAds.length ? (
            <div className="space-y-2.5">
              {topAds.map((ad, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 shrink-0 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{ad.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{ad.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{ad.reach.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">{ad.plays.toLocaleString()} plays</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : <EmptyChart msg={statsLoading ? 'Loading…' : 'No ad performance data yet'} />}
        </ChartCard>
      </div>

      {!hasData && !statsLoading && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 flex items-start gap-3"
        >
          <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">Collecting data for the AI model</p>
            <p className="text-blue-700/80 dark:text-blue-400/80">
              As vehicles play ads, AdMotion estimates real-world reach from GPS area type, time of day and weather, and stores each event. These charts fill in automatically, and the same data trains the predictive impression model once enough has accumulated.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Analytics
