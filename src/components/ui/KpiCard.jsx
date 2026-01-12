import React from 'react'
import { motion } from 'framer-motion'

/**
 * Enhanced KPI Card with hover effects, animations, and micro-interactions
 */
const KpiCard = ({ title, value, icon, className = '', index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ 
        scale: 1.05, 
        y: -5,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
      }}
      className={`group relative rounded-xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 text-white px-5 py-4 shadow-lg border border-white/10 flex items-center gap-3 overflow-hidden cursor-pointer ${className}`}
    >
      {/* Animated background shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'linear' }}
      />
      
      {/* Content */}
      <div className='relative z-10 flex-1'>
        <div className='text-white/80 text-sm font-medium mb-1 group-hover:text-white transition-colors duration-300'>{title}</div>
        <div className='flex items-center gap-2'>
          <motion.span 
            className='text-white font-bold text-2xl leading-none'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1, type: 'spring', stiffness: 200 }}
          >
            {value}
          </motion.span>
        </div>
      </div>
      
      {/* Icon with enhanced animation */}
      <motion.div
        className='relative z-10 text-white/90 text-2xl'
        whileHover={{ scale: 1.2, rotate: [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 to-purple-400/0 group-hover:from-amber-400/20 group-hover:to-purple-400/20 transition-all duration-500 rounded-xl"></div>
    </motion.div>
  )
}

export default KpiCard
