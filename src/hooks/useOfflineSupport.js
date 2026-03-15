import { useState, useEffect, useCallback, useRef } from 'react'

const CACHE_KEY = 'admotion_offline_cache'
const QUEUE_KEY = 'admotion_offline_queue'

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') }
  catch { return null }
}

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') }
  catch { return [] }
}

export default function useOfflineSupport() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [cachedData, setCachedData] = useState(loadCache)
  const [pendingOps, setPendingOps] = useState(loadQueue)
  const syncingRef = useRef(false)

  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => {
      setIsOffline(false)
      flushQueue()
    }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  const cacheData = useCallback((data) => {
    const cached = {
      vehicles: (data.vehicles || []).map(v => ({
        id: v.id, carId: v.carId, vehicleName: v.vehicleName,
        status: v.status, ownerName: v.ownerName,
        location: v.location ? { lat: v.location.lat, lon: v.location.lon, address: v.location.address } : null,
      })),
      ads: (data.ads || []).map(a => ({
        id: a.id, title: a.title, status: a.status, company: a.company,
      })),
      kpis: data.kpis || {},
      lastCached: new Date().toISOString(),
    }
    setCachedData(cached)
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
  }, [])

  const queueOperation = useCallback((operation) => {
    const op = { ...operation, id: Date.now(), timestamp: new Date().toISOString() }
    setPendingOps(prev => {
      const updated = [...prev, op]
      localStorage.setItem(QUEUE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const flushQueue = useCallback(async () => {
    if (syncingRef.current) return
    const queue = loadQueue()
    if (queue.length === 0) return

    syncingRef.current = true
    const remaining = []

    for (const op of queue) {
      try {
        if (op.execute && typeof op.execute === 'string') {
          // Operations are stored as descriptions - actual execution needs the calling code
          console.log('Flushing queued operation:', op.description)
        }
      } catch (err) {
        console.error('Failed to flush operation:', err)
        remaining.push(op)
      }
    }

    setPendingOps(remaining)
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
    syncingRef.current = false
  }, [])

  return {
    isOffline,
    cachedData,
    cacheData,
    queueOperation,
    flushQueue,
    pendingOperations: pendingOps.length,
  }
}
