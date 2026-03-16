import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Zap } from 'lucide-react'
import useVoiceCommand from '../hooks/useVoiceCommand'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

const VoiceCommand = () => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { isSupported, isActive, transcript, feedback, toggle } = useVoiceCommand(navigate, toggleTheme, theme)

  if (!isSupported) return null

  return (
    <>
      {/* Feedback Toast - small, top center */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -10, x: '-50%' }}
            className="fixed top-20 left-1/2 z-[10000]"
          >
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-xl shadow-lg text-sm font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-500/90 text-white'
                : 'bg-red-500/90 text-white'
            }`}>
              <Zap className="w-3.5 h-3.5" />
              {feedback.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live transcript bar - shows only when actively hearing words */}
      <AnimatePresence>
        {isActive && transcript && (
          <motion.div
            initial={{ opacity: 0, y: -5, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -5, x: '-50%' }}
            className="fixed top-20 left-1/2 z-[9999]"
          >
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-blue-600/90 backdrop-blur-xl shadow-lg text-white text-sm">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-white flex-shrink-0"
              />
              <span className="font-medium max-w-[300px] truncate">{transcript}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button - ON/OFF mic */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={toggle}
        className={`group relative inline-flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-300 border touch-manipulation min-w-[44px] min-h-[44px] justify-center ${
          isActive
            ? 'bg-blue-500/20 border-blue-400/40 hover:bg-blue-500/30 shadow-md shadow-blue-500/15'
            : 'bg-white/10 hover:bg-white/15 border-white/20 hover:border-white/30'
        }`}
        title={isActive ? 'Voice ON — click to turn off' : 'Click to enable voice commands'}
      >
        {/* Active listening indicator */}
        {isActive && (
          <motion.span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-400"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}

        {isActive ? (
          <Mic className="w-5 h-5 text-blue-300" />
        ) : (
          <MicOff className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors" />
        )}
        <span className={`hidden sm:inline text-xs font-semibold transition-colors ${
          isActive ? 'text-blue-300' : 'text-white/40 group-hover:text-white/70'
        }`}>
          Voice
        </span>
      </motion.button>
    </>
  )
}

export default VoiceCommand
