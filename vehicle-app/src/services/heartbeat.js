import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { getDB } from './firebase'
import { getGPSLocation, watchGPSLocation, stopWatchingGPS } from './gps'
import { updateLocation } from './api'
import { useVehicleStore } from '../store/vehicleStore'

let heartbeatInterval = null
let quickLocationInterval = null
let startTime = Date.now()

// Get current ad IDs from store
function getCurrentAdIds() {
  const store = useVehicleStore.getState()
  const currentAd = store.currentAd
  // All screens show the same ad
  return {
    front: currentAd?.id || null,
    back: currentAd?.id || null,
    left: currentAd?.id || null,
    right: currentAd?.id || null
  }
}

// Get battery level (if available)
async function getBatteryLevel() {
  try {
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery()
      return Math.round(battery.level * 100)
    }
    return null
  } catch (error) {
    return null
  }
}

// Get uptime hours
function getUptimeHours() {
  const uptimeMs = Date.now() - startTime
  return (uptimeMs / 1000 / 60 / 60).toFixed(2)
}

// Update vehicle location in Firestore directly (real-time for dashboard map)
async function updateVehicleLocationInFirestore(vehicleId, location) {
  try {
    const db = getDB()
    const store = useVehicleStore.getState()
    const currentAd = store.currentAd
    
    await updateDoc(doc(db, 'vehicles', vehicleId), {
      location: {
        lat: location.lat,
        lon: location.lon,
        accuracy: location.accuracy,
        address: location.address || null,
        lastUpdated: new Date().toISOString()
      },
      lastHeartbeat: serverTimestamp(),
      lastSeen: serverTimestamp(),
      isOnline: true,
      currentlyPlaying: currentAd ? {
        adId: currentAd.id,
        title: currentAd.title,
        startedAt: new Date().toISOString()
      } : null
    })
    console.log('📍 Location updated in Firestore:', location.lat?.toFixed(4), location.lon?.toFixed(4))
  } catch (error) {
    console.error('❌ Failed to update location in Firestore:', error)
  }
}

// Send full heartbeat with all data
async function sendHeartbeat(vehicleId) {
  try {
    const location = await getGPSLocation()
    const battery = await getBatteryLevel()
    const adIds = getCurrentAdIds()

    const status = {
      vehicle_id: vehicleId,
      timestamp: new Date().toISOString(),
      is_online: true,
      location: {
        lat: location.lat,
        lon: location.lon,
        accuracy: location.accuracy,
        address: null
      },
      screens: {
        front: { ad_id: adIds.front, status: adIds.front ? 'playing' : 'idle' },
        back: { ad_id: adIds.back, status: adIds.back ? 'playing' : 'idle' },
        left: { ad_id: adIds.left, status: adIds.left ? 'playing' : 'idle' },
        right: { ad_id: adIds.right, status: adIds.right ? 'playing' : 'idle' }
      },
      system: {
        memory_mb: (performance.memory?.usedJSHeapSize / 1024 / 1024).toFixed(2) || null,
        connection: navigator.onLine ? 'online' : 'offline',
        battery: battery,
        uptime_hours: getUptimeHours(),
        last_reload: localStorage.getItem('last_reload') || new Date().toISOString(),
        user_agent: navigator.userAgent,
        pwa_mode: window.matchMedia('(display-mode: standalone)').matches
      }
    }

    // Update Firebase Firestore status subcollection
    try {
      const db = getDB()
      await setDoc(doc(db, 'vehicles', vehicleId, 'status', 'current'), status, { merge: true })
    } catch (error) {
      console.error('❌ Failed to update Firebase status:', error)
    }

    // Update vehicle document with location
    await updateVehicleLocationInFirestore(vehicleId, location)

    // Send to backend REST API (optional)
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/device/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status)
      })
    } catch (error) {
      // Silent fail for backend API
    }

    // Update location via API
    await updateLocation(vehicleId, location)

    console.log('💓 Heartbeat sent:', {
      location: `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`,
      ads: Object.values(adIds).filter(Boolean).length,
      online: navigator.onLine
    })

    // Update store with last location
    useVehicleStore.getState().setLastLocation(location)
    useVehicleStore.getState().setLastHeartbeat(new Date().toISOString())
  } catch (error) {
    console.error('❌ Heartbeat failed:', error)
  }
}

// Start heartbeat service
export function startHeartbeat(vehicleId) {
  if (heartbeatInterval) {
    console.warn('⚠️ Heartbeat already running')
    return
  }

  console.log(`💓 Starting heartbeat for vehicle: ${vehicleId}`)

  // Start GPS watching for continuous location updates
  watchGPSLocation(async (location) => {
    // Update location in Firestore on every GPS update
    await updateVehicleLocationInFirestore(vehicleId, location)
    useVehicleStore.getState().setLastLocation(location)
  })

  // Quick location updates every 30 seconds
  quickLocationInterval = setInterval(async () => {
    try {
      const location = await getGPSLocation()
      await updateVehicleLocationInFirestore(vehicleId, location)
    } catch (error) {
      console.error('❌ Quick location update failed:', error)
    }
  }, 30000)

  // Full heartbeat every 60 seconds
  heartbeatInterval = setInterval(() => sendHeartbeat(vehicleId), 60000)

  // Send initial heartbeat immediately
  setTimeout(() => sendHeartbeat(vehicleId), 2000)

  // Listen for service worker sync events
  window.addEventListener('sw-location-sync', async () => {
    console.log('📍 SW triggered location sync')
    try {
      const location = await getGPSLocation()
      await updateVehicleLocationInFirestore(vehicleId, location)
    } catch (error) {
      console.error('❌ SW location sync failed:', error)
    }
  })

  window.addEventListener('sw-heartbeat-sync', () => {
    console.log('💓 SW triggered heartbeat sync')
    sendHeartbeat(vehicleId)
  })

  // Handle app visibility changes
  window.addEventListener('app-visible', () => {
    console.log('👁️ App visible - sending heartbeat')
    sendHeartbeat(vehicleId)
  })

  // Handle online event
  window.addEventListener('app-online', () => {
    console.log('🌐 Back online - sending heartbeat')
    sendHeartbeat(vehicleId)
  })
}

// Stop heartbeat service
export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
  if (quickLocationInterval) {
    clearInterval(quickLocationInterval)
    quickLocationInterval = null
  }
  stopWatchingGPS()
  console.log('✅ Heartbeat stopped')
}

// Export for manual triggering
export { sendHeartbeat }





