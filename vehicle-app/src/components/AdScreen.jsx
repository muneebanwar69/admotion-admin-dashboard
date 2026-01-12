import React, { useEffect, useRef, useState } from 'react'
import { useVehicleStore } from '../store/vehicleStore'

export default function AdScreen({ ad, position }) {
  const { vehicleId } = useVehicleStore()
  const videoRef = useRef(null)
  const [loadError, setLoadError] = useState(false)

  // Check if ad is a video
  const isVideo = () => {
    if (!ad) return false
    const mediaType = ad.mediaType || ad.media_type || ad.type || ''
    return mediaType.toLowerCase() === 'video'
  }

  // Get media source
  const getMediaSource = () => {
    if (!ad) return ''
    return ad.mediaUrl || ad.media_data || ad.mediaBase64 || ad.preview || ad.media_url || ''
  }

  useEffect(() => {
    setLoadError(false)
    
    if (isVideo() && videoRef.current && ad) {
      const video = videoRef.current
      const src = getMediaSource()
      console.log(`🎬 Loading video: ${src?.substring(0, 100)}...`)
      video.src = src
      video.load()
      video.play().catch(err => {
        console.error('Video autoplay failed:', err)
      })
    }
  }, [ad])

  // No ad assigned
  if (!ad) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-lg font-semibold">Waiting for Ad</p>
          <p className="text-xs mt-1 text-gray-600">No ad assigned yet</p>
        </div>
      </div>
    )
  }

  const mediaSrc = getMediaSource()

  // Error state
  if (loadError || !mediaSrc) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-semibold">Media Error</p>
          <p className="text-xs mt-1">{ad.title || 'Unable to load'}</p>
        </div>
      </div>
    )
  }

  // Video ad
  if (isVideo()) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="max-w-full max-h-full w-auto h-auto object-contain"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={(e) => {
            console.error('Video error:', e)
            setLoadError(true)
          }}
        >
          <source src={mediaSrc} type="video/mp4" />
          <source src={mediaSrc} type="video/webm" />
        </video>
      </div>
    )
  }

  // Image ad - show full image without cropping
  return (
    <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <img
        src={mediaSrc}
        alt={ad.title || 'Advertisement'}
        className="max-w-full max-h-full w-auto h-auto object-contain"
        onLoad={() => console.log(`✅ Image loaded: ${ad.id} on ${position}`)}
        onError={() => {
          console.error(`❌ Image load error: ${ad.id}`)
          setLoadError(true)
        }}
      />
    </div>
  )
}
