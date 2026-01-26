import React from 'react'
import { motion } from 'framer-motion'

/**
 * Enhanced KPI Card - Modern, sleek design with hover effects and animations
 */
const KpiCard = ({ title, value, icon, className = '', index = 0, trend = null }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      className={`group relative rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 text-white p-5 shadow-xl border border-white/10 overflow-hidden cursor-default ${className}`}
    >
      {/* Subtle animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full" />
      
      {/* Content */}
      <div className='relative z-10 flex items-start justify-between'>
        <div className='flex-1'>
          <p className='text-white/70 text-sm font-medium tracking-wide uppercase mb-2'>
            {title}
          </p>
          <div className='flex items-baseline gap-2'>
            <motion.span 
              className='text-3xl font-bold text-white tracking-tight'
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1, type: 'spring', stiffness: 200 }}
            >
              {value}
            </motion.span>
            {trend && (
              <span className={`text-sm font-medium ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        </div>
        
        {/* Icon container */}
        <motion.div
          className='relative flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 group-hover:bg-white/15 transition-colors duration-300'
          whileHover={{ scale: 1.05 }}
        >
          <div className='text-white/90 [&>svg]:w-6 [&>svg]:h-6'>
            {icon}
          </div>
        </motion.div>
      </div>
      
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400/50 via-purple-400/50 to-blue-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  )
}

export default KpiCard
