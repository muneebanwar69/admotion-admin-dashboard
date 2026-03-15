import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { UploadProvider } from './contexts/UploadContext'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThemeProvider>
      <ToastProvider>
        <UploadProvider>
          <App />
        </UploadProvider>
      </ToastProvider>
    </ThemeProvider>
  </BrowserRouter>
)

// ─── PWA Service Worker Registration ───
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

// ─── Remove loading screen ───
const loader = document.getElementById('app-loader')
if (loader) loader.style.display = 'none'

