import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// PWA Install prompt handler
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA was installed successfully!')
  // Hide any install prompts
  window.deferredPrompt = null
})

// Handle PWA display mode
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
  console.log('📱 Running as installed PWA')
  document.body.classList.add('pwa-mode')
}

// Store last reload time for debugging
localStorage.setItem('last_reload', new Date().toISOString())

// TV Box / Kiosk mode optimizations
document.addEventListener('DOMContentLoaded', () => {
  // Prevent all default touch behaviors for TV
  document.body.style.touchAction = 'none'
  document.body.style.userSelect = 'none'
  document.body.style.webkitUserSelect = 'none'
  
  // Prevent scrolling
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'
  document.body.style.height = '100%'
})

// Handle visibility changes (TV sleep/wake)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('👁️ App became visible - checking ads...')
    window.dispatchEvent(new CustomEvent('app-visible'))
  }
})

// Online/offline handling
window.addEventListener('online', () => {
  console.log('🌐 Back online!')
  window.dispatchEvent(new CustomEvent('app-online'))
})

window.addEventListener('offline', () => {
  console.log('📴 Gone offline - using cached content')
  window.dispatchEvent(new CustomEvent('app-offline'))
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


