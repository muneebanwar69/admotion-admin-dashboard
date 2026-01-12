import React, { useState, useEffect } from 'react'
import { FiMonitor, FiTruck, FiTrendingUp, FiUsers, FiMapPin } from 'react-icons/fi'
import { db } from '../firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

// Simple Line Chart Component
const LineChart = ({ data, title, color = '#3b82f6' }) => {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 200
    const y = 100 - ((point.value - minValue) / range) * 80
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      <div className="h-32 relative">
        <svg width="100%" height="100%" viewBox="0 0 200 100" className="overflow-visible">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
          />
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 200
            const y = 100 - ((point.value - minValue) / range) * 80
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={color}
              />
            )
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
          {data.map((point, index) => (
            <span key={index}>{point.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// Donut Chart Component
const DonutChart = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cumulativePercentage = 0

  const colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b']

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
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
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-700">{total}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-gray-600">{item.label}</span>
            </div>
            <span className="font-medium">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const Analytics = () => {
  const [ads, setAds] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('Today')

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
    // Fetch ads and vehicles for real-time data
    const adsQuery = query(collection(db, 'ads'), orderBy('createdAt', 'desc'))
    const vehiclesQuery = query(collection(db, 'vehicles'), orderBy('createdAt', 'desc'))

    const unsubscribeAds = onSnapshot(adsQuery, (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
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
  const activeAds = ads.filter(ad => ad.isActive).length
  const totalVehicles = vehicles.length
  const activeVehicles = vehicles.filter(vehicle => vehicle.status === 'Active').length

  return (
    <div className='p-4 bg-[var(--app-bg)]'>
      {/* Header */}
      <div className='bg-brand-900 text-white px-4 py-3 text-sm mb-4'>Analytics</div>

      {/* Date Filters */}
      <div className='px-4 flex gap-2 mb-6'>
        {['Today', 'This Week', 'This Month'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-[#101c44] text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className='px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        <div className='bg-brand-900 text-white p-4 rounded-lg shadow-kpi'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-white/90 text-sm'>Total ADS</p>
              <p className='text-2xl font-bold'>{totalAds}</p>
            </div>
            <FiMonitor className='w-8 h-8 text-white/90' />
          </div>
        </div>
        
        <div className='bg-brand-900 text-white p-4 rounded-lg shadow-kpi'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-white/90 text-sm'>Active ADs</p>
              <p className='text-2xl font-bold'>{activeAds}</p>
            </div>
            <FiMonitor className='w-8 h-8 text-white/90' />
          </div>
        </div>
        
        <div className='bg-brand-900 text-white p-4 rounded-lg shadow-kpi'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-white/90 text-sm'>Total Vehicles</p>
              <p className='text-2xl font-bold'>{totalVehicles}</p>
            </div>
            <FiTruck className='w-8 h-8 text-white/90' />
          </div>
        </div>
        
        <div className='bg-brand-900 text-white p-4 rounded-lg shadow-kpi'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-white/90 text-sm'>Active Vehicles</p>
              <p className='text-2xl font-bold'>{activeVehicles}</p>
            </div>
            <FiTruck className='w-8 h-8 text-white/90' />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className='px-4 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
        <LineChart 
          data={adViewsData} 
          title="Ad Views Trend" 
          color="#0B1452"
        />
        <LineChart 
          data={carActivityData} 
          title="Car Activity" 
          color="#0B1452"
        />
      </div>

      {/* Bottom Section */}
      <div className='px-4 grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Area Analytics */}
        <DonutChart data={areaData} title="Area Analytics" />
        
        {/* Top Performing Ads */}
        <div className='bg-white p-4 rounded-lg shadow-sm border'>
          <h3 className='text-sm font-medium text-gray-700 mb-3'>Top Performing Ads</h3>
          <div className='space-y-3'>
            {topAds.map((ad, index) => (
              <div key={index} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                <div className='flex-1'>
                  <p className='font-medium text-sm text-gray-800'>{ad.title}</p>
                  <p className='text-xs text-gray-500'>{ad.impressions.toLocaleString()} impressions</p>
                </div>
                <div className='text-right'>
                  <p className='text-xs text-gray-600'>{ad.location}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    ad.status === 'Active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {ad.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
