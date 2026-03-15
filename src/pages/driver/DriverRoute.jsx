import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { MapPin, Navigation, Clock, Route, Wifi, WifiOff, Radar } from 'lucide-react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { useDriverAuth } from '../../contexts/DriverAuthContext'

/* ─── Helpers ─── */
const isValidCoord = (val) => typeof val === 'number' && !isNaN(val) && isFinite(val)

/* Pulsing radar animation for "waiting for GPS" state */
const RadarPulse = () => (
  <div className="relative flex items-center justify-center w-32 h-32 mx-auto mb-4">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute inset-0 rounded-full border-2 border-blue-400/40 dark:border-blue-500/30"
        initial={{ scale: 0.3, opacity: 0.8 }}
        animate={{ scale: 1.2, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
      />
    ))}
    <motion.div
      className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-md border border-blue-400/30 flex items-center justify-center"
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Radar className="w-7 h-7 text-blue-500 dark:text-blue-400" />
    </motion.div>
  </div>
)

/* Animated route trail dots */
const TrailDots = () => (
  <div className="flex items-center gap-1.5 justify-center mt-2">
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500"
        animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </div>
)

/* Shimmer loading block */
const ShimmerBlock = ({ className }) => (
  <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  </div>
)

/* ─── Main Component ─── */
const DriverRoute = () => {
  const { driver } = useDriverAuth()
  const [vehicle, setVehicle] = useState(null)
  const [location, setLocation] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [placeName, setPlaceName] = useState('Fetching location...')
  const [loading, setLoading] = useState(true)

  const detailsRef = useRef(null)
  const detailsInView = useInView(detailsRef, { once: true, margin: '-30px' })

  // Listen to vehicle data for GPS - FIXED: proper null/NaN guard
  useEffect(() => {
    if (!driver?.assignedVehicleId) { setLoading(false); return }
    const unsub = onSnapshot(doc(db, 'vehicles', driver.assignedVehicleId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setVehicle(data)

        // Safely extract location - guard against undefined, null, or NaN
        const loc = data.currentLocation || data.location
        if (loc) {
          const lat = loc.lat ?? loc.latitude
          const lng = loc.lng ?? loc.longitude
          if (isValidCoord(lat) && isValidCoord(lng)) {
            setLocation({ lat, lng })
            setLastUpdate(data.lastSeen?.toDate?.() || new Date())
          }
          // If lat/lng are not valid numbers, location stays null - no crash
        }
      }
      setLoading(false)
    })
    return () => unsub()
  }, [driver?.assignedVehicleId])

  // Reverse geocode - only when location is valid
  useEffect(() => {
    if (!location || !isValidCoord(location.lat) || !isValidCoord(location.lng)) return
    const fetchPlace = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=16`
        )
        const data = await res.json()
        const addr = data.address
        if (addr) {
          const parts = []
          if (addr.road) parts.push(addr.road)
          if (addr.neighbourhood) parts.push(addr.neighbourhood)
          else if (addr.suburb) parts.push(addr.suburb)
          if (addr.city || addr.town) parts.push(addr.city || addr.town)
          setPlaceName(parts.slice(0, 3).join(', ') || 'Unknown')
        } else {
          setPlaceName(data.display_name?.split(',').slice(0, 2).join(',') || 'Unknown')
        }
      } catch {
        setPlaceName('Location unavailable')
      }
    }
    fetchPlace()
  }, [location?.lat, location?.lng])

  const lastSeen = vehicle?.lastSeen?.toDate?.()
  const isFresh = lastSeen && (Date.now() - lastSeen.getTime()) < 2 * 60 * 1000
  const isOnline = vehicle?.status === 'Active' && isFresh !== false
  const hasValidLocation = location && isValidCoord(location.lat) && isValidCoord(location.lng)

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Live Route</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Vehicle location from roof screen GPS</p>
      </motion.div>

      {/* ─── Status Bar ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl p-4 border backdrop-blur-md ${
          isOnline
            ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-700/30'
            : 'bg-red-50/80 dark:bg-red-900/20 border-red-200/50 dark:border-red-700/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <motion.div
                className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center relative"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {/* Pulse ring */}
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-emerald-400/40"
                  animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            )}
            <div>
              <p className={`font-semibold text-sm ${isOnline ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                {isOnline ? 'Vehicle Online' : 'Vehicle Offline'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                GPS from roof-mounted screen
              </p>
            </div>
          </div>
          {lastUpdate && (
            <div className="text-right">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Last Update</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Map / GPS Waiting State ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
      >
        <div className="relative" style={{ height: '50vh', minHeight: '300px' }}>
          {loading ? (
            /* Shimmer loading state */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-700/30 p-6">
              <ShimmerBlock className="w-full h-full" />
            </div>
          ) : hasValidLocation ? (
            /* Map with overlay */
            <div className="relative w-full h-full">
              <iframe
                title="Vehicle Location"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${(location.lng - 0.01).toFixed(6)}%2C${(location.lat - 0.008).toFixed(6)}%2C${(location.lng + 0.01).toFixed(6)}%2C${(location.lat + 0.008).toFixed(6)}&layer=mapnik&marker=${location.lat.toFixed(6)}%2C${location.lng.toFixed(6)}`}
              />
              {/* Map overlay with location info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl p-3 border border-white/50 dark:border-slate-700/50 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{placeName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  </div>
                  <TrailDots />
                </div>
              </motion.div>
            </div>
          ) : (
            /* Beautiful "waiting for GPS" state */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-blue-900/10 p-6">
              <RadarPulse />
              <motion.p
                className="text-slate-600 dark:text-slate-300 font-semibold text-center"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {driver?.assignedVehicleId ? 'Waiting for GPS signal...' : 'No vehicle assigned'}
              </motion.p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center max-w-xs">
                Location comes from the roof screen's TV box. Make sure the vehicle screen is powered on.
              </p>
              <TrailDots />
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Location Details ─── */}
      <motion.div
        ref={detailsRef}
        initial={{ opacity: 0, y: 30 }}
        animate={detailsInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-500" />
            Current Location
          </h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <motion.div
              className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5"
              animate={hasValidLocation ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{placeName}</p>
              {hasValidLocation && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50/80 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-100/80 dark:border-blue-800/30 backdrop-blur-sm">
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5" />
              GPS data comes from the roof-mounted screen's TV box, not your phone.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

export default DriverRoute
