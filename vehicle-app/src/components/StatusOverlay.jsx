import React, { useEffect, useState } from 'react'
import { useVehicleStore } from '../store/vehicleStore'
import { getGPSLocation } from '../services/gps'
import { getCacheSize } from '../services/adCache'

export default function StatusOverlay() {
  const { vehicleId, isOnline, frontAd, backAd, leftAd, rightAd } = useVehicleStore()
  const [location, setLocation] = useState(null)
  const [cacheInfo, setCacheInfo] = useState({ count: 0, size_mb: 0 })
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    // Get initial location
    getGPSLocation().then(setLocation).catch(console.error)

    // Update location every 30 seconds
    const locationInterval = setInterval(() => {
      getGPSLocation().then(setLocation).catch(console.error)
    }, 30000)

    // Get cache info
    getCacheSize().then(setCacheInfo).catch(console.error)

    // Update uptime
    const startTime = Date.now()
    const uptimeInterval = setInterval(() => {
      const hours = ((Date.now() - startTime) / 1000 / 60 / 60).toFixed(2)
      setUptime(hours)
    }, 1000)

    return () => {
      clearInterval(locationInterval)
      clearInterval(uptimeInterval)
    }
  }, [])

  const activeAds = [frontAd, backAd, leftAd, rightAd].filter(Boolean).length

  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-xl z-50 font-mono text-xs max-w-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-2">
          <span className="font-bold text-green-400">STATUS OVERLAY</span>
          <span className={`px-2 py-1 rounded ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <div>
          <span className="text-gray-400">Vehicle ID:</span>
          <span className="ml-2 text-white">{vehicleId || 'N/A'}</span>
        </div>

        <div>
          <span className="text-gray-400">Active Ads:</span>
          <span className="ml-2 text-green-400">{activeAds}/4</span>
        </div>

        {location && (
          <div>
            <span className="text-gray-400">Location:</span>
            <div className="ml-2 text-white">
              <div>{location.lat.toFixed(6)}, {location.lon.toFixed(6)}</div>
              <div className="text-gray-500">±{Math.round(location.accuracy)}m</div>
            </div>
          </div>
        )}

        <div>
          <span className="text-gray-400">Uptime:</span>
          <span className="ml-2 text-white">{uptime}h</span>
        </div>

        <div>
          <span className="text-gray-400">Cache:</span>
          <span className="ml-2 text-white">
            {cacheInfo.count} ads ({cacheInfo.size_mb} MB)
          </span>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <div className="text-gray-400 mb-1">Screens:</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className={frontAd ? 'text-green-400' : 'text-gray-500'}>
              Front: {frontAd ? frontAd.id : '—'}
            </div>
            <div className={backAd ? 'text-green-400' : 'text-gray-500'}>
              Back: {backAd ? backAd.id : '—'}
            </div>
            <div className={leftAd ? 'text-green-400' : 'text-gray-500'}>
              Left: {leftAd ? leftAd.id : '—'}
            </div>
            <div className={rightAd ? 'text-green-400' : 'text-gray-500'}>
              Right: {rightAd ? rightAd.id : '—'}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-700 text-gray-500 text-xs">
          Press Shift+D to toggle
        </div>
      </div>
    </div>
  )
}





