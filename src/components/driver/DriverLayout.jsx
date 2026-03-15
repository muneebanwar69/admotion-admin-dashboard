import React, { useState, useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, MapPin, Wallet, Bell, User, LogOut, Sun, Moon, Menu, X, Car, ChevronRight } from 'lucide-react'
import { useDriverAuth } from '../../contexts/DriverAuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import DriverMessaging from './DriverMessaging'

const navItems = [
  { to: '/driver', label: 'Home', icon: Home, end: true },
  { to: '/driver/route', label: 'Route', icon: MapPin },
  { to: '/driver/earnings', label: 'Earnings', icon: Wallet },
  { to: '/driver/alerts', label: 'Alerts', icon: Bell },
  { to: '/driver/profile', label: 'Profile', icon: User },
]

/* Tiny floating particle used as decoration */
const FloatingDot = ({ delay, x, size = 3 }) => (
  <motion.span
    className="absolute rounded-full bg-amber-400/20 pointer-events-none"
    style={{ width: size, height: size, left: `${x}%` }}
    initial={{ y: 0, opacity: 0 }}
    animate={{ y: [-8, 8, -8], opacity: [0, 0.7, 0] }}
    transition={{ duration: 4, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
)

const DriverLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { driver, logoutDriver } = useDriverAuth()
  const { theme, toggleTheme } = useTheme()
  const [showMenu, setShowMenu] = useState(false)

  const isActive = (item) => {
    if (item.end) return location.pathname === item.to
    return location.pathname.startsWith(item.to)
  }

  const currentPage = navItems.find(item => isActive(item))

  const handleLogout = async () => {
    await logoutDriver()
    navigate('/driver/login')
  }

  useEffect(() => {
    setShowMenu(false)
  }, [location.pathname])

  /* Memoize particles so they don't re-render every route change */
  const headerParticles = useMemo(() => (
    <>
      <FloatingDot delay={0} x={10} size={4} />
      <FloatingDot delay={1.2} x={30} size={3} />
      <FloatingDot delay={0.6} x={55} size={5} />
      <FloatingDot delay={1.8} x={75} size={3} />
      <FloatingDot delay={0.3} x={90} size={4} />
    </>
  ), [])

  return (
    <div className="min-h-screen flex flex-col bg-[var(--app-bg)] transition-colors duration-300">
      {/* ─── Top Header with animated gradient ─── */}
      <header className="sticky top-0 z-50 shadow-2xl border-b border-white/10 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900" />
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{ background: 'linear-gradient(120deg, #f59e0b22, #3b82f622, #14b8a622, #f59e0b22)', backgroundSize: '300% 100%' }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        {/* Decorative particles in header */}
        <div className="absolute inset-0 overflow-hidden">{headerParticles}</div>

        <div className="relative flex items-center justify-between px-4 h-14 sm:h-16">
          {/* Left */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-400/30"
            >
              <Car className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-wide bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
                AdMotion
              </h1>
              <p className="text-[9px] text-amber-300/60 uppercase tracking-[0.15em] -mt-0.5 hidden sm:block">Driver</p>
            </div>
            {currentPage && (
              <div className="hidden sm:flex items-center gap-1.5 ml-2 text-xs text-white/50">
                <ChevronRight size={12} className="text-white/30" />
                <span className="text-amber-300/70 font-medium">{currentPage.label}</span>
              </div>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 20 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300 touch-manipulation"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-[18px] h-[18px] text-amber-300" /> : <Moon className="w-[18px] h-[18px] text-white/80" />}
            </motion.button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300 touch-manipulation sm:hidden"
            >
              {showMenu ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-500/20 text-white/70 hover:text-red-300 transition-all duration-300 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </motion.button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="relative overflow-hidden border-t border-white/10 sm:hidden backdrop-blur-md bg-brand-900/60"
            >
              <div className="p-3 space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  {driver?.profileImage ? (
                    <img src={driver.profileImage} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-amber-400/40" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
                      {driver?.name?.charAt(0) || 'D'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{driver?.name || 'Driver'}</p>
                    <p className="text-[10px] text-amber-300/60 font-mono">{driver?.cnic}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-300 hover:bg-red-500/15 transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 pb-20 sm:pb-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ─── Bottom Navigation - Mobile (Frosted Glass) ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-200/60 dark:border-slate-700/40 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-around px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
            {navItems.map((item) => {
              const active = isActive(item)
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 touch-manipulation min-w-[56px] relative ${
                    active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 dark:text-slate-500 active:text-slate-600'
                  }`}
                >
                  <motion.div
                    className="relative"
                    animate={active ? { scale: 1.15 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <Icon className="w-5 h-5" />
                    {active && (
                      <>
                        {/* Glowing dot indicator */}
                        <motion.div
                          layoutId="bottomNavDot"
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                        {/* Glow behind dot */}
                        <motion.div
                          layoutId="bottomNavGlow"
                          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-3 rounded-full bg-blue-500/30 dark:bg-blue-400/20 blur-sm"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </>
                    )}
                  </motion.div>
                  <span className={`text-[10px] transition-all duration-300 ${active ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* ─── Desktop Sidebar ─── */}
      <div className="hidden sm:block fixed left-0 top-16 bottom-0 w-20 md:w-56 bg-gradient-to-b from-brand-900 via-brand-800 to-brand-900 text-white z-40 shadow-2xl border-r border-white/10">
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-amber-400/20 via-blue-400/10 to-transparent" />

        <nav className="pt-4 px-2">
          {navItems.map((item) => {
            const active = isActive(item)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={`group flex items-center gap-3 px-3 py-3 mb-1 rounded-xl relative overflow-hidden transition-all duration-300 touch-manipulation ${
                  active
                    ? 'bg-gradient-to-r from-amber-500/20 via-yellow-400/15 to-transparent text-amber-300 shadow-lg shadow-amber-500/10 border border-amber-400/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="sidebarIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-r-full shadow-lg shadow-amber-400/60"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {/* Hover glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-amber-400/5 to-transparent rounded-xl pointer-events-none" />
                <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${active ? 'text-amber-300' : 'group-hover:text-amber-200'}`} />
                <span className={`hidden md:block text-sm whitespace-nowrap transition-all duration-300 ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
                {/* Active glow on the right side */}
                {active && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400/60 blur-sm" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:rotate-12 transition-transform duration-300" />
            <span className="hidden md:block text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Driver Messaging Widget */}
      <DriverMessaging />

      {/* Content offset for desktop sidebar */}
      <style>{`
        @media (min-width: 640px) {
          main { margin-left: 5rem; }
        }
        @media (min-width: 768px) {
          main { margin-left: 14rem; }
        }
      `}</style>
    </div>
  )
}

export default DriverLayout
