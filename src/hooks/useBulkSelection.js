import { useState, useCallback, useMemo } from 'react'

export default function useBulkSelection(items = []) {
  const [selectedIds, setSelectedIds] = useState(new Set())

  const toggleSelection = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)))
  }, [items])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isAllSelected = useMemo(() =>
    items.length > 0 && selectedIds.size === items.length,
    [items.length, selectedIds.size]
  )

  const isPartialSelected = useMemo(() =>
    selectedIds.size > 0 && selectedIds.size < items.length,
    [items.length, selectedIds.size]
  )

  const toggleAll = useCallback(() => {
    if (isAllSelected) clearSelection()
    else selectAll()
  }, [isAllSelected, clearSelection, selectAll])

  return {
    selectedIds,
    setSelectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isAllSelected,
    isPartialSelected,
    toggleAll,
    selectedCount: selectedIds.size,
  }
}
