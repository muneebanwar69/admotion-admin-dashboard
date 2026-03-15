import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'admotion_favorites'
const listeners = new Set()

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function notify() {
  listeners.forEach(fn => fn())
}

export default function useFavorites(type) {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const handler = () => forceUpdate(c => c + 1)
    listeners.add(handler)
    return () => listeners.delete(handler)
  }, [])

  const favorites = getAll()[type] || []

  const isFavorite = useCallback((id) => {
    return (getAll()[type] || []).includes(id)
  }, [type])

  const toggleFavorite = useCallback((id) => {
    const all = getAll()
    const list = all[type] || []
    if (list.includes(id)) {
      all[type] = list.filter(fId => fId !== id)
    } else {
      all[type] = [id, ...list]
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    notify()
  }, [type])

  const clearFavorites = useCallback(() => {
    const all = getAll()
    all[type] = []
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    notify()
  }, [type])

  return { favorites, isFavorite, toggleFavorite, clearFavorites }
}
