import React, { useEffect, useState } from 'react'
import { useVehicleStore } from './store/vehicleStore'
import LoginScreen from './components/LoginScreen'
import FourScreenLayout from './components/FourScreenLayout'
import StatusOverlay from './components/StatusOverlay'
import { initializeFirebase } from './services/firebase'
import { startHeartbeat } from './services/heartbeat'
import { requestNotificationPermission, listenForNotifications } from './services/firebase'

function App() {
  const { vehicleId, isAuthenticated, setAuthenticated } = useVehicleStore()
  const [firebaseReady, setFirebaseReady] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    // Initialize Firebase
    initializeFirebase()
      .then(() => {
        setFirebaseReady(true)
        console.log('✅ Firebase initialized')
        
        // Request notification permission
        requestNotificationPermission()
        
        // Listen for push notifications
        listenForNotifications()
      })
      .catch((error) => {
        console.error('❌ Firebase initialization failed:', error)
      })

    // Auto-login if credentials exist (persistent login)
    const savedVehicleId = localStorage.getItem('vehicle_id')
    const savedPassword = localStorage.getItem('vehicle_password')
    const savedCnic = localStorage.getItem('vehicle_cnic')
    
    if (savedCnic && savedPassword) {
      // Verify credentials are still valid using CNIC
      import('./services/api').then(({ authenticateVehicle }) => {
        authenticateVehicle(savedCnic, savedPassword)
          .then(() => {
            setAuthenticated(true)
            console.log('✅ Auto-login successful with CNIC')
          })
          .catch((error) => {
            console.error('❌ Auto-login failed, clearing credentials:', error)
            // Clear invalid credentials
            localStorage.removeItem('vehicle_id')
            localStorage.removeItem('vehicle_password')
            localStorage.removeItem('vehicle_cnic')
            localStorage.removeItem('vehicle_carId')
          })
      })
    } else if (savedVehicleId && savedPassword) {
      // Legacy support: try with vehicle ID if CNIC not saved
      setAuthenticated(true)
      console.log('⚠️ Legacy auto-login (please re-login with CNIC for full support)')
    }

    // Toggle debug overlay with Shift+D
    const handleKeyPress = (e) => {
      if (e.shiftKey && e.key === 'D') {
        setShowDebug((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    
    // Auto-reload on crash/unhandled errors
    const handleError = (event) => {
      console.error('❌ Unhandled error detected, reloading in 5 seconds...', event.error)
      setTimeout(() => {
        window.location.reload()
      }, 5000)
    }
    
    const handleUnhandledRejection = (event) => {
      console.error('❌ Unhandled promise rejection, reloading in 5 seconds...', event.reason)
      setTimeout(() => {
        window.location.reload()
      }, 5000)
    }
    
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && vehicleId && firebaseReady) {
      // Start heartbeat service
      startHeartbeat(vehicleId)
      console.log('💓 Heartbeat service started')
    }
  }, [isAuthenticated, vehicleId, firebaseReady])

  if (!firebaseReady) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Initializing...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <div className="fullscreen no-select">
      <FourScreenLayout />
      {showDebug && <StatusOverlay />}
    </div>
  )
}

export default App


