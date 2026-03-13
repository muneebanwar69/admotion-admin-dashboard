/**
 * Production-safe logger utility
 * Only logs in development mode to avoid performance impact and exposing internals
 */

const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  
  error: (...args) => {
    // Always log errors, even in production (for debugging critical issues)
    console.error(...args)
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },
  
  table: (...args) => {
    if (isDevelopment) {
      console.table(...args)
    }
  },
  
  group: (label) => {
    if (isDevelopment) {
      console.group(label)
    }
  },
  
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd()
    }
  },
  
  time: (label) => {
    if (isDevelopment) {
      console.time(label)
    }
  },
  
  timeEnd: (label) => {
    if (isDevelopment) {
      console.timeEnd(label)
    }
  }
}

export default logger
