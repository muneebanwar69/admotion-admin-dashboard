import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC-ASaXxPtdhOEnFMfaNYdepP7-PJm2BrI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "admotion-a6654.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "admotion-a6654",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "admotion-a6654.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "829049079348",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:829049079348:web:7d03562bb2b9e5121eec61",
}

let app = null
let db = null
let messaging = null

export async function initializeFirebase() {
  if (app) return app

  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    
    // Initialize messaging if supported
    const messagingSupported = await isSupported()
    if (messagingSupported) {
      messaging = getMessaging(app)
    }
    
    console.log('✅ Firebase initialized')
    return app
  } catch (error) {
    console.error('❌ Firebase initialization error:', error)
    throw error
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.')
  }
  return db
}

export function getMessagingInstance() {
  return messaging
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!messaging) {
    console.warn('⚠️ Messaging not supported')
    return null
  }

  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.warn('⚠️ VAPID key not configured')
      return null
    }

    const token = await getToken(messaging, { vapidKey })
    
    if (token) {
      console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...')
      
      // Send token to backend
      const vehicleId = localStorage.getItem('vehicle_id')
      if (vehicleId) {
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/device/fcm-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              vehicle_id: vehicleId,
              fcm_token: token 
            })
          })
        } catch (error) {
          console.error('Failed to send FCM token to backend:', error)
        }
      }
      
      return token
    } else {
      console.warn('⚠️ No FCM token available')
      return null
    }
  } catch (error) {
    console.error('❌ FCM permission error:', error)
    return null
  }
}

// Listen for push notifications
export function listenForNotifications() {
  if (!messaging) {
    console.warn('⚠️ Messaging not available')
    return
  }

  onMessage(messaging, (payload) => {
    console.log('🔔 Push notification received:', payload)
    
    if (payload.data?.action === 'reload') {
      console.log('🔄 Reload requested via push notification')
      setTimeout(() => window.location.reload(), 1000)
    }
    
    if (payload.data?.action === 'new_ad') {
      console.log('📢 New ad assignment pushed')
      // Firebase listener will auto-update via onSnapshot
    }
  })
}


