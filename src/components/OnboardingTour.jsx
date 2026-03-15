import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronRight, ChevronLeft, X, Check, LayoutDashboard, Truck, Layers, CalendarClock, BarChart3, Bell, Rocket } from 'lucide-react'

const STORAGE_KEY = 'admotion_onboarding_complete'

export const resetOnboarding = () => {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('restart-onboarding'))
}

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to AdMotion',
    description: 'Your intelligent Digital Out-of-Home advertising platform. Let us give you a quick tour of the dashboard.',
    icon: Rocket,
    color: 'from-blue-500 to-purple-600',
    position: 'center',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Your command center — monitor KPIs, view the live vehicle map, and track ad assignments in real-time.',
    icon: LayoutDashboard,
    color: 'from-blue-500 to-cyan-500',
    route: '/dashboard',
  },
  {
    id: 'vehicles',
    title: 'Vehicles Management',
    description: 'Register and manage your fleet of advertising vehicles. Track their status, location, and performance.',
    icon: Truck,
    color: 'from-emerald-500 to-teal-500',
    route: '/vehicles',
  },
  {
    id: 'ads',
    title: 'Ads Management',
    description: 'Upload images and videos, configure targeting by city, time slot, and weather, and manage your ad campaigns.',
    icon: Layers,
    color: 'from-violet-500 to-purple-500',
    route: '/ads',
  },
  {
    id: 'scheduling',
    title: 'Scheduling',
    description: 'AI-powered ad scheduling distributes ads fairly across your fleet. Create campaigns with targeted delivery.',
    icon: CalendarClock,
    color: 'from-amber-500 to-orange-500',
    route: '/scheduling',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Track performance with real-time charts, KPIs, and insights. Monitor impressions, vehicle activity, and more.',
    icon: BarChart3,
    color: 'from-pink-500 to-rose-500',
    route: '/analytics',
  },
  {
    id: 'alerts',
    title: 'Alerts & Activity',
    description: 'Monitor system alerts, track all admin actions, and stay on top of vehicle offline notifications and ad expiry warnings.',
    icon: Bell,
    color: 'from-red-500 to-orange-500',
    route: '/alerts',
  },
]

const OnboardingTour = () => {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      setTimeout(() => setIsActive(true), 1000)
    }

    const handleRestart = () => {
      setCurrentStep(0)
      setIsActive(true)
    }
    window.addEventListener('restart-onboarding', handleRestart)
    return () => window.removeEventListener('restart-onboarding', handleRestart)
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsActive(false)
  }

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true')
    } else {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
    setIsActive(false)
  }

  if (!isActive) return null

  const step = steps[currentStep]
  const Icon = step.icon
  const isLast = currentStep === steps.length - 1
  const isFirst = currentStep === 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-lg mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          {/* Header with gradient */}
          <div className={`bg-gradient-to-r ${step.color} p-6 text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
            <div className="relative z-10 flex items-center gap-4">
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20"
              >
                <Icon className="w-7 h-7" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">{step.title}</h2>
                <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed"
            >
              {step.description}
            </motion.p>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {steps.map((_, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    width: idx === currentStep ? 24 : 8,
                    backgroundColor: idx === currentStep ? '#3b82f6' : idx < currentStep ? '#10b981' : '#e2e8f0'
                  }}
                  className="h-2 rounded-full"
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>

            {/* Don't show again */}
            {isLast && (
              <motion.label
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 mt-4 cursor-pointer text-sm text-slate-500 dark:text-slate-400"
              >
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={e => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                Don't show this tour again
              </motion.label>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={handleSkip}
              className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Skip Tour
            </button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBack}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className={`flex items-center gap-1 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${
                  isLast
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                } shadow-lg`}
              >
                {isLast ? (
                  <><Check className="w-4 h-4" /> Get Started</>
                ) : (
                  <>Next <ChevronRight className="w-4 h-4" /></>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default OnboardingTour
