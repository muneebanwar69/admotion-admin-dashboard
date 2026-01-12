import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import KpiCard from '../components/ui/KpiCard'
import MapView from '../components/map/MapView'
import { FiFlag, FiCheckSquare, FiTruck, FiTruck as FiTruck2 } from 'react-icons/fi'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { SkeletonKpiCard } from '../components/ui/SkeletonLoader'
import { EmptyVehicles } from '../components/ui/EmptyState'
import RealTimeIndicator from '../components/ui/RealTimeIndicator'

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

/**
 * Pixel-alike Dashboard page containing:
 * - Header row with four KPI cards
 * - Map with markers
 * - Real-time table of vehicles & ads
 */
const Dashboard = () => {
  const [ads, setAds] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [placeNames, setPlaceNames] = useState({})

  // Real-time data fetching from Firebase
  useEffect(() => {
    // Subscribe to ads collection
    const unsubscribeAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setAds(adsData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching ads:', error)
      setLoading(false)
    })

    // Subscribe to vehicles collection
    const unsubscribeVehicles = onSnapshot(collection(db, 'vehicles'), async (snapshot) => {
      const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setVehicles(vehiclesData)
      
      // Fetch place names for vehicles
      for (const vehicle of vehiclesData) {
        const lat = vehicle.location?.lat || vehicle.lastLocation?.lat
        const lon = vehicle.location?.lon || vehicle.lastLocation?.lon
        
        if (lat && lon) {
          // Check if we already have address from vehicle
          if (vehicle.location?.address) {
            setPlaceNames(prev => ({ ...prev, [vehicle.id]: vehicle.location.address }))
          } else if (!placeNames[vehicle.id]) {
            // Fetch from geocoding API
            const placeName = await getPlaceName(lat, lon)
            setPlaceNames(prev => ({ ...prev, [vehicle.id]: placeName }))
            
            // Update vehicle doc with address
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
      console.error('Error fetching vehicles:', error)
    })

    // Cleanup subscriptions
    return () => {
      unsubscribeAds()
      unsubscribeVehicles()
    }
  }, [])

  // Calculate KPI values from real data
  const totalAds = ads.length
  const activeAds = ads.filter(ad => ad.status === 'Active').length
  const totalVehicles = vehicles.length
  const activeVehicles = vehicles.filter(vehicle => vehicle.status === 'Active').length

  // Get current ad assignment for each vehicle
  const getCurrentAdForVehicle = (vehicle) => {
    // Check if vehicle has assignedAds array
    if (vehicle.assignedAds && Array.isArray(vehicle.assignedAds) && vehicle.assignedAds.length > 0) {
      // Get the first active assignment (you can enhance this to check time ranges)
      const currentAssignment = vehicle.assignedAds[0]
      if (currentAssignment && currentAssignment.adId) {
        const ad = ads.find(a => a.id === currentAssignment.adId)
        return ad ? ad.title : 'Assigned Ad (Not Found)'
      }
    }
    // Fallback: check if ad has assignedVehicle field
    const ad = ads.find(a => a.assignedVehicle === vehicle.id)
    return ad ? ad.title : 'No Ad Assigned'
  }

  // Format time for last update
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000) // seconds
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  // Check if vehicle is online (heartbeat within last 5 minutes)
  const isOnline = (vehicle) => {
    if (!vehicle.lastHeartbeat) return false
    const date = vehicle.lastHeartbeat.toDate ? vehicle.lastHeartbeat.toDate() : new Date(vehicle.lastHeartbeat)
    const diff = (new Date() - date) / 1000
    return diff < 300 // 5 minutes
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
    lastSeen: formatLastSeen(vehicle.lastHeartbeat),
    location: placeNames[vehicle.id] || vehicle.location?.address || 'No location',
    hasLocation: !!(vehicle.location?.lat || vehicle.lastLocation?.lat)
  }))

  return (
    <div className='p-4 md:p-6 transition-colors duration-300'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 rounded-xl shadow-lg mb-6 flex items-center justify-between border border-white/10'
      >
        <h1 className='text-xl md:text-2xl font-bold'>Dashboard</h1>
        <RealTimeIndicator isActive={!loading} />
      </motion.div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6'>
        {loading ? (
          <>
            <SkeletonKpiCard />
            <SkeletonKpiCard />
            <SkeletonKpiCard />
            <SkeletonKpiCard />
          </>
        ) : (
          <>
            <KpiCard title='Total Ads' value={totalAds.toString()} icon={<FiFlag />} index={0} />
            <KpiCard title='Active Ads' value={activeAds.toString()} icon={<FiCheckSquare />} index={1} />
            <KpiCard title='Total Vehicles' value={totalVehicles.toString()} icon={<FiTruck />} index={2} />
            <KpiCard title='Active Vehicles' value={activeVehicles.toString()} icon={<FiTruck2 />} index={3} />
          </>
        )}
      </div>

      {/* Map */}
      <div className='mb-6'>
        <MapView />
      </div>

      {/* Vehicle/Ads Table */}
      <div className="mb-6">
        <div className="overflow-x-auto rounded-xl shadow-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 transition-colors duration-300">
          <table className="min-w-full text-sm">
            <thead className="bg-gradient-to-r from-brand-900 to-brand-800 dark:bg-slate-900 text-white">
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
                  <td colSpan="8" className="p-6 text-center text-gray-500 dark:text-slate-400">
                    No vehicles found
                  </td>
                </tr>
              ) : (
                vehicleAdAssignments.map((v, index) => (
                  <motion.tr
                    key={v.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 group"
                  >
                    <td className="p-3 dark:text-slate-100 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{v.id}</td>
                    <td className="p-3 dark:text-slate-100 font-medium">{v.vehicleName}</td>
                    <td className="p-3 dark:text-slate-300 text-gray-600">{v.ownerName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        v.ad !== 'No Ad Assigned' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {v.ad}
                      </span>
                    </td>
                    <td className="p-3 dark:text-slate-300 text-gray-600 max-w-[200px]" title={v.location}>
                      {v.hasLocation ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-green-500 text-base">📍</span>
                          <span className="truncate">{v.location}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">No location</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        v.online 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${v.online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        {v.online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="p-3 text-center dark:text-slate-400 text-gray-500 text-xs">
                      {v.lastSeen}
                    </td>
                    <td className="p-3 text-center">
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.2, type: 'spring' }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                          v.status === 'Active'
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-400/50'
                            : 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg shadow-red-400/50'
                        }`}
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
      </div>
    </div>
  )
}

export default Dashboard
