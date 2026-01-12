import React from 'react'
import { motion } from 'framer-motion'

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
      </div>
    </div>
  )
}

export const SkeletonTable = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-slate-100 dark:bg-slate-700 p-4">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 dark:bg-slate-600 rounded flex-1"></div>
            ))}
          </div>
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex gap-4">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-slate-200 dark:bg-slate-600 rounded flex-1"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const SkeletonKpiCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6"
    >
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
      </div>
    </motion.div>
  )
}

export const SkeletonList = ({ items = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export const ShimmerEffect = ({ className = '' }) => {
  return (
    <motion.div
      className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  )
}


