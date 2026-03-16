import { useState, useEffect, useRef, useCallback } from 'react'

const COMMANDS = [
  // Navigation
  { patterns: ['go to dashboard', 'show dashboard', 'open dashboard', 'home'], action: 'navigate', target: '/dashboard' },
  { patterns: ['go to vehicles', 'show vehicles', 'open vehicles', 'vehicle management'], action: 'navigate', target: '/vehicles' },
  { patterns: ['go to ads', 'show ads', 'open ads', 'ad management', 'advertisements'], action: 'navigate', target: '/ads' },
  { patterns: ['go to analytics', 'show analytics', 'open analytics', 'show stats', 'statistics'], action: 'navigate', target: '/analytics' },
  { patterns: ['go to scheduling', 'show scheduling', 'open scheduling', 'campaigns'], action: 'navigate', target: '/scheduling' },
  { patterns: ['go to alerts', 'show alerts', 'open alerts', 'notifications'], action: 'navigate', target: '/alerts' },
  { patterns: ['go to profile', 'show profile', 'my profile', 'open profile'], action: 'navigate', target: '/my-profile' },
  { patterns: ['go to admin', 'admin management', 'manage admins'], action: 'navigate', target: '/admin' },
  { patterns: ['go to reports', 'vehicle reports', 'show reports'], action: 'navigate', target: '/vehicle-reports' },
  { patterns: ['go to settings', 'report settings', 'open settings'], action: 'navigate', target: '/report-settings' },

  // Quick actions
  { patterns: ['show active vehicles', 'active vehicles', 'how many vehicles active', 'vehicles online'], action: 'navigate', target: '/vehicles?filter=active' },
  { patterns: ['show active ads', 'active ads', 'running ads', 'live ads'], action: 'navigate', target: '/ads?filter=active' },
  { patterns: ['add vehicle', 'new vehicle', 'register vehicle', 'create vehicle'], action: 'navigate', target: '/vehicles?action=add' },
  { patterns: ['add ad', 'new ad', 'create ad', 'upload ad'], action: 'navigate', target: '/ads?action=add' },

  // Theme
  { patterns: ['dark mode', 'switch to dark', 'enable dark mode', 'dark theme'], action: 'theme', target: 'dark' },
  { patterns: ['light mode', 'switch to light', 'enable light mode', 'light theme'], action: 'theme', target: 'light' },
  { patterns: ['toggle theme', 'switch theme', 'change theme'], action: 'theme', target: 'toggle' },
]

export default function useVoiceCommand(navigate, toggleTheme, currentTheme) {
  const [isActive, setIsActive] = useState(() => localStorage.getItem('voice_active') === 'true')
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState(null)
  const recognitionRef = useRef(null)
  const feedbackTimerRef = useRef(null)
  const restartTimerRef = useRef(null)

  const SpeechRecognition = typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

  const isSupported = !!SpeechRecognition

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message })
    clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2500)
  }, [])

  const processCommand = useCallback((text) => {
    const lower = text.toLowerCase().trim()
    if (!lower || lower.length < 2) return false

    for (const cmd of COMMANDS) {
      for (const pattern of cmd.patterns) {
        if (lower.includes(pattern)) {
          switch (cmd.action) {
            case 'navigate':
              navigate(cmd.target)
              showFeedback('success', `→ ${cmd.target.split('?')[0].slice(1) || 'dashboard'}`)
              return true
            case 'theme':
              if (cmd.target === 'toggle') {
                toggleTheme()
                showFeedback('success', 'Theme toggled')
              } else if (cmd.target !== currentTheme) {
                toggleTheme()
                showFeedback('success', `${cmd.target} mode`)
              }
              return true
            default:
              return false
          }
        }
      }
    }
    return false
  }, [navigate, toggleTheme, currentTheme, showFeedback])

  // Start continuous recognition
  const startRecognition = useCallback(() => {
    if (!isSupported || !SpeechRecognition) return
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (e) { /* */ }
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          processCommand(t)
          setTranscript('')
        } else {
          interim = t
        }
      }
      if (interim) setTranscript(interim)
    }

    recognition.onend = () => {
      // Auto-restart if still active (continuous mode)
      setTranscript('')
      if (localStorage.getItem('voice_active') === 'true') {
        restartTimerRef.current = setTimeout(() => {
          if (localStorage.getItem('voice_active') === 'true') {
            startRecognition()
          }
        }, 300)
      }
    }

    recognition.onerror = (e) => {
      setTranscript('')
      // Auto-restart on recoverable errors
      if (e.error === 'no-speech' || e.error === 'aborted' || e.error === 'network') {
        if (localStorage.getItem('voice_active') === 'true') {
          restartTimerRef.current = setTimeout(startRecognition, 1000)
        }
      } else if (e.error === 'not-allowed') {
        showFeedback('error', 'Microphone access denied')
        setIsActive(false)
        localStorage.setItem('voice_active', 'false')
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (e) { /* already started */ }
  }, [isSupported, SpeechRecognition, processCommand, showFeedback])

  const stopRecognition = useCallback(() => {
    clearTimeout(restartTimerRef.current)
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (e) { /* */ }
      recognitionRef.current = null
    }
    setTranscript('')
  }, [])

  // Toggle on/off
  const toggle = useCallback(() => {
    const next = !isActive
    setIsActive(next)
    localStorage.setItem('voice_active', next.toString())
    if (next) {
      startRecognition()
      showFeedback('success', 'Voice commands ON')
    } else {
      stopRecognition()
      showFeedback('success', 'Voice commands OFF')
    }
  }, [isActive, startRecognition, stopRecognition, showFeedback])

  // Auto-start on mount if was active
  useEffect(() => {
    if (isActive && isSupported) {
      startRecognition()
    }
    return () => {
      stopRecognition()
      clearTimeout(feedbackTimerRef.current)
    }
  }, []) // Only on mount

  return {
    isSupported,
    isActive,
    transcript,
    feedback,
    toggle,
  }
}
