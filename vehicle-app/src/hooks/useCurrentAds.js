import { useEffect, useState, useRef } from 'react'
import { doc, onSnapshot, getDoc } from 'firebase/firestore'
import { getDB } from '../services/firebase'
import { useVehicleStore } from '../store/vehicleStore'
import { sendImpression } from '../services/api'

// Ad rotation interval (in milliseconds) - change ad every 15 seconds
const AD_ROTATION_INTERVAL = 15000

export function useCurrentAds() {
  const { vehicleId, setAdQueue, nextAd, currentAd, adQueue } = useVehicleStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const rotationTimer = useRef(null)

  // Start ad rotation when we have multiple ads
  useEffect(() => {
    if (adQueue.length > 1) {
      console.log(`🔄 Starting ad rotation (${adQueue.length} ads, ${AD_ROTATION_INTERVAL/1000}s interval)`)
      
      rotationTimer.current = setInterval(() => {
        nextAd()
        console.log('🔄 Rotating to next ad')
      }, AD_ROTATION_INTERVAL)
      
      return () => {
        if (rotationTimer.current) {
          clearInterval(rotationTimer.current)
        }
      }
    }
  }, [adQueue.length, nextAd])

  // Send impression when current ad changes
  useEffect(() => {
    if (currentAd && vehicleId) {
      console.log(`📺 Now displaying: ${currentAd.title || currentAd.id}`)
      
      // Send impression
      sendImpression(currentAd.id, vehicleId, 15, 'full').catch(err => {
        console.error('Failed to send impression:', err)
      })
    }
  }, [currentAd, vehicleId])

  useEffect(() => {
    if (!vehicleId) {
      setLoading(false)
      return
    }

    console.log(`📡 Listening for vehicle assignments: ${vehicleId}`)

    const db = getDB()
    const vehicleRef = doc(db, 'vehicles', vehicleId)

    const unsubscribe = onSnapshot(
      vehicleRef,
      async (snapshot) => {
        try {
          if (!snapshot.exists()) {
            console.log('⚠️ Vehicle not found')
            setAdQueue([])
            setLoading(false)
            return
          }

          const vehicle = snapshot.data()
          console.log('🔥 Vehicle data updated:', vehicle)

          const assignedAds = vehicle.assignedAds || []
          
          if (assignedAds.length === 0) {
            console.log('⚠️ No ads assigned to vehicle')
            setAdQueue([])
            setLoading(false)
            return
          }

          // Filter active ads by time
          const now = new Date()
          const activeAds = assignedAds.filter(assignment => {
            if (!assignment.startTime || !assignment.endTime) return true
            const start = new Date(assignment.startTime)
            const end = new Date(assignment.endTime)
            return now >= start && now <= end
          })

          const adsToProcess = activeAds.length > 0 ? activeAds : assignedAds
          console.log(`📢 Processing ${adsToProcess.length} ads for vehicle`)

          // Load all ads
          const loadedAds = []
          
          for (const assignment of adsToProcess) {
            const adId = assignment.adId || assignment.ad_id || assignment
            if (!adId) continue
            if (loadedAds.find(a => a.id === adId)) continue

            try {
              const adRef = doc(db, 'ads', adId)
              const adSnap = await getDoc(adRef)
              
              if (!adSnap.exists()) {
                console.warn(`⚠️ Ad ${adId} not found`)
                continue
              }

              const adData = adSnap.data()
              // For videos: use mediaUrl (Firebase Storage URL)
              // For images: use mediaBase64 or preview (base64 data)
              const mediaType = (adData.type || adData.mediaType || adData.media_type || 'image').toLowerCase()
              const isVideo = mediaType === 'video'
              
              // Get media source based on type
              let mediaData
              if (isVideo) {
                // Videos use Firebase Storage URL
                mediaData = adData.mediaUrl || adData.preview || adData.media_url || ''
              } else {
                // Images use base64 data
                mediaData = adData.mediaBase64 || adData.preview || adData.mediaUrl || adData.media_url || ''
              }
              
              if (!mediaData) {
                console.warn(`⚠️ Ad ${adId} has no media!`)
                continue
              }
              
              console.log(`📦 Ad ${adId}: type=${mediaType}, isURL=${mediaData.startsWith('http')}`)
              
              const ad = {
                id: adId,
                title: adData.title || 'Ad',
                mediaType: mediaType,
                media_type: mediaType,
                media_data: mediaData,
                mediaUrl: mediaData,
                preview: mediaData,
                company: adData.company,
                ...adData
              }

              loadedAds.push(ad)
              console.log(`✅ Ad loaded: ${ad.title} (${mediaType})`)
            } catch (err) {
              console.error(`❌ Failed to load ad ${adId}:`, err)
            }
          }

          // Set the ad queue - all screens will show the same ad from this queue
          if (loadedAds.length > 0) {
            console.log(`📺 Loaded ${loadedAds.length} ad(s) - same ad will show on all 4 screens`)
            setAdQueue(loadedAds)
          } else {
            setAdQueue([])
          }
          
          setLoading(false)
        } catch (err) {
          console.error('❌ Error processing ads:', err)
          setError(err.message)
          setLoading(false)
        }
      },
      (err) => {
        console.error('❌ Firebase error:', err)
        setError(err.message)
        setLoading(false)
      }
    )

    return () => {
      unsubscribe()
      if (rotationTimer.current) {
        clearInterval(rotationTimer.current)
      }
    }
  }, [vehicleId, setAdQueue])

  return { loading, error }
}




