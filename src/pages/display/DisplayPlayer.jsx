import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Wifi, WifiOff, Zap, Clock } from 'lucide-react'
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc, getDoc, increment } from 'firebase/firestore'
import { db } from '../../firebase'

// Heartbeat interval (60s) and GPS interval (30s)
const HEARTBEAT_MS = 60_000
const GPS_MS = 30_000
const AD_DURATION_DEFAULT = 10_000 // 10s per ad if no duration set

const DisplayPlayer = () => {
  const navigate = useNavigate()
  const vehicleDocId = localStorage.getItem('display_vehicle_id')
  const vehicleCarId = localStorage.getItem('display_vehicle_carId') || ''
  const vehicleName = localStorage.getItem('display_vehicle_name') || ''

  const [ads, setAds] = useState([])
  const [adDetails, setAdDetails] = useState({}) // adId -> ad data
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastHeartbeat, setLastHeartbeat] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showOverlay, setShowOverlay] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const videoRef = useRef(null)
  const timerRef = useRef(null)

  // Redirect if not setup
  useEffect(() => {
    if (!vehicleDocId) navigate('/display/setup', { replace: true })
  }, [vehicleDocId, navigate])

  // Set Inactive when display closes / tab closes / navigates away
  useEffect(() => {
    if (!vehicleDocId) return
    const setInactive = () => {
      // Use sendBeacon for reliability on page unload
      const payload = JSON.stringify({
        status: 'Inactive',
        'displayDevice.lastDisconnect': new Date().toISOString(),
      })
      // Fallback: try updateDoc (may not complete on unload)
      updateDoc(doc(db, 'vehicles', vehicleDocId), {
        status: 'Inactive',
        'displayDevice.lastDisconnect': new Date().toISOString(),
      }).catch(() => {})
    }
    window.addEventListener('beforeunload', setInactive)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && vehicleDocId) {
        updateDoc(doc(db, 'vehicles', vehicleDocId), {
          status: 'Inactive',
        }).catch(() => {})
      } else if (document.visibilityState === 'visible' && vehicleDocId) {
        updateDoc(doc(db, 'vehicles', vehicleDocId), {
          status: 'Active',
          lastSeen: serverTimestamp(),
        }).catch(() => {})
      }
    })
    return () => {
      window.removeEventListener('beforeunload', setInactive)
      // Also set inactive on React cleanup (navigation away)
      setInactive()
    }
  }, [vehicleDocId])

  // Update clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Hide overlay after 5s
  useEffect(() => {
    const t = setTimeout(() => setShowOverlay(false), 5000)
    return () => clearTimeout(t)
  }, [])

  // Show overlay on mouse move / touch
  useEffect(() => {
    let hideTimer
    const show = () => {
      setShowOverlay(true)
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => setShowOverlay(false), 3000)
    }
    window.addEventListener('mousemove', show)
    window.addEventListener('touchstart', show)
    return () => {
      window.removeEventListener('mousemove', show)
      window.removeEventListener('touchstart', show)
      clearTimeout(hideTimer)
    }
  }, [])

  // Listen to assigned ads on the vehicle doc
  useEffect(() => {
    if (!vehicleDocId) return
    const unsub = onSnapshot(doc(db, 'vehicles', vehicleDocId), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        const assigned = data.assignedAds || []
        // Filter to currently active ads
        const now = new Date().toISOString()
        const active = assigned.filter(a => {
          if (!a.adId) return false
          if (a.endTime && a.endTime < now) return false
          return true
        })
        setAds(active)
      }
    })
    return () => unsub()
  }, [vehicleDocId])

  // Fetch ad details for each assigned ad
  useEffect(() => {
    if (ads.length === 0) return
    const fetchDetails = async () => {
      const details = {}
      for (const ad of ads) {
        if (ad.adId && !adDetails[ad.adId]) {
          try {
            const snap = await getDoc(doc(db, 'ads', ad.adId))
            if (snap.exists()) details[ad.adId] = { id: snap.id, ...snap.data() }
          } catch (e) { /* silent */ }
        }
      }
      if (Object.keys(details).length > 0) {
        setAdDetails(prev => ({ ...prev, ...details }))
      }
    }
    fetchDetails()
  }, [ads])

  // Auto-advance ads
  useEffect(() => {
    if (ads.length === 0) return
    clearTimeout(timerRef.current)

    const currentAd = ads[currentIndex % ads.length]
    const detail = adDetails[currentAd?.adId]

    // For videos, wait for video end event. For images, use duration or default.
    if (detail?.type === 'Video' || detail?.mediaType === 'Video') {
      // Video: advance handled by onEnded
      return
    }

    const duration = (detail?.duration ? parseInt(detail.duration) * 1000 : null) || AD_DURATION_DEFAULT

    timerRef.current = setTimeout(() => {
      advanceAd()
    }, duration)

    return () => clearTimeout(timerRef.current)
  }, [currentIndex, ads, adDetails])

  const advanceAd = useCallback(() => {
    if (ads.length <= 1) {
      setCurrentIndex(0)
      return
    }
    setTransitioning(true)
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % ads.length)
      setTransitioning(false)
    }, 500)
  }, [ads.length])

  // Log impression when ad changes
  useEffect(() => {
    if (ads.length === 0 || !vehicleDocId) return
    const currentAd = ads[currentIndex % ads.length]
    if (!currentAd?.adId) return

    const logImpression = async () => {
      try {
        await addDoc(collection(db, 'impressions'), {
          adId: currentAd.adId,
          vehicleId: vehicleDocId,
          carId: vehicleCarId,
          duration: AD_DURATION_DEFAULT / 1000,
          timestamp: serverTimestamp(),
          date: new Date().toISOString().split('T')[0],
        })
      } catch (e) { /* silent - might fail offline */ }
    }
    logImpression()
  }, [currentIndex, vehicleDocId])

  // Heartbeat
  useEffect(() => {
    if (!vehicleDocId) return
    const sendHeartbeat = async () => {
      try {
        await updateDoc(doc(db, 'vehicles', vehicleDocId), {
          lastSeen: serverTimestamp(),
          status: 'Active',
          'displayDevice.lastHeartbeat': new Date().toISOString(),
          totalHoursOnline: increment(HEARTBEAT_MS / 3600000),
        })
        setLastHeartbeat(new Date())
      } catch (e) { /* silent */ }
    }
    sendHeartbeat() // Immediate
    const interval = setInterval(sendHeartbeat, HEARTBEAT_MS)
    return () => clearInterval(interval)
  }, [vehicleDocId])

  // GPS tracking
  useEffect(() => {
    if (!vehicleDocId || !navigator.geolocation) return
    const sendGPS = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await updateDoc(doc(db, 'vehicles', vehicleDocId), {
              currentLocation: {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              },
              'displayDevice.lastGPS': new Date().toISOString(),
            })
          } catch (e) { /* silent */ }
        },
        () => { /* GPS error - silent */ },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
    sendGPS() // Immediate
    const interval = setInterval(sendGPS, GPS_MS)
    return () => clearInterval(interval)
  }, [vehicleDocId])

  // Current ad
  const currentAd = ads.length > 0 ? ads[currentIndex % ads.length] : null
  const currentAdDetail = currentAd ? adDetails[currentAd.adId] : null
  const mediaContent = currentAdDetail?.mediaBase64 || currentAdDetail?.mediaUrl || currentAdDetail?.preview || ''
  const isVideo = currentAdDetail?.type === 'Video' || currentAdDetail?.mediaType === 'Video'

  // Reset device
  const handleReset = async () => {
    if (vehicleDocId) {
      try {
        await updateDoc(doc(db, 'vehicles', vehicleDocId), {
          status: 'Inactive',
          'displayDevice.lastDisconnect': new Date().toISOString(),
        })
      } catch (e) { /* silent */ }
    }
    localStorage.removeItem('display_vehicle_id')
    localStorage.removeItem('display_vehicle_carId')
    localStorage.removeItem('display_vehicle_name')
    navigate('/display/setup')
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden cursor-none select-none" onClick={() => setShowOverlay(true)}>
      {/* Ad Content */}
      <AnimatePresence mode="wait">
        {currentAdDetail && mediaContent ? (
          <motion.div
            key={`ad-${currentIndex}`}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            {isVideo ? (
              <video
                ref={videoRef}
                src={mediaContent}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                onEnded={advanceAd}
                onError={advanceAd}
              />
            ) : (
              <img
                src={mediaContent}
                alt={currentAdDetail.title || 'Ad'}
                className="w-full h-full object-cover"
                onError={advanceAd}
              />
            )}
          </motion.div>
        ) : (
          /* Default screen when no ads */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1452] via-[#111b68] to-[#0B1452]">
            {/* Animated background */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.1, 0.3, 0.1],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 4,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                  }}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Logo & message */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10 text-center"
            >
              <motion.div
                animate={{ boxShadow: ['0 0 30px rgba(251,191,36,0.15)', '0 0 60px rgba(251,191,36,0.3)', '0 0 30px rgba(251,191,36,0.15)'] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl"
              >
                <Zap className="w-12 h-12 text-white" />
              </motion.div>
              <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
                Ad<span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">Motion</span>
              </h1>
              <p className="text-white/30 text-xl">Intelligent Vehicle Advertising</p>

              {/* Pulsing ring */}
              <div className="mt-10 flex justify-center">
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 w-4 h-4 bg-cyan-400 rounded-full"
                  />
                  <div className="w-4 h-4 bg-cyan-400 rounded-full" />
                </div>
              </div>
              <p className="text-white/20 text-sm mt-4">Waiting for ads to be assigned...</p>
              <p className="text-white/10 text-xs mt-2">{vehicleCarId} - {vehicleName}</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      {ads.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 z-30">
          <motion.div
            key={`progress-${currentIndex}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: (currentAdDetail?.duration ? parseInt(currentAdDetail.duration) : AD_DURATION_DEFAULT / 1000),
              ease: 'linear'
            }}
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
          />
        </div>
      )}

      {/* Ad indicator dots */}
      {ads.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
          {ads.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentIndex % ads.length
                  ? 'w-6 bg-amber-400 shadow-lg shadow-amber-400/50'
                  : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Status overlay - shows on hover/touch */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-20 pointer-events-none"
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 pointer-events-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white/90 text-sm font-semibold">AdMotion Display</p>
                    <p className="text-white/40 text-[10px] font-mono">{vehicleCarId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Connection status */}
                  <div className="flex items-center gap-1.5">
                    {isOnline ? (
                      <Wifi className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-xs ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  {/* Ad count */}
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-white/60 text-xs">{ads.length} ads</span>
                  </div>

                  {/* Clock */}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-white/40" />
                    <span className="text-white/60 text-xs font-mono">
                      {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current ad info - bottom left */}
            {currentAdDetail && (
              <div className="absolute bottom-8 left-4 bg-black/50 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 pointer-events-auto">
                <p className="text-white/90 text-sm font-medium">{currentAdDetail.title || 'Advertisement'}</p>
                <p className="text-white/40 text-[10px]">
                  {currentAdDetail.company || 'Advertiser'} - {currentIndex + 1}/{ads.length}
                </p>
              </div>
            )}

            {/* Reset button - bottom right (hidden, triple-tap to reveal) */}
            <div className="absolute bottom-8 right-4 pointer-events-auto">
              <button
                onClick={handleReset}
                className="text-white/10 text-[10px] hover:text-white/40 transition-colors"
              >
                Reset Device
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DisplayPlayer
