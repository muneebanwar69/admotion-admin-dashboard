import React, { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { comparePassword } from '../utils/password'
import { loginRateLimiter } from '../utils/rateLimiter'

const DriverAuthContext = createContext()

export function useDriverAuth() {
  return useContext(DriverAuthContext)
}

export function DriverAuthProvider({ children }) {
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loginDriver(cnic, password) {
    try {
      // Normalize CNIC: strip dashes for comparison
      const normalizedCnic = cnic.replace(/\D/g, '')

      if (!loginRateLimiter.isAllowed(normalizedCnic)) {
        const remainingMs = loginRateLimiter.getRemainingTime(normalizedCnic)
        const remainingMins = Math.ceil(remainingMs / 60000)
        throw new Error(`Too many attempts. Try again in ${remainingMins} minute${remainingMins > 1 ? 's' : ''}.`)
      }

      // Query vehicles collection by CNIC (same collection used in vehicle registration)
      const vehiclesRef = collection(db, 'vehicles')

      // Try exact match first
      let snapshot = await getDocs(query(vehiclesRef, where('cnic', '==', cnic)))

      // Try normalized (without dashes)
      if (snapshot.empty) {
        snapshot = await getDocs(query(vehiclesRef, where('cnic', '==', normalizedCnic)))
      }

      // Try formatted version if plain digits were entered
      if (snapshot.empty && normalizedCnic.length === 13) {
        const formatted = `${normalizedCnic.slice(0, 5)}-${normalizedCnic.slice(5, 12)}-${normalizedCnic.slice(12)}`
        snapshot = await getDocs(query(vehiclesRef, where('cnic', '==', formatted)))
      }

      if (snapshot.empty) {
        throw new Error('No vehicle found with this CNIC')
      }

      const vehicleDoc = snapshot.docs[0]
      const vehicleData = vehicleDoc.data()

      // Check password
      let passwordMatch = false
      if (vehicleData.password) {
        if (vehicleData.password.startsWith('$2')) {
          passwordMatch = await comparePassword(password, vehicleData.password)
        } else {
          // Plain text password (legacy or as entered in vehicle wizard)
          if (vehicleData.password === password) {
            passwordMatch = true
            // Auto-migrate to bcrypt
            try {
              const { hashPassword } = await import('../utils/password')
              const hashed = await hashPassword(password)
              await updateDoc(doc(db, 'vehicles', vehicleDoc.id), { password: hashed })
            } catch (e) { /* silent */ }
          }
        }
      }

      if (!passwordMatch) {
        throw new Error('Invalid CNIC or password')
      }

      const user = {
        uid: vehicleDoc.id,
        name: vehicleData.ownerName || `${vehicleData.owner?.firstName || ''} ${vehicleData.owner?.lastName || ''}`.trim() || 'Driver',
        cnic: vehicleData.cnic,
        phone: vehicleData.phone || vehicleData.owner?.phone || '',
        email: vehicleData.owner?.email || vehicleData.email || '',
        profileImage: vehicleData.profileImage || '',
        assignedVehicleId: vehicleDoc.id,
        assignedVehiclePlate: vehicleData.plateNumber || vehicleData.carId || '',
        vehicleName: vehicleData.vehicleName || '',
        status: vehicleData.status || 'Active',
        role: 'driver'
      }

      setDriver(user)
      localStorage.setItem('currentDriver', JSON.stringify(user))
      loginRateLimiter.reset(normalizedCnic)

      return user
    } catch (error) {
      throw new Error(error.message || 'Login failed')
    }
  }

  async function logoutDriver() {
    setDriver(null)
    localStorage.removeItem('currentDriver')
  }

  useEffect(() => {
    const stored = localStorage.getItem('currentDriver')
    if (stored) {
      try {
        setDriver(JSON.parse(stored))
      } catch (e) {
        localStorage.removeItem('currentDriver')
      }
    }
    setLoading(false)
  }, [])

  const value = {
    driver,
    loginDriver,
    logoutDriver,
    isAuthenticated: !!driver
  }

  return (
    <DriverAuthContext.Provider value={value}>
      {!loading && children}
    </DriverAuthContext.Provider>
  )
}
