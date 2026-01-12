import React from 'react'
import { FiX } from 'react-icons/fi'
import { motion } from 'framer-motion'

/**
 * Modern, consistent close button component used across all modals and dialogs
 */
const CloseButton = ({ onClick, className = '', size = 'md', variant = 'default' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11'
  }

  const variantClasses = {
    default: 'bg-white/10 hover:bg-white/20 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
    ghost: 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
    minimal: 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
  }

  return (
    <motion.button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
        rounded-lg
        flex items-center justify-center
        transition-all duration-300
        border border-transparent
        hover:border-gray-200 dark:hover:border-slate-600
        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2
        backdrop-blur-sm
        group
      `}
      whileHover={{ scale: 1.05, rotate: 90 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Close"
    >
      <FiX 
        className={`
          ${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'}
          transition-transform duration-300
          group-hover:scale-110
        `}
      />
    </motion.button>
  )
}

export default CloseButton
