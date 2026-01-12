// src/services/alertsService.js
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, query, orderBy, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore'

// Alert types and priorities
export const ALERT_TYPES = {
  ADS: 'Ads',
  VEHICLE: 'Vehicle', 
  SYSTEM: 'System'
}

export const ALERT_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
}

// Create a new alert
export const createAlert = async (alertData) => {
  try {
    const alert = {
      ...alertData,
      read: false,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, 'alerts'), alert)
    return { id: docRef.id, ...alert }
  } catch (error) {
    console.error('Error creating alert:', error)
    throw error
  }
}

// Mark alert as read
export const markAlertAsRead = async (alertId) => {
  try {
    await updateDoc(doc(db, 'alerts', alertId), {
      read: true,
      readAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error marking alert as read:', error)
    throw error
  }
}

// Mark all alerts as read
export const markAllAlertsAsRead = async () => {
  try {
    // In production, you would batch update all unread alerts
    console.log('Marking all alerts as read')
  } catch (error) {
    console.error('Error marking all alerts as read:', error)
    throw error
  }
}

// Listen to alerts in real-time
export const subscribeToAlerts = (callback) => {
  const alertsQuery = query(
    collection(db, 'alerts'),
    orderBy('timestamp', 'desc')
  )
  
  return onSnapshot(alertsQuery, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(alerts)
  })
}

// Listen to alerts by type
export const subscribeToAlertsByType = (type, callback) => {
  const alertsQuery = query(
    collection(db, 'alerts'),
    where('type', '==', type),
    orderBy('timestamp', 'desc')
  )
  
  return onSnapshot(alertsQuery, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(alerts)
  })
}

// Listen to unread alerts
export const subscribeToUnreadAlerts = (callback) => {
  const alertsQuery = query(
    collection(db, 'alerts'),
    where('read', '==', false),
    orderBy('timestamp', 'desc')
  )
  
  return onSnapshot(alertsQuery, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(alerts)
  })
}

// Alert creation helpers
export const createAdAlert = (title, message, priority = ALERT_PRIORITIES.MEDIUM) => {
  return createAlert({
    type: ALERT_TYPES.ADS,
    title,
    message,
    priority
  })
}

export const createVehicleAlert = (title, message, priority = ALERT_PRIORITIES.MEDIUM) => {
  return createAlert({
    type: ALERT_TYPES.VEHICLE,
    title,
    message,
    priority
  })
}

export const createSystemAlert = (title, message, priority = ALERT_PRIORITIES.LOW) => {
  return createAlert({
    type: ALERT_TYPES.SYSTEM,
    title,
    message,
    priority
  })
}

// Common alert scenarios
export const createAdExpiryAlert = (adId, daysLeft) => {
  return createAdAlert(
    'Ad Expiry Warning',
    `Ad ID ${adId} will expire in ${daysLeft} days`,
    daysLeft <= 2 ? ALERT_PRIORITIES.HIGH : ALERT_PRIORITIES.MEDIUM
  )
}

export const createLowBudgetAlert = (adId, remainingAmount) => {
  return createAdAlert(
    'Low Budget Warning',
    `Ad ID ${adId} is below PKR ${remainingAmount.toLocaleString()} remaining`,
    ALERT_PRIORITIES.MEDIUM
  )
}

export const createVehicleExpiryAlert = (vehicleId, expiryDate) => {
  return createVehicleAlert(
    'Vehicle Registration Expiry',
    `Vehicle ID ${vehicleId} expired on ${expiryDate}`,
    ALERT_PRIORITIES.HIGH
  )
}

export const createUnverifiedVehicleAlert = (vehicleId) => {
  return createVehicleAlert(
    'Unverified Vehicle',
    `Car ID ${vehicleId} needs manual verification`,
    ALERT_PRIORITIES.MEDIUM
  )
}

export const createNewUserAlert = (userName) => {
  return createSystemAlert(
    'New User Registered',
    `Owner ${userName} signed up`
  )
}

export const createLoginAlert = (userName, deviceInfo) => {
  return createSystemAlert(
    'Login from New Device',
    `${userName} login from ${deviceInfo}`,
    ALERT_PRIORITIES.HIGH
  )
}

