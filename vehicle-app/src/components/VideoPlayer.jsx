import React, { useEffect, useRef, useState } from 'react'
import { sendImpression } from '../services/api'
import { useVehicleStore } from '../store/vehicleStore'

export default function VideoPlayer({ ad, position, onPlay, onPause }) {
  const videoRef = useRef(null)
  const { vehicleId } = useVehicleStore()
  const [hasStarted, setHasStarted] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !ad) return

    // Get media source - prefer base64 data for offline support
    const mediaSource = ad.media_data || ad.mediaBase64 || ad.preview || ad.mediaUrl || ad.media_url
    
    const isBase64 = mediaSource?.startsWith('data:')
    console.log(`🎬 VideoPlayer loading: ${ad.id}, isBase64: ${isBase64}, size: ${mediaSource?.length || 0} chars`)

    if (!mediaSource) {
      console.error('No media source found for ad:', ad.id)
      setLoadError(true)
      return
    }

    // Set video source
    video.src = mediaSource
    setLoadError(false)

    // Video event handlers
    const handlePlay = () => {
      onPlay?.()
      if (!hasStarted) {
        setHasStarted(true)
        console.log(`▶️ Video started: ${ad.id} on ${position}`)
      }
    }

    const handlePause = () => {
      onPause?.()
    }

    const handleEnded = async () => {
      setHasEnded(true)
      console.log(`⏹️ Video ended: ${ad.id} on ${position}`)
      
      // Send impression
      if (vehicleId && ad.id) {
        try {
          const duration = ad.media_duration_seconds || Math.floor(video.duration) || 15
          await sendImpression(ad.id, vehicleId, duration, 'full')
        } catch (err) {
          console.error('Failed to send impression:', err)
        }
      }

      // Loop video
      setTimeout(() => {
        video.currentTime = 0
        video.play()
        setHasEnded(false)
      }, 100)
    }

    const handleCanPlay = () => {
      console.log(`✅ Video can play: ${ad.id}`)
    }

    const handleError = (e) => {
      console.error(`❌ Video error on ${position}:`, video.error)
      setLoadError(true)
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)

    // Auto-play video
    video.play().catch((error) => {
      console.error('Failed to autoplay video:', error)
    })

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
    }
  }, [ad, position, hasStarted, vehicleId, onPlay, onPause])

  if (!ad) {
    return null
  }

  if (loadError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-xl font-semibold">Video failed to load</p>
          <p className="text-sm mt-2">{ad.title || 'Unknown Ad'}</p>
        </div>
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
    >
      Your browser does not support the video tag.
    </video>
  )
}





