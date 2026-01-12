import React from 'react'
import { motion } from 'framer-motion'
import { FiRadio } from 'react-icons/fi'

/**
 * Real-time activity indicator component
 * Shows a pulsing indicator when data is being updated in real-time
 */
const RealTimeIndicator = ({ isActive = true, label = 'Live' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold shadow-lg"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="relative"
      >
        <FiRadio className="w-3 h-3" />
        {isActive && (
          <motion.span
            className="absolute inset-0 bg-white rounded-full"
            animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>
      <span>{label}</span>
    </motion.div>
  )
}

export default RealTimeIndicator





