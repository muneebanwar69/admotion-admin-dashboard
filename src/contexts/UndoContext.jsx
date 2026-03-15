import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const UndoContext = createContext()

export const useUndoManager = () => {
  const context = useContext(UndoContext)
  if (!context) throw new Error('useUndoManager must be used within UndoProvider')
  return context
}

export const UndoProvider = ({ children }) => {
  const [pendingActions, setPendingActions] = useState([])
  const timersRef = useRef({})

  // Clean up expired actions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setPendingActions(prev =>
        prev.filter(action => now - action.timestamp < 10000)
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const pushAction = useCallback((action) => {
    const id = Date.now() + Math.random()
    const newAction = {
      id,
      type: action.type,
      description: action.description,
      undoFn: action.undoFn,
      timestamp: Date.now(),
    }

    setPendingActions(prev => [newAction, ...prev].slice(0, 10))

    // Auto-remove after 10 seconds
    timersRef.current[id] = setTimeout(() => {
      setPendingActions(prev => prev.filter(a => a.id !== id))
      delete timersRef.current[id]
    }, 10000)
  }, [])

  const undoLast = useCallback(async () => {
    const action = pendingActions[0]
    if (!action) return

    try {
      await action.undoFn()
      setPendingActions(prev => prev.filter(a => a.id !== action.id))
      if (timersRef.current[action.id]) {
        clearTimeout(timersRef.current[action.id])
        delete timersRef.current[action.id]
      }
      return true
    } catch (err) {
      console.error('Undo failed:', err)
      return false
    }
  }, [pendingActions])

  const undoAction = useCallback(async (actionId) => {
    const action = pendingActions.find(a => a.id === actionId)
    if (!action) return false

    try {
      await action.undoFn()
      setPendingActions(prev => prev.filter(a => a.id !== actionId))
      if (timersRef.current[actionId]) {
        clearTimeout(timersRef.current[actionId])
        delete timersRef.current[actionId]
      }
      return true
    } catch (err) {
      console.error('Undo failed:', err)
      return false
    }
  }, [pendingActions])

  const dismissAction = useCallback((actionId) => {
    setPendingActions(prev => prev.filter(a => a.id !== actionId))
    if (timersRef.current[actionId]) {
      clearTimeout(timersRef.current[actionId])
      delete timersRef.current[actionId]
    }
  }, [])

  const clearAll = useCallback(() => {
    Object.values(timersRef.current).forEach(clearTimeout)
    timersRef.current = {}
    setPendingActions([])
  }, [])

  const value = {
    pushAction,
    undoLast,
    undoAction,
    dismissAction,
    pendingActions,
    clearAll,
  }

  return <UndoContext.Provider value={value}>{children}</UndoContext.Provider>
}
