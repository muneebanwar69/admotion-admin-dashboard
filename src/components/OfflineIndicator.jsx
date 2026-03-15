import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw, Database } from 'lucide-react'

const OfflineIndicator = ({ isOffline, lastCached, pendingOps = 0, onSync }) => {
  const formatTime = (isoString) => {
    if (!isoString) return 'unknown'
    const date = new Date(isoString)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 flex items-center justify-center gap-3 text-sm font-medium shadow-lg"
        >
          <WifiOff className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span>
            You're offline — showing cached data
            {lastCached && ` from ${formatTime(lastCached)}`}
          </span>
          {pendingOps > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              <Database className="w-3 h-3" />
              {pendingOps} pending
            </span>
          )}
          {!navigator.onLine ? null : (
            <button
              onClick={onSync}
              className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-xs font-semibold"
            >
              <RefreshCw className="w-3 h-3" /> Sync Now
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OfflineIndicator
