import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X } from 'lucide-react'

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent)
const mod = isMac ? 'Cmd' : 'Ctrl'

const shortcutGroups = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Alt', 'D'], description: 'Go to Dashboard' },
      { keys: ['Alt', 'V'], description: 'Go to Vehicles' },
      { keys: ['Alt', 'A'], description: 'Go to Ads' },
      { keys: ['Alt', 'S'], description: 'Go to Scheduling' },
      { keys: ['Alt', 'N'], description: 'Go to Analytics' },
      { keys: ['Alt', 'L'], description: 'Go to Alerts' },
      { keys: ['Alt', 'P'], description: 'Go to Profile' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: [mod, 'K'], description: 'Open Command Palette' },
      { keys: [mod, 'Shift', 'F'], description: 'Open Global Search' },
      { keys: ['Alt', 'T'], description: 'Toggle Dark/Light Mode' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Show Keyboard Shortcuts' },
      { keys: ['Esc'], description: 'Close Dialogs / Panels' },
    ],
  },
]

const KeyboardShortcutsHelp = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handler = () => setIsOpen(prev => !prev)
    window.addEventListener('toggle-shortcuts-help', handler)
    return () => window.removeEventListener('toggle-shortcuts-help', handler)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9996] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-lg mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-brand-900 to-brand-800 text-white">
              <div className="flex items-center gap-3">
                <Keyboard className="w-5 h-5" />
                <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              {shortcutGroups.map(group => (
                <div key={group.title}>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                    {group.title}
                  </h3>
                  <div className="space-y-2">
                    {group.shortcuts.map((shortcut, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, ki) => (
                            <React.Fragment key={ki}>
                              {ki > 0 && <span className="text-slate-300 dark:text-slate-600 text-xs">+</span>}
                              <kbd className="min-w-[24px] px-2 py-1 text-center text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-sm">
                                {key}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default KeyboardShortcutsHelp
