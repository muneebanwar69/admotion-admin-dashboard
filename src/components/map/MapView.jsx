import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useTheme } from '../../contexts/ThemeContext'

// Car SVG icon for active vehicles (green)
const activeCarIcon = new L.DivIcon({
  className: 'custom-car-marker',
  html: `<div style="
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 4px 6px rgba(16, 185, 129, 0.5));
  ">
    <svg viewBox="0 0 24 24" width="36" height="36" fill="#10b981">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
})

// Car SVG icon for inactive vehicles (red)
const inactiveCarIcon = new L.DivIcon({
  className: 'custom-car-marker',
  html: `<div style="
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 4px 6px rgba(239, 68, 68, 0.5));
  ">
    <svg viewBox="0 0 24 24" width="36" height="36" fill="#ef4444">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
})

// Reverse geocoding cache
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
    
    // Extract readable address
    const address = data.address
    let placeName = ''
    
    if (address) {
      // Build a short readable address
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
    console.error('Geocoding error:', error)
    return 'Unknown location'
  }
}

// Component to recenter map when vehicles change
function MapController({ vehicles }) {
  const map = useMap()
  
  useEffect(() => {
    if (vehicles.length > 0) {
      const validVehicles = vehicles.filter(v => v.location?.lat && v.location?.lon)
      if (validVehicles.length > 0) {
        const bounds = validVehicles.map(v => [v.location.lat, v.location.lon])
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [vehicles, map])
  
  return null
}

const MapView = () => {
  const [vehicles, setVehicles] = useState([])
  const [ads, setAds] = useState([])
  const [placeNames, setPlaceNames] = useState({})
  const { theme } = useTheme()

  useEffect(() => {
    // Subscribe to vehicles collection
    const unsubVehicles = onSnapshot(collection(db, 'vehicles'), async (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setVehicles(data)
      
      // Fetch place names for all vehicles with locations
      for (const vehicle of data) {
        const lat = vehicle.location?.lat || vehicle.lastLocation?.lat
        const lon = vehicle.location?.lon || vehicle.lastLocation?.lon
        if (lat && lon && !placeNames[vehicle.id]) {
          const placeName = await getPlaceName(lat, lon)
          setPlaceNames(prev => ({ ...prev, [vehicle.id]: placeName }))
          
          // Also update the vehicle document with the address if not set
          if (!vehicle.location?.address && placeName !== 'Unknown location') {
            try {
              await updateDoc(doc(db, 'vehicles', vehicle.id), {
                'location.address': placeName
              })
            } catch (e) {
              // Ignore update errors
            }
          }
        }
      }
    })

    // Subscribe to ads collection
    const unsubAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setAds(data)
    })

    return () => {
      unsubVehicles()
      unsubAds()
    }
  }, [])

  // Get current ad for vehicle
  const getCurrentAd = (vehicle) => {
    if (vehicle.assignedAds?.length > 0) {
      const adId = vehicle.assignedAds[0].adId
      const ad = ads.find(a => a.id === adId)
      return ad?.title || 'Unknown Ad'
    }
    return 'No Ad'
  }

  // Format last update time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString()
  }

  // Default center (Islamabad)
  const defaultCenter = [33.6844, 73.0479]

  // Use theme from context
  const isDarkMode = theme === 'dark'

  return (
    <div className='w-full h-[520px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg relative map-container-enhanced'>
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        className="map-enhanced"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={isDarkMode 
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
          }
          subdomains={['a', 'b', 'c', 'd']}
        />
        <MapController vehicles={vehicles} />
        
        {vehicles.map(vehicle => {
          // Use location from vehicle or default
          const lat = vehicle.location?.lat || vehicle.lastLocation?.lat
          const lon = vehicle.location?.lon || vehicle.lastLocation?.lon
          
          if (!lat || !lon) return null
          
          const isActive = vehicle.status === 'Active'
          const currentAd = getCurrentAd(vehicle)
          const placeName = placeNames[vehicle.id] || vehicle.location?.address || 'Fetching location...'
          
          return (
            <Marker 
              key={vehicle.id} 
              position={[lat, lon]} 
              icon={isActive ? activeCarIcon : inactiveCarIcon}
            >
              <Popup>
                <div className="min-w-[220px] p-1">
                  <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2">
                    🚗 {vehicle.vehicleName || vehicle.carId || 'Vehicle'}
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-500">ID:</span>
                      <span className="font-medium">{vehicle.carId || vehicle.id.slice(0, 8)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Owner:</span>
                      <span className="font-medium">{vehicle.ownerName || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`font-bold ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {vehicle.status || 'Unknown'}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Current Ad:</span>
                      <span className="font-medium text-blue-600">{currentAd}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Last Update:</span>
                      <span className="font-medium">{formatTime(vehicle.lastHeartbeat)}</span>
                    </p>
                    <div className="pt-2 border-t">
                      <p className="text-gray-600 flex items-start gap-1">
                        <span>📍</span>
                        <span>{placeName}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Vehicle Status</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-rose-500"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Inactive</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapView
