import { create } from 'zustand'

export const useVehicleStore = create((set, get) => ({
  // Authentication
  vehicleId: localStorage.getItem('vehicle_id') || null,
  password: localStorage.getItem('vehicle_password') || null,
  isAuthenticated: !!localStorage.getItem('vehicle_id'),

  // Ads - Single ad displayed on all 4 screens at once
  currentAd: null,        // The ad currently being displayed
  adQueue: [],            // Queue of ads to rotate through
  currentAdIndex: 0,      // Current position in the queue

  // Status
  isOnline: navigator.onLine,
  lastLocation: null,
  lastHeartbeat: null,

  // Actions
  setAuthenticated: (value) => {
    set({ isAuthenticated: value })
  },

  setVehicleId: (id) => {
    localStorage.setItem('vehicle_id', id)
    set({ vehicleId: id })
  },

  setPassword: (pwd) => {
    localStorage.setItem('vehicle_password', pwd)
    set({ password: pwd })
  },

  // Set the current ad (displayed on all 4 screens)
  setCurrentAd: (ad) => {
    set({ currentAd: ad })
  },

  // Set the ad queue for rotation
  setAdQueue: (ads) => {
    set({ 
      adQueue: ads,
      currentAdIndex: 0,
      currentAd: ads.length > 0 ? ads[0] : null
    })
  },

  // Move to next ad in queue (all 4 screens change together)
  nextAd: () => {
    const { adQueue, currentAdIndex } = get()
    if (adQueue.length === 0) return
    
    const nextIndex = (currentAdIndex + 1) % adQueue.length
    set({
      currentAdIndex: nextIndex,
      currentAd: adQueue[nextIndex]
    })
  },

  // Legacy support - maps old format to new
  setAllAds: (ads) => {
    // Take the first available ad for display
    const firstAd = ads.front || ads.back || ads.left || ads.right
    if (firstAd) {
      const allAds = [ads.front, ads.back, ads.left, ads.right].filter(Boolean)
      // Remove duplicates by id
      const uniqueAds = allAds.filter((ad, index, self) => 
        index === self.findIndex(a => a.id === ad.id)
      )
      set({
        adQueue: uniqueAds,
        currentAdIndex: 0,
        currentAd: uniqueAds[0] || null
      })
    }
  },

  setLastLocation: (location) => {
    set({ lastLocation: location })
  },

  setLastHeartbeat: (timestamp) => {
    set({ lastHeartbeat: timestamp })
  },

  setOnlineStatus: (isOnline) => {
    set({ isOnline })
  }

  // Note: Logout functionality removed - vehicles stay logged in forever
}))

// Listen to online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useVehicleStore.getState().setOnlineStatus(true)
  })

  window.addEventListener('offline', () => {
    useVehicleStore.getState().setOnlineStatus(false)
  })
}




