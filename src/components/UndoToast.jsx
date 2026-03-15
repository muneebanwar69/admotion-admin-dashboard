import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Undo2, X, CheckCircle } from 'lucide-react'
import { useUndoManager } from '../contexts/UndoContext'

const UNDO_DURATION = 10000

const UndoToastItem = ({ action, onUndo, onDismiss }) => {
  const [timeLeft, setTimeLeft] = useState(UNDO_DURATION)
  const [undoing, setUndoing] = useState(false)
  const [undone, setUndone] = useState(false)

  useEffect(() => {
    const elapsed = Date.now() - action.timestamp
    setTimeLeft(Math.max(0, UNDO_DURATION - elapsed))

    const interval = setInterval(() => {
      const remaining = Math.max(0, UNDO_DURATION - (Date.now() - action.timestamp))
      setTimeLeft(remaining)
      if (remaining <= 0) clearInterval(interval)
    }, 100)

    return () => clearInterval(interval)
  }, [action.timestamp])

  const handleUndo = async () => {
    setUndoing(true)
    const success = await onUndo(action.id)
    if (success) {
      setUndone(true)
      setTimeout(() => onDismiss(action.id), 1000)
    }
    setUndoing(false)
  }

  const progress = timeLeft / UNDO_DURATION

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative bg-slate-800 dark:bg-slate-700 text-white rounded-xl shadow-2xl overflow-hidden min-w-[320px] max-w-md"
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 h-0.5 bg-blue-400/30 w-full">
        <motion.div
          className="h-full bg-blue-400"
          style={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        {undone ? (
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-bold text-blue-400">
              {Math.ceil(timeLeft / 1000)}
            </span>
          </div>
        )}

        <p className="flex-1 text-sm font-medium truncate">
          {undone ? 'Action undone!' : action.description}
        </p>

        {!undone && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleUndo}
              disabled={undoing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Undo2 className="w-3 h-3" />
              {undoing ? 'Undoing...' : 'Undo'}
            </button>
            <button
              onClick={() => onDismiss(action.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const UndoToast = () => {
  const { pendingActions, undoAction, dismissAction } = useUndoManager()

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9995] flex flex-col-reverse gap-2 pointer-events-none">
      <AnimatePresence>
        {pendingActions.slice(0, 3).map(action => (
          <div key={action.id} className="pointer-events-auto">
            <UndoToastItem
              action={action}
              onUndo={undoAction}
              onDismiss={dismissAction}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default UndoToast
