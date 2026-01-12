import React, { useEffect, useRef, useState } from 'react'
import VideoPlayer from './VideoPlayer'
import ImageDisplay from './ImageDisplay'

export default function FullSideScreen({ ad, position }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (ad) {
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }
  }, [ad])

  // Check if ad is a video
  const isVideo = () => {
    if (!ad) return false
    const mediaType = ad.mediaType || ad.media_type || ad.type || ''
    return mediaType.toLowerCase() === 'video'
  }

  if (!ad) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-lg font-semibold">No Ad Assigned</p>
          <p className="text-xs mt-1 text-gray-600">Waiting for assignment...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-black relative overflow-hidden"
    >
      {isVideo() ? (
        <VideoPlayer 
          ad={ad} 
          position={position}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      ) : (
        <ImageDisplay 
          ad={ad} 
          position={position}
          duration={ad.media_duration_seconds || ad.duration || 15}
        />
      )}
      
      {/* Ad title overlay - small and subtle */}
      {ad.title && (
        <div className="absolute bottom-1 left-1 bg-black/50 text-white/80 px-2 py-0.5 text-xs rounded backdrop-blur-sm">
          {ad.title}
        </div>
      )}
    </div>
  )
}





