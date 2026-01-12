import React, { useState, useEffect, useRef } from 'react'
import { useVehicleStore } from '../store/vehicleStore'
import { authenticateVehicle } from '../services/api'

export default function LoginScreen() {
  const { setVehicleId, setPassword, setAuthenticated } = useVehicleStore()
  const [cnic, setCnicLocal] = useState('')
  const [password, setPasswordLocal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const cnicRef = useRef(null)
  const passwordRef = useRef(null)
  const submitRef = useRef(null)

  // Check if PWA can be installed
  useEffect(() => {
    if (window.deferredPrompt) {
      setShowInstallPrompt(true)
    }
    
    window.addEventListener('beforeinstallprompt', () => {
      setShowInstallPrompt(true)
    })
  }, [])

  // Handle TV remote navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // TV Remote typically uses Enter key for selection
      if (e.key === 'Enter' && document.activeElement === submitRef.current) {
        return // Let the form handle it
      }
      
      // D-pad navigation
      if (e.key === 'ArrowDown') {
        if (document.activeElement === cnicRef.current) {
          passwordRef.current?.focus()
        } else if (document.activeElement === passwordRef.current) {
          submitRef.current?.focus()
        }
      }
      
      if (e.key === 'ArrowUp') {
        if (document.activeElement === submitRef.current) {
          passwordRef.current?.focus()
        } else if (document.activeElement === passwordRef.current) {
          cnicRef.current?.focus()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleInstallPWA = async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt()
      const { outcome } = await window.deferredPrompt.userChoice
      console.log('PWA install outcome:', outcome)
      window.deferredPrompt = null
      setShowInstallPrompt(false)
    }
  }

  // Format CNIC as user types (XXXXX-XXXXXXX-X)
  const formatCnic = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as XXXXX-XXXXXXX-X
    if (digits.length <= 5) {
      return digits
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`
    }
  }

  const handleCnicChange = (e) => {
    const formatted = formatCnic(e.target.value)
    setCnicLocal(formatted)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Authenticate with Firestore using CNIC
      const vehicleData = await authenticateVehicle(cnic, password)

      // Save credentials - use Firestore document ID as vehicleId
      const firestoreVehicleId = vehicleData.vehicleId
      setVehicleId(firestoreVehicleId)
      setPassword(password)
      setAuthenticated(true)

      // Save credentials to localStorage for persistent login
      localStorage.setItem('vehicle_id', firestoreVehicleId)
      localStorage.setItem('vehicle_password', password)
      localStorage.setItem('vehicle_cnic', cnic)
      localStorage.setItem('vehicle_carId', vehicleData.carId || '')
      localStorage.setItem('last_reload', new Date().toISOString())

      console.log('✅ Vehicle authenticated and saved:', firestoreVehicleId)
    } catch (error) {
      console.error('❌ Authentication failed:', error)
      setError(error.message || 'Invalid CNIC or password. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="w-full max-w-lg px-8 relative z-10">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20">
          {/* Logo/Header */}
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20 shadow-lg">
              <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-3 tracking-tight">
              AdMotion
            </h1>
            <p className="text-white/70 text-lg">
              Vehicle Display System
            </p>
          </div>

          {/* Install PWA Prompt */}
          {showInstallPrompt && (
            <div className="mb-6 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-green-200 font-semibold text-sm">Install App</p>
                    <p className="text-green-300/70 text-xs">For better TV experience</p>
                  </div>
                </div>
                <button
                  onClick={handleInstallPWA}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  Install
                </button>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4">
                <p className="text-red-200 text-sm font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="cnic" className="block text-sm font-semibold text-white/90 mb-2">
                Driver CNIC
              </label>
              <input
                ref={cnicRef}
                id="cnic"
                type="text"
                value={cnic}
                onChange={handleCnicChange}
                placeholder="35202-1234567-1"
                required
                maxLength={15}
                className="w-full px-5 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all hover:bg-white/15 font-mono tracking-wider"
                autoFocus
              />
              <p className="text-white/40 text-xs mt-1">Enter your CNIC registered with the vehicle</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white/90 mb-2">
                Password
              </label>
              <input
                ref={passwordRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPasswordLocal(e.target.value)}
                placeholder="Enter password assigned by admin"
                required
                className="w-full px-5 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all hover:bg-white/15"
              />
            </div>

            <button
              ref={submitRef}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-4 focus:ring-blue-400/50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Login & Start Display'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-white/50 text-sm">
              Need help? Contact your administrator
            </p>
            <p className="text-white/30 text-xs">
              v1.0.0 • PWA Enabled • TV Box Ready
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}




