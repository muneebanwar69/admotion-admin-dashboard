// src/services/integrationService.js
import { db } from '../firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore'
import { 
  createAdAlert, 
  createVehicleAlert, 
  createSystemAlert,
  createAdExpiryAlert,
  createLowBudgetAlert,
  createVehicleExpiryAlert,
  createUnverifiedVehicleAlert,
  createNewUserAlert,
  createLoginAlert
} from './alertsService'

/**
 * Integration service that connects all parts of the application
 * Handles cross-page data synchronization and alert generation
 */

// Vehicle Management Integration
export const vehicleIntegration = {
  // Create vehicle and generate alerts
  createVehicle: async (vehicleData) => {
    try {
      const vehicleRef = await addDoc(collection(db, 'vehicles'), {
        ...vehicleData,
        createdAt: new Date(),
        status: 'Active'
      })

      // Generate system alert for new vehicle
      await createSystemAlert(
        'New Vehicle Registered',
        `Vehicle ${vehicleData.carId} has been registered successfully`
      )

      return vehicleRef.id
    } catch (error) {
      console.error('Error creating vehicle:', error)
      throw error
    }
  },

  // Update vehicle status and generate alerts
  updateVehicleStatus: async (vehicleId, newStatus) => {
    try {
      await updateDoc(doc(db, 'vehicles', vehicleId), {
        status: newStatus,
        updatedAt: new Date()
      })

      // Generate alert for status change
      await createVehicleAlert(
        'Vehicle Status Updated',
        `Vehicle ${vehicleId} status changed to ${newStatus}`
      )
    } catch (error) {
      console.error('Error updating vehicle status:', error)
      throw error
    }
  },

  // Check for expiring registrations
  checkExpiringRegistrations: async () => {
    try {
      const vehiclesQuery = query(collection(db, 'vehicles'))
      const snapshot = await getDocs(vehiclesQuery)
      
      snapshot.docs.forEach(doc => {
        const vehicle = doc.data()
        const expiryDate = new Date(vehicle.registrationDate)
        const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          createVehicleExpiryAlert(vehicle.carId, vehicle.registrationDate)
        }
      })
    } catch (error) {
      console.error('Error checking expiring registrations:', error)
    }
  }
}

// Ad Management Integration
export const adIntegration = {
  // Create ad and generate alerts
  createAd: async (adData) => {
    try {
      const adRef = await addDoc(collection(db, 'ads'), {
        ...adData,
        createdAt: new Date(),
        isActive: true
      })

      // Generate system alert for new ad
      await createSystemAlert(
        'New Ad Created',
        `Ad "${adData.title}" has been created successfully`
      )

      return adRef.id
    } catch (error) {
      console.error('Error creating ad:', error)
      throw error
    }
  },

  // Update ad status and generate alerts
  updateAdStatus: async (adId, newStatus) => {
    try {
      await updateDoc(doc(db, 'ads', adId), {
        isActive: newStatus,
        updatedAt: new Date()
      })

      // Generate alert for status change
      await createAdAlert(
        'Ad Status Updated',
        `Ad ${adId} status changed to ${newStatus ? 'Active' : 'Inactive'}`
      )
    } catch (error) {
      console.error('Error updating ad status:', error)
      throw error
    }
  },

  // Check for low budget ads
  checkLowBudgetAds: async () => {
    try {
      const adsQuery = query(collection(db, 'ads'), where('isActive', '==', true))
      const snapshot = await getDocs(adsQuery)
      
      snapshot.docs.forEach(doc => {
        const ad = doc.data()
        if (ad.budget && parseFloat(ad.budget) < 5000) {
          createLowBudgetAlert(ad.adId, parseFloat(ad.budget))
        }
      })
    } catch (error) {
      console.error('Error checking low budget ads:', error)
    }
  },

  // Check for expiring ads
  checkExpiringAds: async () => {
    try {
      const adsQuery = query(collection(db, 'ads'), where('isActive', '==', true))
      const snapshot = await getDocs(adsQuery)
      
      snapshot.docs.forEach(doc => {
        const ad = doc.data()
        if (ad.endTime) {
          const endDate = new Date(ad.endTime)
          const daysUntilExpiry = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
          
          if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            createAdExpiryAlert(ad.adId, daysUntilExpiry)
          }
        }
      })
    } catch (error) {
      console.error('Error checking expiring ads:', error)
    }
  }
}

