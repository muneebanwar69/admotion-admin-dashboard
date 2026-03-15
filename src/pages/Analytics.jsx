import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Truck, TrendingUp, MapPin, Activity, Eye, Target, BarChart3, FileDown } from 'lucide-react'
import { db } from '../firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import RealTimeIndicator from '../components/ui/RealTimeIndicator'

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

  return <>{display}</>
}

// Modern Line Chart Component
const LineChart = ({ data, title, color = '#3b82f6' }) => {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 200
    const y = 100 - ((point.value - minValue) / range) * 80
    return `${x},${y}`
  }).join(' ')

  const areaPath = `M0,100 L${data.map((point, index) => {
    const x = (index / (data.length - 1)) * 200
    const y = 100 - ((point.value - minValue) / range) * 80
    return `${x},${y}`
  }).join(' L')} L200,100 Z`

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-800 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-80" style={{ background: `linear-gradient(90deg, ${color}, ${color}88, ${color}44)` }} />
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" style={{ color }} />
        {title}
      </h3>
      <div className="h-36 relative">
        <svg width="100%" height="100%" viewBox="0 0 200 100" className="overflow-visible">
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="0.5" />
          ))}
          <path d={areaPath} fill={`${color}15`} />
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 200
            const y = 100 - ((point.value - minValue) / range) * 80
            return (
              <g key={index}>
                <circle cx={x} cy={y} r="5" fill="white" stroke={color} strokeWidth="2" className="drop-shadow-sm" />
                <circle cx={x} cy={y} r="3" fill={color} />
              </g>
            )
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
          {data.map((point, index) => (
            <span key={index} className="font-medium">{point.label}</span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Modern Donut Chart Component
const DonutChart = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cumulativePercentage = 0

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:border-purple-200 dark:hover:border-purple-800 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500 opacity-80" />
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
        <Target className="w-4 h-4 text-purple-500" />
        {title}
      </h3>
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90 drop-shadow-lg">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const startAngle = cumulativePercentage * 3.6
              const endAngle = (cumulativePercentage + percentage) * 3.6
              cumulativePercentage += percentage

              const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180)
              const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180)
              const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180)
              const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180)

              const largeArcFlag = percentage > 50 ? 1 : 0

              const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ')

              return (
                <path
                  key={index}
                  d={pathData}
                  fill={colors[index % colors.length]}
                  className="transition-all duration-300 hover:opacity-80"
                />
              )
            })}
            <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-slate-800" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-slate-700 dark:text-slate-200">{total}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-slate-600 dark:text-slate-400 font-medium">{item.label}</span>
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{item.value}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// Color themes for Analytics KPI cards
const ANALYTICS_COLORS = {
  blue: { bg: 'from-blue-600 via-blue-700 to-indigo-800', glow: 'shadow-blue-500/25', accent: 'from-blue-400 to-cyan-400', icon: 'bg-blue-400/20 border-blue-300/20', line: 'from-cyan-400 via-blue-400 to-indigo-400' },
  emerald: { bg: 'from-emerald-600 via-emerald-700 to-teal-800', glow: 'shadow-emerald-500/25', accent: 'from-emerald-400 to-teal-400', icon: 'bg-emerald-400/20 border-emerald-300/20', line: 'from-teal-400 via-emerald-400 to-green-400' },
  violet: { bg: 'from-violet-600 via-purple-700 to-indigo-800', glow: 'shadow-violet-500/25', accent: 'from-violet-400 to-purple-400', icon: 'bg-violet-400/20 border-violet-300/20', line: 'from-pink-400 via-violet-400 to-indigo-400' },
  amber: { bg: 'from-amber-500 via-orange-600 to-red-700', glow: 'shadow-amber-500/25', accent: 'from-amber-400 to-orange-400', icon: 'bg-amber-400/20 border-amber-300/20', line: 'from-yellow-400 via-amber-400 to-orange-400' },
}

