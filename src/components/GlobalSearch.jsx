import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, X, Truck, Layers, CalendarClock, Clock, ArrowRight, Loader2 } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const CACHE_TTL = 30000
let dataCache = { ads: null, vehicles: null, campaigns: null, timestamp: 0 }

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admotion_recent_searches') || '[]') }
    catch { return [] }
  })
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        setIsOpen(true)
        setQuery('')
      }
    }
    const customHandler = () => { setIsOpen(true); setQuery('') }
    window.addEventListener('keydown', handler)
    window.addEventListener('open-global-search', customHandler)
    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('open-global-search', customHandler)
    }
  }, [])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  const fetchData = useCallback(async () => {
    const now = Date.now()
    if (dataCache.ads && now - dataCache.timestamp < CACHE_TTL) {
      return { ads: dataCache.ads, vehicles: dataCache.vehicles, campaigns: dataCache.campaigns }
    }
    const [adsSnap, vehiclesSnap, campaignsSnap] = await Promise.all([
      getDocs(collection(db, 'ads')),
      getDocs(collection(db, 'vehicles')),
      getDocs(collection(db, 'campaigns')).catch(() => ({ docs: [] })),
    ])
    const data = {
      ads: adsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      vehicles: vehiclesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      campaigns: campaignsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    }
    dataCache = { ...data, timestamp: now }
    return data
  }, [])

  const performSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults({}); return }
    setLoading(true)
    try {
      const data = await fetchData()
      const term = q.toLowerCase()
      const grouped = {}

      const matchedVehicles = data.vehicles.filter(v =>
        v.carId?.toLowerCase().includes(term) ||
        v.vehicleName?.toLowerCase().includes(term) ||
        v.ownerName?.toLowerCase().includes(term) ||
        v.model?.toLowerCase().includes(term) ||
        v.cnic?.toLowerCase().includes(term)
      ).slice(0, 5)
      if (matchedVehicles.length) {
        grouped.vehicles = matchedVehicles.map(v => ({
          id: v.id, title: v.vehicleName || v.carId || 'Vehicle',
          subtitle: `${v.carId || ''} - ${v.ownerName || 'Unknown owner'}`,
          icon: Truck, route: '/vehicles',
        }))
      }

      const matchedAds = data.ads.filter(a =>
        a.title?.toLowerCase().includes(term) ||
        a.company?.toLowerCase().includes(term) ||
        a.city?.toLowerCase().includes(term) ||
        a.status?.toLowerCase().includes(term)
      ).slice(0, 5)
      if (matchedAds.length) {
        grouped.ads = matchedAds.map(a => ({
          id: a.id, title: a.title || 'Untitled Ad',
          subtitle: `${a.company || 'Unknown'} - ${a.status || 'N/A'}`,
          icon: Layers, route: '/ads',
        }))
      }

      const matchedCampaigns = data.campaigns.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
      ).slice(0, 5)
      if (matchedCampaigns.length) {
        grouped.campaigns = matchedCampaigns.map(c => ({
          id: c.id, title: c.name || 'Campaign',
          subtitle: c.description || c.status || '',
          icon: CalendarClock, route: '/scheduling',
        }))
      }

      setResults(grouped)
      setSelectedIndex(0)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchData])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => performSearch(query), 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, performSearch])

  const flatResults = Object.values(results).flat()

  const saveRecentSearch = (q) => {
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('admotion_recent_searches', JSON.stringify(updated))
  }

  const selectResult = (result) => {
    saveRecentSearch(query)
    setIsOpen(false)
    setQuery('')
    navigate(result.route)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setIsOpen(false); setQuery('') }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => (prev + 1) % Math.max(flatResults.length, 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => (prev - 1 + flatResults.length) % Math.max(flatResults.length, 1)) }
    else if (e.key === 'Enter' && flatResults[selectedIndex]) { e.preventDefault(); selectResult(flatResults[selectedIndex]) }
  }

  const sectionLabels = { vehicles: 'Vehicles', ads: 'Ads', campaigns: 'Campaigns' }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9997] flex items-start justify-center pt-[12vh] bg-black/50 backdrop-blur-sm"
          onClick={() => { setIsOpen(false); setQuery('') }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              {loading ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
              ) : (
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search vehicles, ads, campaigns..."
                className="flex-1 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none text-sm"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {!query.trim() && recentSearches.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Recent Searches
                  </div>
                  {recentSearches.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(s)}
                      className="w-full px-4 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {query.trim() && !loading && flatResults.length === 0 && (
                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                  No results found for "{query}"
                </div>
              )}

              {Object.entries(results).map(([section, items]) => {
                const SectionIcon = items[0]?.icon || Search
                return (
                  <div key={section} className="py-1">
                    <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      <SectionIcon className="w-3 h-3" /> {sectionLabels[section] || section}
                    </div>
                    {items.map((item, i) => {
                      const globalIdx = flatResults.indexOf(item)
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          onClick={() => selectResult(item)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            globalIdx === selectedIndex
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            globalIdx === selectedIndex
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{item.title}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{item.subtitle}</div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-400">
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">Ctrl+Shift+F</kbd> to toggle search
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GlobalSearch
