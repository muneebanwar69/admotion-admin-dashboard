import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Truck, TrendingUp, MapPin, Activity, Eye, Target, BarChart3 } from 'lucide-react'
import { db } from '../firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import RealTimeIndicator from '../components/ui/RealTimeIndicator'

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-xl"
    >
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-blue-500" />
        {title}
      </h3>
      <div className="h-36 relative">
        <svg width="100%" height="100%" viewBox="0 0 200 100" className="overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="0.5" />
          ))}
          
          {/* Area fill */}
          <path d={areaPath} fill={`${color}15`} />
          
          {/* Line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          
          {/* Data points */}
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-xl"
    >
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
            {/* Inner circle for donut effect */}
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

// KPI Card for Analytics
const AnalyticsKpiCard = ({ title, value, icon: Icon, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ y: -4 }}
    className='group relative rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 text-white p-5 shadow-xl border border-white/10 overflow-hidden'
  >
    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full" />
    <div className='flex items-center justify-between relative z-10'>
      <div>
        <p className='text-white/70 text-sm font-medium mb-1'>{title}</p>
        <p className='text-3xl font-bold'>{value}</p>
      </div>
      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
        <Icon className='w-6 h-6 text-white/90' />
      </div>
    </div>
  </motion.div>
)

const Analytics = () => {
  const [ads, setAds] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('Today')
  const [loading, setLoading] = useState(true)

  // Mock data for charts
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

  const topAds = [
    { title: 'Mega Summer Sale', impressions: 2400, location: 'Oga Mall', status: 'Active' },
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

  return (
    <div className='p-4 md:p-6 transition-colors duration-300'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 rounded-xl shadow-lg mb-6 flex items-center justify-between border border-white/10'
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6" />
          <h1 className='text-xl md:text-2xl font-bold'>Analytics</h1>
        </div>
        <RealTimeIndicator isActive={!loading} />
      </motion.div>

      {/* Date Filters */}
      <div className='flex flex-wrap gap-2 mb-6'>
        {['Today', 'This Week', 'This Month'].map((period) => (
          <motion.button
            key={period}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedPeriod(period)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              selectedPeriod === period
                ? 'bg-gradient-to-r from-brand-900 to-brand-800 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-900 dark:hover:border-brand-800'
            }`}
          >
            {period}
          </motion.button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6'>
        <AnalyticsKpiCard title="Total Ads" value={totalAds} icon={Monitor} index={0} />
        <AnalyticsKpiCard title="Active Ads" value={activeAds} icon={Eye} index={1} />
        <AnalyticsKpiCard title="Total Vehicles" value={totalVehicles} icon={Truck} index={2} />
        <AnalyticsKpiCard title="Active Vehicles" value={activeVehicles} icon={Activity} index={3} />
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-xl'
        >
          <h3 className='text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2'>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Top Performing Ads
          </h3>
          <div className='space-y-3'>
            {topAds.map((ad, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className='flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200'
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
