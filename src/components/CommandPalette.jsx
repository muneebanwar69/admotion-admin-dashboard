import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import {
  Search, Command, LayoutDashboard, Truck, Layers, CalendarClock,
  BarChart3, Bell, User, Shield, Moon, Sun, LogOut, Plus,
  ArrowUp, ArrowDown, CornerDownLeft, FileText, MessageCircle, Settings
} from 'lucide-react'

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { logout } = useAuth()

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Navigation', action: () => navigate('/dashboard') },
    { id: 'vehicles', label: 'Vehicles Management', icon: Truck, section: 'Navigation', action: () => navigate('/vehicles') },
    { id: 'ads', label: 'Ads Management', icon: Layers, section: 'Navigation', action: () => navigate('/ads') },
    { id: 'scheduling', label: 'Scheduling', icon: CalendarClock, section: 'Navigation', action: () => navigate('/scheduling') },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, section: 'Navigation', action: () => navigate('/analytics') },
    { id: 'alerts', label: 'Alerts Management', icon: Bell, section: 'Navigation', action: () => navigate('/alerts') },
    { id: 'profile', label: 'My Profile', icon: User, section: 'Navigation', action: () => navigate('/my-profile') },
    { id: 'admin', label: 'Admin Management', icon: Shield, section: 'Navigation', action: () => navigate('/admin') },
    { id: 'reports', label: 'Vehicle Reports', icon: FileText, section: 'Navigation', action: () => navigate('/vehicle-reports') },
    { id: 'report-settings', label: 'Report Settings', icon: Settings, section: 'Navigation', action: () => navigate('/report-settings') },
  ]

  const actionItems = [
    { id: 'toggle-theme', label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode', icon: theme === 'dark' ? Sun : Moon, section: 'Actions', action: () => { toggleTheme(); setIsOpen(false) } },
    { id: 'add-vehicle', label: 'Add New Vehicle', icon: Plus, section: 'Actions', action: () => navigate('/vehicles') },
    { id: 'add-ad', label: 'Upload New Ad', icon: Plus, section: 'Actions', action: () => navigate('/ads') },
    { id: 'logout', label: 'Logout', icon: LogOut, section: 'Actions', action: async () => { await logout(); navigate('/login') } },
  ]

  const allItems = [...navItems, ...actionItems]

  const filteredItems = query.trim()
    ? allItems.filter(item => {
        const q = query.toLowerCase()
        const label = item.label.toLowerCase()
        if (label.includes(q)) return true
        let qi = 0
        for (let i = 0; i < label.length && qi < q.length; i++) {
          if (label[i] === q[qi]) qi++
        }
        return qi === q.length
      })
    : allItems

  const groupedItems = filteredItems.reduce((groups, item) => {
    if (!groups[item.section]) groups[item.section] = []
    groups[item.section].push(item)
    return groups
  }, {})

  const flatFiltered = filteredItems

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const executeItem = useCallback((item) => {
    setIsOpen(false)
    setQuery('')
    setTimeout(() => item.action(), 50)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
        setQuery('')
        setSelectedIndex(0)
      }
    }

    const handleCustomEvent = () => {
      setIsOpen(true)
      setQuery('')
      setSelectedIndex(0)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-palette', handleCustomEvent)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-palette', handleCustomEvent)
    }
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % flatFiltered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + flatFiltered.length) % flatFiltered.length)
    } else if (e.key === 'Enter' && flatFiltered[selectedIndex]) {
      e.preventDefault()
      executeItem(flatFiltered[selectedIndex])
    }
  }

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selected) selected.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  let flatIndex = -1

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
          onClick={() => { setIsOpen(false); setQuery('') }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none text-sm"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
              {flatFiltered.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                  No results found for "{query}"
                </div>
              ) : (
                Object.entries(groupedItems).map(([section, items]) => (
                  <div key={section}>
                    <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {section}
                    </div>
                    {items.map(item => {
                      flatIndex++
                      const idx = flatIndex
                      const Icon = item.icon
                      const isSelected = idx === selectedIndex
                      return (
                        <button
                          key={item.id}
                          data-index={idx}
                          onClick={() => executeItem(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 ${
                            isSelected
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="flex-1 text-sm font-medium">{item.label}</span>
                          {isSelected && (
                            <CornerDownLeft className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" /> Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-mono">ESC</kbd> Close
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CommandPalette
