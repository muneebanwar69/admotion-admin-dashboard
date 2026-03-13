import React from 'react'
import { motion } from 'framer-motion'

// Color presets for each KPI card - each has its own identity
const COLOR_THEMES = {
  blue: {
    bg: 'from-blue-600 via-blue-700 to-indigo-800',
    accent: 'from-blue-400 to-cyan-400',
    glow: 'shadow-blue-500/25',
    icon: 'bg-blue-400/20 border-blue-300/20',
    line: 'from-cyan-400 via-blue-400 to-indigo-400',
  },
  emerald: {
    bg: 'from-emerald-600 via-emerald-700 to-teal-800',
    accent: 'from-emerald-400 to-teal-400',
    glow: 'shadow-emerald-500/25',
    icon: 'bg-emerald-400/20 border-emerald-300/20',
    line: 'from-teal-400 via-emerald-400 to-green-400',
  },
  violet: {
    bg: 'from-violet-600 via-purple-700 to-indigo-800',
    accent: 'from-violet-400 to-purple-400',
    glow: 'shadow-violet-500/25',
    icon: 'bg-violet-400/20 border-violet-300/20',
    line: 'from-pink-400 via-violet-400 to-indigo-400',
  },
  amber: {
    bg: 'from-amber-500 via-orange-600 to-red-700',
    accent: 'from-amber-400 to-orange-400',
    glow: 'shadow-amber-500/25',
    icon: 'bg-amber-400/20 border-amber-300/20',
    line: 'from-yellow-400 via-amber-400 to-orange-400',
  },
  rose: {
    bg: 'from-rose-600 via-pink-700 to-fuchsia-800',
    accent: 'from-rose-400 to-pink-400',
    glow: 'shadow-rose-500/25',
    icon: 'bg-rose-400/20 border-rose-300/20',
    line: 'from-pink-400 via-rose-400 to-fuchsia-400',
  },
  brand: {
    bg: 'from-brand-900 via-brand-800 to-brand-900',
    accent: 'from-blue-400 to-purple-400',
    glow: 'shadow-brand-900/25',
    icon: 'bg-white/10 border-white/10',
    line: 'from-amber-400 via-purple-400 to-blue-400',
  },
}

/**
 * Enhanced KPI Card with unique color identity per card
 */
const KpiCard = ({ title, value, icon, className = '', index = 0, trend = null, color = 'brand' }) => {
  const theme = COLOR_THEMES[color] || COLOR_THEMES.brand

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { duration: 0.25, ease: 'easeOut' }
      }}
      whileTap={{ scale: 0.98 }}
      className={`group relative rounded-2xl bg-gradient-to-br ${theme.bg} text-white p-5 shadow-xl ${theme.glow} border border-white/10 overflow-hidden cursor-default ${className}`}
    >
      {/* Animated shimmer sweep on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Decorative corner accent with color */}
      <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${theme.accent} opacity-10 rounded-bl-full transition-opacity duration-300 group-hover:opacity-20`} />

      {/* Decorative dot pattern */}
      <div className="absolute bottom-2 left-2 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-500"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '8px 8px',
          width: '64px',
          height: '32px',
        }}
      />

      {/* Content */}
      <div className='relative z-10 flex items-start justify-between'>
        <div className='flex-1'>
          <p className='text-white/70 text-xs font-semibold tracking-widest uppercase mb-2'>
            {title}
          </p>
          <div className='flex items-baseline gap-2'>
            <motion.span
              className='text-3xl font-bold text-white tracking-tight counter-value'
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1, type: 'spring', stiffness: 200 }}
            >
              {value}
            </motion.span>
            {trend != null && trend !== 0 && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`text-sm font-semibold px-1.5 py-0.5 rounded-md ${
                  trend > 0
                    ? 'text-emerald-300 bg-emerald-400/15'
                    : 'text-rose-300 bg-rose-400/15'
                }`}
              >
                {trend > 0 ? '+' : ''}{trend}%
              </motion.span>
            )}
          </div>
        </div>

        {/* Icon container with themed border */}
        <motion.div
          className={`relative flex items-center justify-center w-12 h-12 rounded-xl ${theme.icon} backdrop-blur-sm border group-hover:scale-110 transition-all duration-300`}
          whileHover={{ rotate: 5 }}
        >
          <div className='text-white/90 [&>svg]:w-6 [&>svg]:h-6'>
            {icon}
          </div>
        </motion.div>
      </div>

      {/* Animated bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.line}`}>
        <div className="absolute inset-0 opacity-50" />
        <motion.div
          className="h-full w-1/3 bg-white/30 rounded-full"
          animate={{ x: ['0%', '200%', '0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  )
}

export default KpiCard
