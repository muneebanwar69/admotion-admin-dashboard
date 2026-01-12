import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheckCircle, FiAlertCircle, FiXCircle, FiInfo, FiX } from 'react-icons/fi'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    const toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast])
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast])
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast])
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast])

  const value = {
    success,
    error,
    warning,
    info,
    addToast,
    removeToast
  }

  const getToastStyles = (type) => {
    const styles = {
      success: {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
        icon: <FiCheckCircle className="w-5 h-5" />,
        border: 'border-green-400'
      },
      error: {
        bg: 'bg-gradient-to-r from-red-500 to-rose-600',
        icon: <FiXCircle className="w-5 h-5" />,
        border: 'border-red-400'
      },
      warning: {
        bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
        icon: <FiAlertCircle className="w-5 h-5" />,
        border: 'border-amber-400'
      },
      info: {
        bg: 'bg-gradient-to-r from-blue-500 to-cyan-600',
        icon: <FiInfo className="w-5 h-5" />,
        border: 'border-blue-400'
      }
    }
    return styles[type] || styles.info
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-md w-full">
        <AnimatePresence>
          {toasts.map((toast, index) => {
            const styles = getToastStyles(toast.type)
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 300, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 300, scale: 0.8 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 30,
                  delay: index * 0.1 
                }}
                className="pointer-events-auto"
              >
                <div className={`${styles.bg} ${styles.border} border-2 rounded-xl shadow-2xl p-4 backdrop-blur-sm relative overflow-hidden`}>
                  {/* Progress bar */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-white/30"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: toast.duration / 1000, ease: 'linear' }}
                  />
                  
                  {/* Content */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5 text-white">
                      {styles.icon}
                    </div>
                    <div className="flex-1 text-white">
                      <p className="font-semibold text-sm leading-tight">{toast.message}</p>
                    </div>
                    <button
                      onClick={() => removeToast(toast.id)}
                      className="flex-shrink-0 text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/20"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}


