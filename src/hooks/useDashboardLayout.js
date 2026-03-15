import { useState, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'admotion_dashboard_layout'

const DEFAULT_LAYOUT = [
  { id: 'kpi-cards', label: 'KPI Cards', icon: 'BarChart3', visible: true, order: 0 },
  { id: 'map', label: 'Vehicle Map', icon: 'Map', visible: true, order: 1 },
  { id: 'vehicle-table', label: 'Vehicle/Ad Assignments', icon: 'Table', visible: true, order: 2 },
  { id: 'recent-activity', label: 'Recent Activity', icon: 'Activity', visible: false, order: 3 },
  { id: 'utilization', label: 'Fleet Utilization', icon: 'Truck', visible: false, order: 4 },
  { id: 'top-ads', label: 'Top Performing Ads', icon: 'Zap', visible: false, order: 5 },
  { id: 'quick-actions', label: 'Quick Actions', icon: 'Layers', visible: false, order: 6 },
  { id: 'driver-earnings', label: 'Driver Earnings', icon: 'DollarSign', visible: true, order: 7 },
]

function loadLayout() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_LAYOUT
    const parsed = JSON.parse(stored)
    // Merge with defaults to handle new widgets added after save
    const merged = DEFAULT_LAYOUT.map(def => {
      const saved = parsed.find(p => p.id === def.id)
      return saved ? { ...def, ...saved } : def
    })
    return merged.sort((a, b) => a.order - b.order)
  } catch {
    return DEFAULT_LAYOUT
  }
}

export default function useDashboardLayout() {
  const [layout, setLayout] = useState(loadLayout)

  const save = useCallback((newLayout) => {
    setLayout(newLayout)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout))
  }, [])

  const toggleWidget = useCallback((id) => {
    save(layout.map(w => w.id === id ? { ...w, visible: !w.visible } : w))
  }, [layout, save])

  const moveWidget = useCallback((id, direction) => {
    const sorted = [...layout].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex(w => w.id === id)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sorted.length) return

    const temp = sorted[idx].order
    sorted[idx] = { ...sorted[idx], order: sorted[targetIdx].order }
    sorted[targetIdx] = { ...sorted[targetIdx], order: temp }
    save(sorted.sort((a, b) => a.order - b.order))
  }, [layout, save])

  const resetLayout = useCallback(() => {
    save([...DEFAULT_LAYOUT])
  }, [save])

  const visibleWidgets = useMemo(() =>
    [...layout].sort((a, b) => a.order - b.order).filter(w => w.visible),
    [layout]
  )

  const isCustomized = useMemo(() =>
    JSON.stringify(layout.map(w => ({ id: w.id, visible: w.visible, order: w.order }))) !==
    JSON.stringify(DEFAULT_LAYOUT.map(w => ({ id: w.id, visible: w.visible, order: w.order }))),
    [layout]
  )

  return {
    layout: [...layout].sort((a, b) => a.order - b.order),
    visibleWidgets,
    toggleWidget,
    moveWidget,
    resetLayout,
    isCustomized,
  }
}
