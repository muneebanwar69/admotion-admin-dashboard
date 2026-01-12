import { getDB } from './firebase'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Authenticate vehicle using Firestore
 * Uses CNIC (driver's national ID) and password assigned by admin
 */
export async function authenticateVehicle(cnic, password) {
  try {
    const db = getDB()
    
    // Find vehicle by CNIC
    const vehiclesRef = collection(db, 'vehicles')
    const q = query(vehiclesRef, where('cnic', '==', cnic))
    const querySnapshot = await getDocs(q)
    
    let vehicle = null
    let vehicleDocId = null
    
    if (!querySnapshot.empty) {
      // Found by CNIC
      const docSnap = querySnapshot.docs[0]
      vehicle = docSnap.data()
      vehicleDocId = docSnap.id
    } else {
      // Also try Step2 CNIC field (owner bank details)
      const q2 = query(vehiclesRef, where('step2.cnic', '==', cnic))
      const querySnapshot2 = await getDocs(q2)
      
      if (!querySnapshot2.empty) {
        const docSnap = querySnapshot2.docs[0]
        vehicle = docSnap.data()
        vehicleDocId = docSnap.id
      }
    }
    
    if (!vehicle) {
      throw new Error('Vehicle not found. Please check your CNIC.')
    }
    
    // Check password
    if (vehicle.password !== password) {
      throw new Error('Invalid password')
    }
    
    // Check if vehicle is active
    if (vehicle.status !== 'Active') {
      throw new Error('Vehicle is not active. Please contact administrator.')
    }
    
    console.log('✅ Vehicle authenticated by CNIC:', cnic, 'Doc ID:', vehicleDocId)
    
    // Return vehicle data with document ID
    return {
      vehicleId: vehicleDocId, // Use Firestore document ID
      carId: vehicle.carId,
      cnic: vehicle.cnic,
      vehicleName: vehicle.vehicleName,
      ownerName: vehicle.ownerName,
      ...vehicle
    }
  } catch (error) {
    console.error('❌ Authentication error:', error)
    throw error
  }
}

export async function getAdDetails(adId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/ads/${adId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ad: ${adId}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('❌ Failed to fetch ad details:', error)
    throw error
  }
}

export async function sendImpression(adId, vehicleId, durationSeconds, playQuality = 'full') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/device/impression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ad_id: adId,
        vehicle_id: vehicleId,
        duration_seconds: durationSeconds,
        play_quality: playQuality,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send impression')
    }

    return await response.json()
  } catch (error) {
    console.error('❌ Failed to send impression:', error)
    // Don't throw - we don't want to break playback if analytics fail
  }
}

export async function updateLocation(vehicleId, location) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/device/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_id: vehicleId,
        lat: location.lat,
        lon: location.lon,
        address: location.address,
        accuracy: location.accuracy
      })
    })

    if (!response.ok) {
      throw new Error('Failed to update location')
    }

    return await response.json()
  } catch (error) {
    console.error('❌ Failed to update location:', error)
    // Don't throw - location updates are not critical
  }
}


