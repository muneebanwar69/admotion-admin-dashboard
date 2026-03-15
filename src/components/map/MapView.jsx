import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useTheme } from '../../contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Navigation, RefreshCw, Car, Radio, Eye, Megaphone,
  Search, ChevronRight, ChevronLeft, Maximize2, Minimize2,
  Locate, Layers, Activity, Wifi, WifiOff, Clock, User,
  Image, Gauge, Compass, X, MonitorPlay
} from 'lucide-react'

// ─── Car SVG Icons (kept exactly as original) ────────────────────────────────

const activeCarIcon = new L.DivIcon({
  className: 'custom-car-marker',
  html: `<div style="
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  ">
    <div class="marker-pulse-green" style="
      position: absolute;
      width: 48px;
      height: 48px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0) 70%);
      border-radius: 50%;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    "></div>
    <div style="
      position: relative;
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px rgba(16, 185, 129, 0.4), 0 0 0 4px rgba(16, 185, 129, 0.1);
      border: 3px solid white;
    ">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    </div>
  </div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -24],
})

const inactiveCarIcon = new L.DivIcon({
  className: 'custom-car-marker',
  html: `<div style="
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  ">
    <div class="marker-pulse-red" style="
      position: absolute;
      width: 48px;
      height: 48px;
      background: radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0) 70%);
      border-radius: 50%;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    "></div>
    <div style="
      position: relative;
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px rgba(239, 68, 68, 0.4), 0 0 0 4px rgba(239, 68, 68, 0.1);
      border: 3px solid white;
    ">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    </div>
  </div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -24],
})

// ─── Reverse Geocoding ───────────────────────────────────────────────────────

const geocodeCache = new Map()

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
    console.error('Geocoding error:', error)
    return 'Unknown location'
  }
}

// ─── Tile Layer URLs ─────────────────────────────────────────────────────────

const TILE_LAYERS = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: ['a', 'b', 'c', 'd'],
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: ['a', 'b', 'c', 'd'],
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    subdomains: [],
  },
}

// ─── MapController ───────────────────────────────────────────────────────────

