import React from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import useFavorites from '../hooks/useFavorites'

const FavoriteButton = ({ id, type, size = 'sm' }) => {
  const { isFavorite, toggleFavorite } = useFavorites(type)
  const active = isFavorite(id)

  const sizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
  }
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.85 }}
      onClick={(e) => {
        e.stopPropagation()
        toggleFavorite(id)
      }}
      title={active ? 'Unpin from top' : 'Pin to top'}
      className={`${sizes[size]} rounded-lg flex items-center justify-center transition-all duration-200 ${
        active
          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
      }`}
    >
      <motion.div
        animate={active ? { scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <Star
          className={iconSizes[size]}
          fill={active ? 'currentColor' : 'none'}
        />
      </motion.div>
    </motion.button>
  )
}

export default FavoriteButton
