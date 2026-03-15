import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import KpiCard from '../components/ui/KpiCard'
import MapView from '../components/map/MapView'
import { Flag, CheckSquare, Truck, Activity, MapPin, Clock, Sun, Moon, CloudSun } from 'lucide-react'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { SkeletonKpiCard } from '../components/ui/SkeletonLoader'
import RealTimeIndicator from '../components/ui/RealTimeIndicator'
import DashboardCustomizer from '../components/DashboardCustomizer'
import useDashboardLayout from '../hooks/useDashboardLayout'
import { FleetUtilizationWidget, TopAdsWidget, QuickActionsWidget, DriverEarningsWidget } from '../components/DashboardWidgets'

// Geocoding cache
const geocodeCache = new Map()

// Get place name from coordinates
async function getPlaceName(lat, lon) {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16`
    )
    const data = await response.json()

    const address = data.address
    let placeName = ''

    if (address) {
      const parts = []
      if (address.road) parts.push(address.road)
      if (address.neighbourhood) parts.push(address.neighbourhood)
      else if (address.suburb) parts.push(address.suburb)
      if (address.city || address.town || address.village) {
        parts.push(address.city || address.town || address.village)
      }
      placeName = parts.slice(0, 2).join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || 'Unknown'
    } else {
      placeName = data.display_name?.split(',').slice(0, 2).join(',') || 'Unknown'
    }

    geocodeCache.set(cacheKey, placeName)
    return placeName
  } catch (error) {
    return 'Unknown'
  }
}

// Animated counter component
const AnimatedCounter = ({ value, duration = 1.5 }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const target = parseInt(value) || 0
    if (target === 0) { setDisplayValue(0); return }

    let start = 0
    const increment = target / (duration * 60)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setDisplayValue(target)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, 1000 / 60)

    return () => clearInterval(timer)
  }, [value, duration])

  return <>{displayValue}</>
}

// Greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Good Morning', icon: Sun }
  if (hour < 17) return { text: 'Good Afternoon', icon: CloudSun }
  return { text: 'Good Evening', icon: Moon }
}

const Dashboard = () => {
  const [ads, setAds] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [placeNames, setPlaceNames] = useState({})
  const [currentTime, setCurrentTime] = useState(new Date())

  // Dashboard customization
  const { layout, visibleWidgets, toggleWidget, moveWidget, resetLayout, isCustomized } = useDashboardLayout()

  // Refs for scroll animations
  const kpiRef = useRef(null)
  const mapRef = useRef(null)
  const tableRef = useRef(null)
  const kpiInView = useInView(kpiRef, { once: true, margin: "-50px" })
  const mapInView = useInView(mapRef, { once: true, margin: "-50px" })
  const tableInView = useInView(tableRef, { once: true, margin: "-50px" })

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Real-time data fetching from Firebase
  useEffect(() => {
    let isActive = true;
    let retryCount = 0;

    const setupListeners = () => {
      if (!isActive) return;

      try {
        const unsubscribeAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
          if (!isActive) return;
          const adsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          setAds(adsData)
          setLoading(false)
          retryCount = 0;
        }, (error) => {
          if (!isActive) return;

          if (error.code === 'internal' || error.message?.includes('ASSERTION')) {
            if (retryCount < 2) {
              retryCount++;
              setTimeout(setupListeners, 500 * retryCount);
            } else {
              setLoading(false);
            }
          } else {
            console.error('Dashboard: Error fetching ads:', error)
            setLoading(false)
          }
        })

        const unsubscribeVehicles = onSnapshot(collection(db, 'vehicles'), async (snapshot) => {
          if (!isActive) return;
          const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          setVehicles(vehiclesData)

          for (const vehicle of vehiclesData) {
            const lat = vehicle.currentLocation?.lat || vehicle.location?.lat || vehicle.lastLocation?.lat
            const lon = vehicle.currentLocation?.lng || vehicle.currentLocation?.lon || vehicle.location?.lon || vehicle.lastLocation?.lon

            if (lat && lon) {
              if (vehicle.location?.address) {
                setPlaceNames(prev => ({ ...prev, [vehicle.id]: vehicle.location.address }))
              } else if (!placeNames[vehicle.id]) {
                const placeName = await getPlaceName(lat, lon)
                setPlaceNames(prev => ({ ...prev, [vehicle.id]: placeName }))

                if (placeName !== 'Unknown') {
                  try {
                    await updateDoc(doc(db, 'vehicles', vehicle.id), {
                      'location.address': placeName
                    })
                  } catch (e) { /* ignore */ }
                }
              }
            }
          }
        }, (error) => {
          if (!isActive) return;
          if (!(error.code === 'internal' || error.message?.includes('ASSERTION'))) {
            console.error('Dashboard: Error fetching vehicles:', error)
          }
        })

        return () => {
          isActive = false;
          unsubscribeAds()
          unsubscribeVehicles()
        }
      } catch (err) {
        console.error('Failed to set up dashboard listeners:', err);
        if (retryCount < 2) {
          retryCount++;
          setTimeout(setupListeners, 500 * retryCount);
        }
      }
    };

    const cleanup = setupListeners();
    return cleanup;
  }, [])

  // Calculate KPI values from real data
  const totalAds = ads.length
  const activeAds = ads.filter(ad => ad.status === 'Active').length
  const totalVehicles = vehicles.length
  const activeVehicles = vehicles.filter(vehicle => vehicle.status === 'Active').length

  // Get current ad assignment for each vehicle
  const getCurrentAdForVehicle = (vehicle) => {
    if (vehicle.assignedAds && Array.isArray(vehicle.assignedAds) && vehicle.assignedAds.length > 0) {
      const currentAssignment = vehicle.assignedAds[0]
      if (currentAssignment && currentAssignment.adId) {
        const ad = ads.find(a => a.id === currentAssignment.adId)
        return ad ? ad.title : 'Assigned Ad (Not Found)'
      }
    }
    const ad = ads.find(a => a.assignedVehicle === vehicle.id)
    return ad ? ad.title : 'No Ad Assigned'
  }

  // Format time for last update
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  // Check if vehicle is online
  const isOnline = (vehicle) => {
    // Check lastSeen (from display player) or lastHeartbeat
    const checkTimestamp = (ts) => {
      if (!ts) return false
      const date = ts.toDate ? ts.toDate() : new Date(ts)
      return (new Date() - date) / 1000 < 300
    }
    return checkTimestamp(vehicle.lastSeen) || checkTimestamp(vehicle.lastHeartbeat)
  }

  // Vehicle-ad assignments for the table
  const vehicleAdAssignments = vehicles.map(vehicle => ({
    id: vehicle.carId || vehicle.id,
    firestoreId: vehicle.id,
    vehicleName: vehicle.vehicleName || vehicle.type || 'N/A',
    ownerName: vehicle.ownerName || 'N/A',
    ad: getCurrentAdForVehicle(vehicle),
    status: vehicle.status || 'Active',
    online: isOnline(vehicle),
    lastSeen: formatLastSeen(vehicle.lastSeen || vehicle.lastHeartbeat),
    location: placeNames[vehicle.id] || vehicle.location?.address || 'Fetching...',
    hasLocation: !!(vehicle.currentLocation?.lat || vehicle.location?.lat || vehicle.lastLocation?.lat)
  }))

  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  // Widget renderer
  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case 'kpi-cards':
        return (
          <motion.div
            key="kpi-cards"
            ref={kpiRef}
            initial={{ opacity: 0, y: 30 }}
            animate={kpiInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6'
          >
            {loading ? (
              <><SkeletonKpiCard /><SkeletonKpiCard /><SkeletonKpiCard /><SkeletonKpiCard /></>
            ) : (
              <>
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0 }}>
                  <KpiCard title='Total Ads' value={<AnimatedCounter value={totalAds} />} icon={<Flag />} index={0} color="blue" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                  <KpiCard title='Active Ads' value={<AnimatedCounter value={activeAds} />} icon={<CheckSquare />} index={1} color="emerald" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
                  <KpiCard title='Total Vehicles' value={<AnimatedCounter value={totalVehicles} />} icon={<Truck />} index={2} color="violet" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}>
                  <KpiCard title='Active Vehicles' value={<AnimatedCounter value={activeVehicles} />} icon={<Activity />} index={3} color="amber" />
                </motion.div>
              </>
            )}
          </motion.div>
        )
      case 'map':
        return (
          <motion.div key="map" ref={mapRef} initial={{ opacity: 0, y: 30 }} animate={mapInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className='mb-6'>
            <MapView />
          </motion.div>
        )
      case 'vehicle-table':
        return (
          <motion.div key="vehicle-table" ref={tableRef} initial={{ opacity: 0, y: 30 }} animate={tableInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-6">
            <div className="overflow-x-auto rounded-2xl shadow-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 transition-colors duration-300">
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-brand-900 to-brand-800 text-white">
                  <tr>
                    <th className="p-4 text-left font-semibold">Vehicle ID</th>
                    <th className="p-4 text-left font-semibold">Vehicle Name</th>
                    <th className="p-4 text-left font-semibold">Owner</th>
                    <th className="p-4 text-left font-semibold">Current Ad</th>
                    <th className="p-4 text-left font-semibold">Location</th>
                    <th className="p-4 text-center font-semibold">Online</th>
                    <th className="p-4 text-center font-semibold">Last Seen</th>
                    <th className="p-4 text-center font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && vehicleAdAssignments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-gray-500 dark:text-slate-400">Loading vehicles...</span>
                        </div>
                      </td>
                    </tr>
                  ) : vehicleAdAssignments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-6 text-center text-gray-500 dark:text-slate-400">No vehicles found</td>
                    </tr>
                  ) : (
                    vehicleAdAssignments.map((v, index) => (
                      <motion.tr
                        key={v.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.04, duration: 0.4 }}
                        className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-200 group"
                      >
                        <td className="p-3 dark:text-slate-100 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{v.id}</td>
                        <td className="p-3 dark:text-slate-100 font-medium">{v.vehicleName}</td>
                        <td className="p-3 dark:text-slate-300 text-gray-600">{v.ownerName}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-xl text-xs font-medium ${v.ad !== 'No Ad Assigned' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                            {v.ad}
                          </span>
                        </td>
                        <td className="p-3 dark:text-slate-300 text-gray-600 max-w-[200px]" title={v.location}>
                          {v.hasLocation ? (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              <span className="truncate">{v.location}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-slate-500 italic">No location</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${v.online ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                            <span className={`w-2 h-2 rounded-full ${v.online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                            {v.online ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td className="p-3 text-center dark:text-slate-400 text-gray-500 text-xs">{v.lastSeen}</td>
                        <td className="p-3 text-center">
                          <motion.span
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.04 + 0.2, type: 'spring' }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${v.status === 'Active' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-400/50' : 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg shadow-red-400/50'}`}
                          >
                            {v.status}
                          </motion.span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )
      case 'recent-activity':
        return null
      case 'utilization':
        return <div key="utilization" className="mb-6"><FleetUtilizationWidget /></div>
      case 'top-ads':
        return <div key="top-ads" className="mb-6"><TopAdsWidget /></div>
      case 'quick-actions':
        return <div key="quick-actions" className="mb-6"><QuickActionsWidget /></div>
      case 'driver-earnings':
        return <div key="driver-earnings" className="mb-6"><DriverEarningsWidget /></div>
      default:
        return null
    }
  }

  return (
    <div className='p-4 md:p-6 transition-colors duration-300 relative'>
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-5 rounded-2xl shadow-xl mb-6 border border-white/10 relative overflow-hidden'
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center"
            >
              <GreetingIcon className="w-6 h-6 text-amber-300" />
            </motion.div>
            <div>
              <h1 className='text-xl md:text-2xl font-bold'>{greeting.text}, Admin</h1>
              <p className="text-white/60 text-sm mt-0.5 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {' '} — {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RealTimeIndicator isActive={!loading} />
            <div className="relative">
              <DashboardCustomizer
                layout={layout}
                onToggle={toggleWidget}
                onMove={moveWidget}
                onReset={resetLayout}
                isCustomized={isCustomized}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Render visible widgets in order */}
      {visibleWidgets.map(widget => renderWidget(widget.id))}

      {/* Extra widgets in grid for side-by-side layout */}
      {visibleWidgets.some(w => ['recent-activity', 'utilization', 'top-ads', 'quick-actions'].includes(w.id)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {visibleWidgets
            .filter(w => ['recent-activity', 'utilization', 'top-ads', 'quick-actions'].includes(w.id))
            .map(() => null) /* Already rendered above */
          }
        </div>
      )}
    </div>
  )
}

export default Dashboard