// User Management Integration
export const userIntegration = {
  // Create user and generate alerts
  createUser: async (userData) => {
    try {
      const userRef = await addDoc(collection(db, 'users'), {
        ...userData,
        createdAt: new Date(),
        status: 'Active'
      })

      // Generate system alert for new user
      await createNewUserAlert(userData.name)

      return userRef.id
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  // Track user login and generate alerts
  trackLogin: async (userId, deviceInfo) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        lastLogin: new Date(),
        lastLoginDevice: deviceInfo
      })

      // Generate alert for new device login
      await createLoginAlert('User', deviceInfo)
    } catch (error) {
      console.error('Error tracking login:', error)
      throw error
    }
  }
}

// Campaign Integration
export const campaignIntegration = {
  // Create campaign and generate alerts
  createCampaign: async (campaignData) => {
    try {
      const campaignRef = await addDoc(collection(db, 'campaigns'), {
        ...campaignData,
        createdAt: new Date(),
        status: 'Active'
      })

      // Generate system alert for new campaign
      await createSystemAlert(
        'New Campaign Created',
        `Campaign "${campaignData.name}" has been created successfully`
      )

      return campaignRef.id
    } catch (error) {
      console.error('Error creating campaign:', error)
      throw error
    }
  },

  // Update campaign status
  updateCampaignStatus: async (campaignId, newStatus) => {
    try {
      await updateDoc(doc(db, 'campaigns', campaignId), {
        status: newStatus,
        updatedAt: new Date()
      })

      // Generate alert for status change
      await createSystemAlert(
        'Campaign Status Updated',
        `Campaign ${campaignId} status changed to ${newStatus}`
      )
    } catch (error) {
      console.error('Error updating campaign status:', error)
      throw error
    }
  }
}

// Analytics Integration
export const analyticsIntegration = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const [vehiclesSnapshot, adsSnapshot, campaignsSnapshot] = await Promise.all([
        getDocs(collection(db, 'vehicles')),
        getDocs(collection(db, 'ads')),
        getDocs(collection(db, 'campaigns'))
      ])

      const totalVehicles = vehiclesSnapshot.size
      const activeVehicles = vehiclesSnapshot.docs.filter(doc => doc.data().status === 'Active').length
      const totalAds = adsSnapshot.size
      const activeAds = adsSnapshot.docs.filter(doc => doc.data().isActive).length
      const totalCampaigns = campaignsSnapshot.size

      return {
        totalVehicles,
        activeVehicles,
        totalAds,
        activeAds,
        totalCampaigns
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      throw error
    }
  },

  // Get performance metrics
  getPerformanceMetrics: async (period = 'week') => {
    try {
      // This would typically involve more complex queries
      // For now, return mock data structure
      return {
        adViews: [
          { label: 'Mon', value: 1200 },
          { label: 'Tue', value: 1900 },
          { label: 'Wed', value: 3000 },
          { label: 'Thu', value: 2800 },
          { label: 'Fri', value: 3500 }
        ],
        vehicleActivity: [
          { label: 'Week 1', value: 300 },
          { label: 'Week 2', value: 450 },
          { label: 'Week 3', value: 600 },
          { label: 'Week 4', value: 750 }
        ]
      }
    } catch (error) {
      console.error('Error getting performance metrics:', error)
      throw error
    }
  }
}

// System Health Monitoring
export const systemHealth = {
  // Monitor system health and generate alerts
  monitorSystemHealth: async () => {
    try {
      // Check database connectivity
      await getDocs(collection(db, 'vehicles'))
      
      // Check for system issues
      const alertsQuery = query(
        collection(db, 'alerts'),
        where('type', '==', 'System'),
        where('read', '==', false)
      )
      const alertsSnapshot = await getDocs(alertsQuery)
      
      if (alertsSnapshot.size > 10) {
        await createSystemAlert(
          'High Alert Volume',
          `System has ${alertsSnapshot.size} unread alerts`
        )
      }
    } catch (error) {
      console.error('System health check failed:', error)
      await createSystemAlert(
        'System Error',
        'Database connectivity issue detected'
      )
    }
  },

  // Run periodic health checks
  startHealthMonitoring: () => {
    // Run health check every 5 minutes
    setInterval(systemHealth.monitorSystemHealth, 5 * 60 * 1000)
    
    // Run expiry checks daily
    setInterval(() => {
      vehicleIntegration.checkExpiringRegistrations()
      adIntegration.checkExpiringAds()
      adIntegration.checkLowBudgetAds()
    }, 24 * 60 * 60 * 1000)
  }
}

// Export all integrations
export default {
  vehicle: vehicleIntegration,
  ad: adIntegration,
  user: userIntegration,
  campaign: campaignIntegration,
  analytics: analyticsIntegration,
  systemHealth
}

