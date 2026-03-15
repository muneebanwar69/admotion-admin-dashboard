import { useEffect } from 'react'

export default function useKeyboardShortcuts(navigate, toggleTheme) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable

      // Ctrl/Cmd + K → Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        window.dispatchEvent(new Event('open-command-palette'))
        return
      }

      // Ctrl/Cmd + Shift + F → Global Search
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        window.dispatchEvent(new Event('open-global-search'))
        return
      }

      // Don't trigger shortcuts when typing in inputs
      if (isInput) return

      // ? → Keyboard shortcuts help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        window.dispatchEvent(new Event('toggle-shortcuts-help'))
        return
      }

      // Alt + key navigation shortcuts
      if (e.altKey) {
        const routes = {
          'd': '/dashboard',
          'v': '/vehicles',
          'a': '/ads',
          's': '/scheduling',
          'n': '/analytics',
          'l': '/alerts',
          'p': '/my-profile',
        }
        const route = routes[e.key.toLowerCase()]
        if (route) {
          e.preventDefault()
          navigate(route)
          return
        }
        if (e.key.toLowerCase() === 't') {
          e.preventDefault()
          toggleTheme()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, toggleTheme])
}
