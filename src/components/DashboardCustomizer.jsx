import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw, X } from 'lucide-react'

const DashboardCustomizer = ({ layout, onToggle, onMove, onReset, isCustomized }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
        title="Customize Dashboard"
      >
        <Settings className="w-5 h-5" />
        {isCustomized && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9994] bg-black/30 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-80 z-[9995] bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-brand-900 to-brand-800 text-white">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  <h2 className="font-bold">Customize Dashboard</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Widget List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                  Toggle widgets on/off and reorder them.
                </p>

                {layout.map((widget, idx) => (
                  <motion.div
                    key={widget.id}
                    layout
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      widget.visible
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {/* Toggle */}
                    <button
                      onClick={() => onToggle(widget.id)}
                      className={`w-8 h-5 rounded-full relative transition-colors duration-200 ${
                        widget.visible ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <motion.div
                        animate={{ x: widget.visible ? 14 : 2 }}
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </button>

                    {/* Label */}
                    <span className={`flex-1 text-sm font-medium ${
                      widget.visible
                        ? 'text-slate-700 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {widget.label}
                    </span>

                    {/* Visibility icon */}
                    {widget.visible ? (
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    )}

                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => onMove(widget.id, 'up')}
                        disabled={idx === 0}
                        className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onMove(widget.id, 'down')}
                        disabled={idx === layout.length - 1}
                        className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              {isCustomized && (
                <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={onReset}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset to Default
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default DashboardCustomizer
