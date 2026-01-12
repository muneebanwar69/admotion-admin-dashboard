import React from 'react'
import { useVehicleStore } from '../store/vehicleStore'
import AdScreen from './AdScreen'
import { useCurrentAds } from '../hooks/useCurrentAds'

export default function FourScreenLayout() {
  // Get the current single ad that should display on all screens
  const { currentAd } = useVehicleStore()
  const { loading } = useCurrentAds()

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Loading ads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex flex-col">
      {/* Top Screen - 60% height */}
      <div className="w-full flex-[6] min-h-0">
        <AdScreen ad={currentAd} position="front" />
      </div>

      {/* Bottom Row - 40% height */}
      <div className="w-full flex-[4] min-h-0 flex">
        {/* Left Screen - 20% width */}
        <div className="flex-[2] min-w-0 border-r border-gray-800">
          <AdScreen ad={currentAd} position="left" />
        </div>

        {/* Center/Back Screen - 60% width */}
        <div className="flex-[6] min-w-0">
          <AdScreen ad={currentAd} position="back" />
        </div>

        {/* Right Screen - 20% width */}
        <div className="flex-[2] min-w-0 border-l border-gray-800">
          <AdScreen ad={currentAd} position="right" />
        </div>
      </div>
    </div>
  )
}