const AnalyticsKpiCard = ({ title, value, icon: Icon, index = 0, color = 'blue' }) => {
  const theme = ANALYTICS_COLORS[color] || ANALYTICS_COLORS.blue
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
      whileTap={{ scale: 0.98 }}
      className={`group relative rounded-2xl bg-gradient-to-br ${theme.bg} text-white p-5 shadow-xl ${theme.glow} border border-white/10 overflow-hidden`}
    >
      {/* Shimmer sweep */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {/* Corner accent */}
      <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${theme.accent} opacity-10 rounded-bl-full group-hover:opacity-20 transition-opacity duration-300`} />
      <div className='flex items-center justify-between relative z-10'>
        <div>
          <p className='text-white/70 text-xs font-semibold tracking-widest uppercase mb-1.5'>{title}</p>
          <p className='text-3xl font-bold counter-value'><AnimatedValue value={value} /></p>
        </div>
        <motion.div
          className={`w-12 h-12 rounded-xl ${theme.icon} border backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-all duration-300`}
          whileHover={{ rotate: 5 }}
        >
          <Icon className='w-6 h-6 text-white/90' />
        </motion.div>
      </div>
      {/* Bottom accent line */}
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

  // Mock data for charts (will be replaced by Firestore data when impressions collection exists)
  const adViewsData = [
    { label: 'Mon', value: 1200 },
    { label: 'Tue', value: 1900 },
    { label: 'Wed', value: 3000 },
    { label: 'Thu', value: 2800 },
    { label: 'Fri', value: 3500 }
  ]

  const carActivityData = [
    { label: 'Week 1', value: 300 },
    { label: 'Week 2', value: 450 },
    { label: 'Week 3', value: 600 },
    { label: 'Week 4', value: 750 }
  ]

  const areaData = [
    { label: 'Blue Area', value: 60 },
    { label: 'Green', value: 25 },
    { label: 'Red', value: 10 },
    { label: 'Yellow', value: 5 }
  ]

  // Build top ads from real Firestore data when available
  const topAds = ads
    .filter(ad => ad.status === 'Active')
    .slice(0, 4)
    .map((ad, i) => ({
      title: ad.title || 'Untitled',
      impressions: ad.impressions || (2400 - i * 400),
      location: ad.location || 'N/A',
      status: ad.status || 'Active'
    }))

  // Fallback to mock if no real ads
  const displayTopAds = topAds.length > 0 ? topAds : [
    { title: 'Mega Summer Sale', impressions: 2400, location: 'Blue Area', status: 'Active' },
    { title: 'Flash Deal', impressions: 1900, location: 'F-10', status: 'Active' },
    { title: 'Winter Offer', impressions: 1500, location: 'F-8', status: 'Active' },
    { title: 'Food Festival', impressions: 1200, location: 'Blue Area', status: 'Active' }
  ]

  useEffect(() => {
    const adsQuery = query(collection(db, 'ads'))
    const vehiclesQuery = query(collection(db, 'vehicles'))

    const unsubscribeAds = onSnapshot(adsQuery, (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })

    const unsubscribeVehicles = onSnapshot(vehiclesQuery, (snapshot) => {
      setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    return () => {
      unsubscribeAds()
      unsubscribeVehicles()
    }
  }, [])

  const totalAds = ads.length
  const activeAds = ads.filter(ad => ad.status === 'Active').length
  const totalVehicles = vehicles.length
  const activeVehicles = vehicles.filter(vehicle => vehicle.status === 'Active').length

  const handleExportPDF = () => {
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const topAdsRows = displayTopAds.map((ad, i) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 12px; font-size: 14px;">${i + 1}</td>
        <td style="padding: 10px 12px; font-size: 14px; font-weight: 500;">${ad.title}</td>
        <td style="padding: 10px 12px; font-size: 14px;">${ad.impressions.toLocaleString()}</td>
        <td style="padding: 10px 12px; font-size: 14px;">${ad.location}</td>
        <td style="padding: 10px 12px; font-size: 14px;">
          <span style="background: ${ad.status === 'Active' ? '#d1fae5' : '#fee2e2'}; color: ${ad.status === 'Active' ? '#065f46' : '#991b1b'}; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${ad.status}</span>
        </td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html><head><title>AdMotion Analytics Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; padding: 40px; }
  .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #1e3a5f; }
  .header h1 { font-size: 28px; color: #1e3a5f; margin-bottom: 4px; }
  .header p { font-size: 14px; color: #64748b; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .kpi-card { padding: 20px; border-radius: 12px; text-align: center; }
  .kpi-card h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; opacity: 0.8; }
  .kpi-card .value { font-size: 32px; font-weight: 700; }
  .kpi-blue { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
  .kpi-green { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
  .kpi-violet { background: #f5f3ff; color: #7c3aed; border: 1px solid #c4b5fd; }
  .kpi-amber { background: #fffbeb; color: #d97706; border: 1px solid #fcd34d; }
  .section-title { font-size: 18px; font-weight: 600; color: #1e3a5f; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
  th { background: #1e3a5f; color: white; padding: 12px; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 10px 12px; font-size: 14px; }
  tr:nth-child(even) { background: #f8fafc; }
  .summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-top: 24px; }
  .summary h3 { font-size: 16px; color: #1e3a5f; margin-bottom: 12px; }
  .summary p { font-size: 14px; color: #475569; line-height: 1.6; }
  .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  @media print { body { padding: 20px; } }
</style></head><body>
  <div class="header">
    <h1>AdMotion Analytics Report</h1>
    <p>Generated on ${dateStr} | Period: ${selectedPeriod}</p>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card kpi-blue"><h3>Total Ads</h3><div class="value">${totalAds}</div></div>
    <div class="kpi-card kpi-green"><h3>Active Ads</h3><div class="value">${activeAds}</div></div>
    <div class="kpi-card kpi-violet"><h3>Total Vehicles</h3><div class="value">${totalVehicles}</div></div>
    <div class="kpi-card kpi-amber"><h3>Active Vehicles</h3><div class="value">${activeVehicles}</div></div>
  </div>

  <h2 class="section-title">Top Performing Ads</h2>
  <table>
    <thead><tr><th>#</th><th>Ad Title</th><th>Impressions</th><th>Location</th><th>Status</th></tr></thead>
    <tbody>${topAdsRows}</tbody>
  </table>

  <div class="summary">
    <h3>Summary</h3>
    <p>This report covers the analytics for the <strong>${selectedPeriod}</strong> period. There are currently <strong>${totalAds}</strong> ads in the system, of which <strong>${activeAds}</strong> are active. The fleet consists of <strong>${totalVehicles}</strong> vehicles with <strong>${activeVehicles}</strong> currently active. The top performing ads are listed above with their impression counts and deployment locations.</p>
  </div>

  <div class="footer">AdMotion - Vehicle Advertising Platform | Report generated automatically</div>
</body></html>`

    const printWindow = window.open('', '_blank')
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
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
          <h1 className='text-xl md:text-2xl font-bold'>Analytics</h1>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-medium transition-all duration-200"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </motion.button>
          <RealTimeIndicator isActive={!loading} />
        </div>
      </motion.div>

      {/* Date Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className='flex flex-wrap gap-2 mb-6'
      >
        {['Today', 'This Week', 'This Month'].map((period, idx) => (
          <motion.button
            key={period}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedPeriod(period)}
            className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              selectedPeriod === period
                ? 'bg-gradient-to-r from-brand-900 to-brand-800 text-white shadow-xl'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-900 dark:hover:border-brand-800'
            }`}
          >
            {selectedPeriod === period && (
              <motion.div
                layoutId="activePeriod"
                className="absolute inset-0 bg-gradient-to-r from-brand-900 to-brand-800 rounded-xl -z-10"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            {period}
          </motion.button>
        ))}
      </motion.div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6'>
        <AnalyticsKpiCard title="Total Ads" value={totalAds} icon={Monitor} index={0} color="blue" />
        <AnalyticsKpiCard title="Active Ads" value={activeAds} icon={Eye} index={1} color="emerald" />
        <AnalyticsKpiCard title="Total Vehicles" value={totalVehicles} icon={Truck} index={2} color="violet" />
        <AnalyticsKpiCard title="Active Vehicles" value={activeVehicles} icon={Activity} index={3} color="amber" />
      </div>

      {/* Charts Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
        <LineChart
          data={adViewsData}
          title="Ad Views Trend"
          color="#3b82f6"
        />
        <LineChart
          data={carActivityData}
          title="Vehicle Activity"
          color="#10b981"
        />
      </div>

      {/* Bottom Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Area Analytics */}
        <DonutChart data={areaData} title="Area Analytics" />

        {/* Top Performing Ads */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className='group bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:border-emerald-200 dark:hover:border-emerald-800 relative overflow-hidden'
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 opacity-80" />
          <h3 className='text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2'>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Top Performing Ads
          </h3>
          <div className='space-y-3'>
            {displayTopAds.map((ad, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ x: 4 }}
                className='flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 cursor-default'
              >
                <div className='flex-1'>
                  <p className='font-semibold text-sm text-slate-800 dark:text-slate-200'>{ad.title}</p>
                  <p className='text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5'>
                    <Eye className="w-3 h-3" />
                    {ad.impressions.toLocaleString()} impressions
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1'>
                    <MapPin className="w-3 h-3" />
                    {ad.location}
                  </p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${
                    ad.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ad.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {ad.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Analytics
