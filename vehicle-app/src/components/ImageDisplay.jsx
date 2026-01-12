import React, { useEffect, useState } from 'react'
import { sendImpression } from '../services/api'
import { useVehicleStore } from '../store/vehicleStore'

export default function ImageDisplay({ ad, position, duration = 15 }) {
  const { vehicleId } = useVehicleStore()
  const [imageSrc, setImageSrc] = useState(null)
  const [hasDisplayed, setHasDisplayed] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!ad) return

    // Get image source - prefer base64 data for offline support
    const source = ad.media_data || ad.mediaBase64 || ad.preview || ad.mediaUrl || ad.media_url
    
    const isBase64 = source?.startsWith('data:')
    console.log(`🖼️ ImageDisplay loading: ${ad.id}, isBase64: ${isBase64}, size: ${source?.length || 0} chars`)

    if (source) {
      setImageSrc(source)
      setLoadError(false)
      
      // Track impression after display duration
      if (!hasDisplayed && vehicleId && ad.id) {
        const timer = setTimeout(async () => {
          try {
            await sendImpression(ad.id, vehicleId, duration, 'full')
            setHasDisplayed(true)
            console.log(`📊 Impression tracked: ${ad.id} on ${position}`)
          } catch (err) {
            console.error('Failed to track impression:', err)
          }
        }, duration * 1000)

        return () => clearTimeout(timer)
      }
    }
  }, [ad, position, duration, vehicleId, hasDisplayed])

  if (!ad || !imageSrc) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">Loading image...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-xl font-semibold">Image failed to load</p>
          <p className="text-sm mt-2">{ad.title || 'Unknown Ad'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <img
        src={imageSrc}
        alt={ad.title || ad.adId || 'Ad'}
        className="w-full h-full object-cover"
        onLoad={() => console.log(`✅ Image loaded: ${ad.id}`)}
        onError={(e) => {
          console.error(`❌ Failed to load image: ${ad.id}`, imageSrc?.substring(0, 100))
          setLoadError(true)
        }}
      />
    </div>
  )
}