function MapController({ vehicles, flyTo, onMapReady }) {
  const map = useMap()

  useEffect(() => {
    if (onMapReady) onMapReady(map)
  }, [map, onMapReady])

  useEffect(() => {
    if (flyTo) {
      map.flyTo(flyTo, 16, { duration: 1.5 })
    }
  }, [flyTo, map])

  return null
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function MapSkeleton() {
  return (
    <div className="w-full h-[520px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-32 mx-auto rounded bg-slate-200 dark:bg-slate-700 mb-2" />
        <div className="h-3 w-24 mx-auto rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 text-center shadow-2xl border border-slate-200/50 dark:border-slate-700/50 pointer-events-auto">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
          <Car className="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">No Vehicles Found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[240px]">
          No vehicles with location data are currently available to display on the map.
        </p>
      </div>
    </div>
  )
}

// ─── Stat Badge ──────────────────────────────────────────────────────────────

function StatBadge({ icon: Icon, label, value, color, pulse }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium
        bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm
        border border-slate-200/60 dark:border-slate-700/60 shadow-sm`}
    >
      <div className="relative">
        <Icon className={`w-4 h-4 ${color}`} />
        {pulse && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        )}
      </div>
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </motion.div>
  )
}

// ─── Map Style Selector ──────────────────────────────────────────────────────

function MapStyleToggle({ current, onChange }) {
  const styles = [
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
    { key: 'satellite', label: 'Satellite' },
  ]

  return (
    <div className="flex items-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-0.5 shadow-sm">
      {styles.map(s => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
            current === s.key
              ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md shadow-indigo-500/25'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

// ─── Vehicle Panel Card ──────────────────────────────────────────────────────

function VehicleCard({ vehicle, currentAd, placeName, isSelected, onClick }) {
  const isActive = vehicle.status === 'Active'

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${
        isSelected
          ? 'bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-violet-300 dark:border-violet-600 shadow-md shadow-violet-500/10'
          : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <div className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isActive
            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/30'
            : 'bg-gradient-to-br from-red-400 to-red-600 shadow-md shadow-red-500/30'
        }`}>
          <Car className="w-4.5 h-4.5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
              {vehicle.vehicleName || vehicle.carId || 'Vehicle'}
            </span>
            <span className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide ${
              isActive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
            }`}>
              {isActive ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Ad info */}
          <div className="flex items-center gap-1 mb-0.5">
            <MonitorPlay className="w-3 h-3 text-indigo-400 flex-shrink-0" />
            <span className="text-xs text-indigo-500 dark:text-indigo-400 truncate">{currentAd}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{placeName}</span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}

// ─── Main MapView Component ──────────────────────────────────────────────────

const MapView = () => {
  const [vehicles, setVehicles] = useState([])
  const [ads, setAds] = useState([])
  const [placeNames, setPlaceNames] = useState({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mapStyle, setMapStyle] = useState('light')
  const [panelOpen, setPanelOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)
  const [flyTo, setFlyTo] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const mapRef = useRef(null)
  const containerRef = useRef(null)
  const { theme } = useTheme()

  // Sync map style with theme on initial load
  useEffect(() => {
    setMapStyle(theme === 'dark' ? 'dark' : 'light')
  }, [])

  // ─── Computed ────────────────────────────────────────────────────────

  const activeVehicles = vehicles.filter(v => v.status === 'Active').length
  const totalVehicles = vehicles.length
  const vehiclesWithLocation = useMemo(
    () => vehicles.filter(v => v.currentLocation?.lat || v.location?.lat || v.lastLocation?.lat),
    [vehicles]
  )

  const filteredVehicles = useMemo(() => {
    if (!searchQuery.trim()) return vehiclesWithLocation
    const q = searchQuery.toLowerCase()
    return vehiclesWithLocation.filter(v =>
      (v.vehicleName || '').toLowerCase().includes(q) ||
      (v.carId || '').toLowerCase().includes(q) ||
      (v.ownerName || '').toLowerCase().includes(q) ||
      (placeNames[v.id] || '').toLowerCase().includes(q)
    )
  }, [vehiclesWithLocation, searchQuery, placeNames])

  // ─── Helpers ─────────────────────────────────────────────────────────

  const getCurrentAd = useCallback((vehicle) => {
    if (vehicle.assignedAds?.length > 0) {
      const adId = vehicle.assignedAds[0].adId
      const ad = ads.find(a => a.id === adId)
      return ad || null
    }
    return null
  }, [ads])

  const getCurrentAdName = useCallback((vehicle) => {
    const ad = getCurrentAd(vehicle)
    return ad?.title || 'No Ad Assigned'
  }, [getCurrentAd])

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = (now - date) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  const defaultCenter = [33.6844, 73.0479]

  // ─── Handlers ────────────────────────────────────────────────────────

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleFitAll = useCallback(() => {
    if (!mapRef.current || vehiclesWithLocation.length === 0) return
    const bounds = vehiclesWithLocation.map(v => [
      v.currentLocation?.lat || v.location?.lat || v.lastLocation?.lat,
      v.currentLocation?.lng || v.currentLocation?.lon || v.location?.lon || v.lastLocation?.lon,
    ])
    mapRef.current.fitBounds(bounds, { padding: [50, 50], duration: 1 })
  }, [vehiclesWithLocation])

  const handleLocateMe = useCallback(() => {
    if (!mapRef.current) return
    mapRef.current.locate({ setView: true, maxZoom: 16 })
  }, [])

  const handleVehicleClick = useCallback((vehicle) => {
    const lat = vehicle.currentLocation?.lat || vehicle.location?.lat || vehicle.lastLocation?.lat
    const lon = vehicle.currentLocation?.lng || vehicle.currentLocation?.lon || vehicle.location?.lon || vehicle.lastLocation?.lon
    if (lat && lon) {
      setSelectedVehicleId(vehicle.id)
      setFlyTo([lat, lon])
      // Reset flyTo after animation to allow re-click
      setTimeout(() => setFlyTo(null), 2000)
    }
  }, [])

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setIsFullscreen(f => !f)
  }, [isFullscreen])

  const handleMapReady = useCallback((map) => {
    mapRef.current = map
  }, [])

  // ─── Firebase Listeners ──────────────────────────────────────────────

  useEffect(() => {
    const unsubVehicles = onSnapshot(collection(db, 'vehicles'), async (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setVehicles(data)
      setLoading(false)

      for (const vehicle of data) {
        const lat = vehicle.currentLocation?.lat || vehicle.location?.lat || vehicle.lastLocation?.lat
        const lon = vehicle.currentLocation?.lng || vehicle.currentLocation?.lon || vehicle.location?.lon || vehicle.lastLocation?.lon
        if (lat && lon && !placeNames[vehicle.id]) {
          const placeName = await getPlaceName(lat, lon)
          setPlaceNames(prev => ({ ...prev, [vehicle.id]: placeName }))

          if (!vehicle.location?.address && placeName !== 'Unknown location') {
            try {
              await updateDoc(doc(db, 'vehicles', vehicle.id), {
                'location.address': placeName,
              })
            } catch (e) {
              // Ignore
            }
          }
        }
      }
    })

    const unsubAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setAds(data)
    })

    return () => {
      unsubVehicles()
      unsubAds()
    }
  }, [])

  // ─── Tile layer config ───────────────────────────────────────────────

  const tile = TILE_LAYERS[mapStyle] || TILE_LAYERS.light

  // ─── Render ──────────────────────────────────────────────────────────

  if (loading) return <MapSkeleton />

  return (
    <div className="relative" ref={containerRef}>
      {/* ═══ Stats Header Bar ═══ */}
      <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
        {/* Left: stats badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatBadge
            icon={Car}
            label="Vehicles"
            value={`${activeVehicles}/${totalVehicles}`}
            color="text-slate-700 dark:text-slate-200"
          />
          <StatBadge
            icon={Wifi}
            label="Active"
            value={activeVehicles}
            color="text-emerald-600 dark:text-emerald-400"
            pulse
          />
          <StatBadge
            icon={WifiOff}
            label="Offline"
            value={totalVehicles - activeVehicles}
            color="text-red-500 dark:text-red-400"
          />

          {/* Real-time indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
            bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-700 dark:text-emerald-400">Real-time</span>
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          <MapStyleToggle current={mapStyle} onChange={setMapStyle} />

          {/* Fit All */}
          <button
            onClick={handleFitAll}
            title="Fit all vehicles"
            className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm
              border border-slate-200/60 dark:border-slate-700/60 shadow-sm
              text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400
              hover:border-violet-300 dark:hover:border-violet-600 transition-all duration-200"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            title="Refresh"
            className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm
              border border-slate-200/60 dark:border-slate-700/60 shadow-sm
              text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400
              hover:border-violet-300 dark:hover:border-violet-600 transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 transition-transform duration-700 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Toggle Panel */}
          <button
            onClick={() => setPanelOpen(p => !p)}
            title={panelOpen ? 'Hide vehicle panel' : 'Show vehicle panel'}
            className="p-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md shadow-indigo-500/25
              hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200"
          >
            {panelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ═══ Map + Side Panel ═══ */}
      <div className="flex gap-4">
        {/* ─── Map Area ─── */}
        <div className="flex-1 h-[520px] rounded-2xl overflow-hidden shadow-xl
          border border-slate-200/60 dark:border-slate-700/60 relative
          ring-1 ring-black/5 dark:ring-white/5">
          <MapContainer
            center={defaultCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            className="map-enhanced"
          >
            <TileLayer
              key={mapStyle}
              attribution={tile.attribution}
              url={tile.url}
              subdomains={tile.subdomains}
            />
            <MapController
              vehicles={vehicles}
              flyTo={flyTo}
              onMapReady={handleMapReady}
            />

            {vehiclesWithLocation.map(vehicle => {
              const lat = vehicle.currentLocation?.lat || vehicle.location?.lat || vehicle.lastLocation?.lat
              const lon = vehicle.currentLocation?.lng || vehicle.currentLocation?.lon || vehicle.location?.lon || vehicle.lastLocation?.lon
              if (!lat || !lon) return null

              const isActive = (() => {
                if (vehicle.status !== 'Active') return false
                const ts = vehicle.lastSeen
                if (!ts) return false
                const date = ts.toDate ? ts.toDate() : new Date(ts)
                return (new Date() - date) / 1000 < 300
              })()
              const adObj = getCurrentAd(vehicle)
              const adName = adObj?.title || 'No Ad Assigned'
              const placeName = placeNames[vehicle.id] || vehicle.location?.address || 'Fetching...'

              return (
                <Marker
                  key={vehicle.id}
                  position={[lat, lon]}
                  icon={isActive ? activeCarIcon : inactiveCarIcon}
                >
                  <Popup maxWidth={320} className="premium-popup">
                    <div className="min-w-[280px] p-1">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isActive
                              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                              : 'bg-gradient-to-br from-red-400 to-red-600'
                          }`}>
                            <Car className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-gray-800 leading-tight">
                              {vehicle.vehicleName || vehicle.carId || 'Vehicle'}
                            </h3>
                            <span className="text-[10px] text-gray-400">{vehicle.carId || vehicle.id.slice(0, 8)}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {isActive ? 'Online' : 'Offline'}
                        </span>
                      </div>

                      {/* Info rows */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-500 text-xs">Owner</span>
                          <span className="ml-auto font-medium text-xs text-gray-700">{vehicle.ownerName || 'N/A'}</span>
                        </div>

                        {/* Current Ad with thumbnail */}
                        <div className="flex items-center gap-2 text-gray-600">
                          <MonitorPlay className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          <span className="text-gray-500 text-xs">Current Ad</span>
                          <span className="ml-auto font-medium text-xs text-indigo-600 truncate max-w-[120px]">{adName}</span>
                        </div>
                        {adObj?.thumbnailUrl && (
                          <div className="ml-5 rounded-lg overflow-hidden border border-gray-100">
                            <img src={adObj.thumbnailUrl} alt="Ad preview" className="w-full h-16 object-cover" />
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                          <span className="text-gray-500 text-xs">Location</span>
                          <span className="ml-auto font-medium text-xs text-gray-700 truncate max-w-[140px]">{placeName}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="text-gray-500 text-xs">Heartbeat</span>
                          <span className="ml-auto font-medium text-xs text-gray-700">{formatTime(vehicle.lastHeartbeat)}</span>
                        </div>

                        {vehicle.speed != null && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Gauge className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                            <span className="text-gray-500 text-xs">Speed</span>
                            <span className="ml-auto font-medium text-xs text-gray-700">{vehicle.speed} km/h</span>
                          </div>
                        )}

                        {vehicle.heading != null && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Compass className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                            <span className="text-gray-500 text-xs">Heading</span>
                            <span className="ml-auto font-medium text-xs text-gray-700">{vehicle.heading}&deg;</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium
                          rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                          <Eye className="w-3 h-3" />
                          View Details
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium
                          rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                          <Megaphone className="w-3 h-3" />
                          Assign Ad
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>

          {/* No-vehicles overlay */}
          {vehiclesWithLocation.length === 0 && <EmptyState />}

          {/* Legend overlay */}
          <div className="absolute bottom-4 left-4 z-[1000]
            bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl shadow-lg
            p-3 border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Status</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-green-500 to-emerald-500" />
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Inactive</span>
              </div>
            </div>
          </div>

          {/* Floating map controls (bottom-right) */}
          <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
            <button
              onClick={handleLocateMe}
              title="My location"
              className="w-9 h-9 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl
                border border-slate-200/50 dark:border-slate-700/50 shadow-lg
                flex items-center justify-center text-slate-500 dark:text-slate-400
                hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200"
            >
              <Locate className="w-4 h-4" />
            </button>
            <button
              onClick={handleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="w-9 h-9 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl
                border border-slate-200/50 dark:border-slate-700/50 shadow-lg
                flex items-center justify-center text-slate-500 dark:text-slate-400
                hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ─── Vehicle Side Panel ─── */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="h-[520px] overflow-hidden flex-shrink-0"
            >
              <div className="w-80 h-full rounded-2xl overflow-hidden flex flex-col
                bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl
                border border-slate-200/60 dark:border-slate-700/60
                shadow-xl ring-1 ring-black/5 dark:ring-white/5">

                {/* Panel header */}
                <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                        <Car className="w-3.5 h-3.5 text-white" />
                      </div>
                      Vehicles
                    </h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {filteredVehicles.length} shown
                    </span>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search vehicles..."
                      className="w-full pl-9 pr-8 py-2 text-xs rounded-xl
                        bg-slate-100/80 dark:bg-slate-800/80
                        border border-slate-200/60 dark:border-slate-700/60
                        text-slate-700 dark:text-slate-200 placeholder-slate-400
                        focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400
                        transition-all duration-200"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full
                          hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <X className="w-3 h-3 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Vehicle list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin
                  scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600
                  scrollbar-track-transparent">
                  <AnimatePresence>
                    {filteredVehicles.length > 0 ? (
                      filteredVehicles.map(vehicle => (
                        <VehicleCard
                          key={vehicle.id}
                          vehicle={vehicle}
                          currentAd={getCurrentAdName(vehicle)}
                          placeName={placeNames[vehicle.id] || vehicle.location?.address || 'Loading...'}
                          isSelected={selectedVehicleId === vehicle.id}
                          onClick={() => handleVehicleClick(vehicle)}
                        />
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-40 text-center"
                      >
                        <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {searchQuery ? 'No matching vehicles' : 'No vehicles with location data'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Panel footer summary */}
                <div className="p-3 border-t border-slate-200/60 dark:border-slate-700/60
                  bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {activeVehicles} active of {totalVehicles}
                    </span>
                    <span className="flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      Live tracking
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default MapView
