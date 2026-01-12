import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Activity Logger Service
 * Logs all admin actions to Firebase for audit trail
 * These logs are non-deletable and permanent
 */

const activityCollection = collection(db, 'activityLogs')

/**
 * Log an activity
 * @param {string} type - Type of activity (ad, vehicle, campaign, etc.)
 * @param {string} action - Action performed (created, updated, deleted)
 * @param {object} details - Additional details about the action
 * @param {string} userName - Name of the user who performed the action
 */
export const logActivity = async (type, action, details = {}, userName = 'Admin') => {
  try {
    const activityLog = {
      type, // 'ad', 'vehicle', 'campaign', 'user', etc.
      action, // 'created', 'updated', 'deleted', 'logged_in', 'logged_out'
      details,
      userName,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
      severity: getSeverity(action),
      icon: getIcon(type),
      color: getColor(action),
    }

    const docRef = await addDoc(activityCollection, activityLog)
    console.log('✅ Activity logged successfully:', { id: docRef.id, type, action, userName })
    return docRef.id
  } catch (error) {
    console.error('❌ Error logging activity:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      type,
      action,
      userName
    })
    
    // Re-throw error so calling code can handle it
    throw error
  }
}

/**
 * Get severity level based on action
 */
const getSeverity = (action) => {
  if (action === 'deleted') return 'high'
  if (action === 'updated') return 'medium'
  if (action === 'created') return 'low'
  return 'info'
}

/**
 * Get icon based on type
 */
const getIcon = (type) => {
  const icons = {
    ad: '📢',
    vehicle: '🚗',
    campaign: '📅',
    user: '👤',
    login: '🔐',
    logout: '🚪',
    system: '⚙️',
    profile: '👤',
    admin: '👥',
  }
  return icons[type] || '📝'
}

/**
 * Get color based on action
 */
const getColor = (action) => {
  const colors = {
    created: 'green',
    updated: 'blue',
    deleted: 'red',
    logged_in: 'purple',
    logged_out: 'gray',
  }
  return colors[action] || 'gray'
}

/**
 * Specific logging functions for different actions
 */

export const logAdCreated = (adData, userName) => {
  logActivity('ad', 'created', {
    adId: adData.adId,
    title: adData.title,
    company: adData.company,
    budget: adData.budget,
  }, userName)
}

export const logAdUpdated = (adData, userName) => {
  logActivity('ad', 'updated', {
    adId: adData.adId,
    title: adData.title,
    company: adData.company,
  }, userName)
}

export const logAdDeleted = (adData, userName) => {
  logActivity('ad', 'deleted', {
    adId: adData.adId,
    title: adData.title,
    company: adData.company,
  }, userName)
}

export const logVehicleCreated = (vehicleData, userName) => {
  logActivity('vehicle', 'created', {
    carId: vehicleData.carId,
    vehicleName: vehicleData.vehicleName,
    ownerName: vehicleData.ownerName,
    model: vehicleData.model,
  }, userName)
}

export const logVehicleUpdated = (vehicleData, userName) => {
  logActivity('vehicle', 'updated', {
    carId: vehicleData.carId,
    vehicleName: vehicleData.vehicleName,
    ownerName: vehicleData.ownerName,
  }, userName)
}

export const logVehicleDeleted = (vehicleData, userName) => {
  logActivity('vehicle', 'deleted', {
    carId: vehicleData.carId,
    vehicleName: vehicleData.vehicleName,
    ownerName: vehicleData.ownerName,
  }, userName)
}

export const logCampaignCreated = (campaignData, userName) => {
  logActivity('campaign', 'created', {
    campaignId: campaignData.id,
    name: campaignData.name,
    startDate: campaignData.startDate,
    endDate: campaignData.endDate,
  }, userName)
}

export const logCampaignUpdated = (campaignData, userName) => {
  logActivity('campaign', 'updated', {
    campaignId: campaignData.id,
    name: campaignData.name,
  }, userName)
}

export const logCampaignDeleted = (campaignData, userName) => {
  logActivity('campaign', 'deleted', {
    campaignId: campaignData.id,
    name: campaignData.name,
  }, userName)
}

export const logUserLogin = (userName) => {
  logActivity('login', 'logged_in', {
    message: `${userName} logged into the system`,
  }, userName)
}

export const logUserLogout = (userName) => {
  logActivity('logout', 'logged_out', {
    message: `${userName} logged out of the system`,
  }, userName)
}

export const logProfileUpdated = (profileData, userName) => {
  logActivity('profile', 'updated', {
    name: profileData.name,
    email: profileData.email,
    contactNo: profileData.contactNo,
    message: `${userName} updated their profile information`,
  }, userName)
}

export const logPasswordChanged = (userName) => {
  logActivity('profile', 'password_changed', {
    message: `${userName} changed their password`,
  }, userName)
}

export const logAdminCreated = (adminData, userName) => {
  logActivity('admin', 'created', {
    adminName: adminData.name,
    adminEmail: adminData.email,
    adminRole: adminData.role,
    message: `${userName} created new admin: ${adminData.name} (${adminData.role})`,
  }, userName)
}

export const logAdminUpdated = (adminData, userName) => {
  logActivity('admin', 'updated', {
    adminName: adminData.name,
    adminEmail: adminData.email,
    adminRole: adminData.role,
    message: `${userName} updated admin: ${adminData.name}`,
  }, userName)
}

export const logAdminDeleted = (adminData, userName) => {
  logActivity('admin', 'deleted', {
    adminName: adminData.name,
    adminEmail: adminData.email,
    message: `${userName} deleted admin: ${adminData.name}`,
  }, userName)
}

export default {
  logActivity,
  logAdCreated,
  logAdUpdated,
  logAdDeleted,
  logVehicleCreated,
  logVehicleUpdated,
  logVehicleDeleted,
  logCampaignCreated,
  logCampaignUpdated,
  logCampaignDeleted,
  logUserLogin,
  logUserLogout,
  logProfileUpdated,
  logPasswordChanged,
  logAdminCreated,
  logAdminUpdated,
  logAdminDeleted,
}
