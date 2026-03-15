import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Square, Trash2, Power, PowerOff, Wrench, X, AlertTriangle, CheckCircle, Loader2, MinusSquare } from 'lucide-react'
import { writeBatch, doc } from 'firebase/firestore'
import { db } from '../firebase'

const ACTIONS = {
  vehicles: [
    { id: 'activate', label: 'Activate', icon: Power, color: 'text-green-600', field: 'status', value: 'Active' },
    { id: 'deactivate', label: 'Deactivate', icon: PowerOff, color: 'text-red-600', field: 'status', value: 'Inactive' },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-amber-600', field: 'status', value: 'Maintenance' },
    { id: 'delete', label: 'Delete', icon: Trash2, color: 'text-red-600', destructive: true },
  ],
  ads: [
    { id: 'activate', label: 'Activate', icon: Power, color: 'text-green-600', field: 'status', value: 'Active' },
    { id: 'deactivate', label: 'Deactivate', icon: PowerOff, color: 'text-red-600', field: 'status', value: 'Inactive' },
    { id: 'delete', label: 'Delete', icon: Trash2, color: 'text-red-600', destructive: true },
  ],
}

// Checkbox component
export const BulkCheckbox = ({ checked, partial, onChange, className = '' }) => {
  const Icon = partial ? MinusSquare : checked ? CheckSquare : Square
  return (
    <button onClick={onChange} className={`transition-colors ${checked || partial ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'} ${className}`}>
      <Icon className="w-5 h-5" />
    </button>
  )
}

// Floating action bar
const BulkActionBar = ({ type, selectedCount, onAction, onClear }) => {
  const [confirmAction, setConfirmAction] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const actions = ACTIONS[type] || []

  const handleAction = async (action) => {
    if (action.destructive && !confirmAction) {
      setConfirmAction(action)
      return
    }
    setProcessing(true)
    setConfirmAction(null)
    try {
      await onAction(action)
      setResult({ success: true, message: `${action.label} applied to ${selectedCount} items` })
      setTimeout(() => { setResult(null); onClear() }, 2000)
    } catch (err) {
      setResult({ success: false, message: err.message || 'Operation failed' })
      setTimeout(() => setResult(null), 3000)
    }
    setProcessing(false)
  }

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-800/95 dark:bg-slate-700/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-600 px-5 py-3 flex items-center gap-4"
        >
          {processing && (
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          )}

          {result ? (
            <div className={`flex items-center gap-2 text-sm font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.success ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {result.message}
            </div>
          ) : confirmAction ? (
            <>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="text-sm">Delete {selectedCount} items?</span>
              <button onClick={() => handleAction(confirmAction)} className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors">
                Confirm
              </button>
              <button onClick={() => setConfirmAction(null)} className="px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold transition-colors">
                Cancel
              </button>
            </>
          ) : (
            <>
              <span className="text-sm font-medium">
                <span className="text-blue-400 font-bold">{selectedCount}</span> selected
              </span>
              <div className="w-px h-6 bg-slate-600" />
              {actions.map(action => {
                const Icon = action.icon
                return (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAction(action)}
                    disabled={processing}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-white/10 ${action.color} disabled:opacity-50`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {action.label}
                  </motion.button>
                )
              })}
              <div className="w-px h-6 bg-slate-600" />
              <button
                onClick={onClear}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Helper: execute bulk operation
export async function executeBulkAction(action, selectedIds, collectionName) {
  const ids = Array.from(selectedIds)
  // Process in batches of 500 (Firestore limit)
  for (let i = 0; i < ids.length; i += 500) {
    const batch = writeBatch(db)
    const chunk = ids.slice(i, i + 500)
    for (const id of chunk) {
      const ref = doc(db, collectionName, id)
      if (action.destructive) {
        batch.delete(ref)
      } else if (action.field) {
        batch.update(ref, { [action.field]: action.value })
      }
    }
    await batch.commit()
  }
}

export default BulkActionBar
