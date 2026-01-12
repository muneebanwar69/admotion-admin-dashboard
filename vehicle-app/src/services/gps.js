let lastLocation = null
let watchId = null

// Get current GPS location
export async function getGPSLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS not available'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        }
        
        lastLocation = location
        resolve(location)
      },
      (error) => {
        console.error('❌ GPS error:', error)
        // Return last known location if available
        if (lastLocation) {
          resolve(lastLocation)
        } else {
          reject(error)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  })
}

// Start watching GPS location
export function watchGPSLocation(callback) {
  if (watchId) {
    return // Already watching
  }

  if (!navigator.geolocation) {
    console.error('❌ GPS not available')
    return
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      }
      
      lastLocation = location
      callback(location)
    },
    (error) => {
      console.error('❌ GPS watch error:', error)
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // Accept cached location up to 30 seconds old
    }
  )

  console.log('✅ GPS watching started')
}

// Stop watching GPS location
export function stopWatchingGPS() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
    console.log('✅ GPS watching stopped')
  }
}

// Get last known location
export function getLastLocation() {
  return lastLocation
}





