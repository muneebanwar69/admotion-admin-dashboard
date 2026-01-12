import React, { useEffect, useRef, useState } from 'react'
import VideoPlayer from './VideoPlayer'
import ImageDisplay from './ImageDisplay'

export default function MiniSideScreen({ ad, position }) {
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
        <div className="text-center text-gray-600">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-medium">No Ad</p>
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
    </div>
  )
}





