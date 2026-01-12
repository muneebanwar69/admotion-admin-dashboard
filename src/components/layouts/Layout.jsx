import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiMenu, FiLogOut, FiMapPin, FiBarChart2, FiBell, FiUser, FiHelpCircle, FiTruck, FiLayout, FiLayers, FiSun, FiMoon } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

/**
 * App-wide layout with persistent Sidebar + Top Header
 * Wraps all pages to ensure consistent chrome and spacing.
 */
const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: <FiLayout /> },
  { to: '/vehicles', label: 'Vehicles Management', icon: <FiTruck /> },
  { to: '/ads', label: 'Ads Management', icon: <FiLayers /> },
  { to: '/scheduling', label: 'Scheduling', icon: <FiMapPin /> },
  { to: '/analytics', label: 'Analytics', icon: <FiBarChart2 /> },
  { to: '/alerts', label: 'Alerts Management', icon: <FiBell /> },
  { to: '/my-profile', label: 'My Profile', icon: <FiUser /> },
  { to: '/admin', label: 'Admin Management', icon: <FiUser /> },
]

const Layout = ({ children }) => {
  // Initialize sidebar state: open on desktop (>=768px), closed on mobile
  const [open, setOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768
    }
    return true // Default to open for SSR
  })
  
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, currentUser } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  // Close sidebar when clicking outside on mobile
  const handleSidebarClose = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setOpen(false)
    }
  }

  // Handle responsive sidebar on mount and resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setOpen(true) // Open on desktop
      } else {
        setOpen(false) // Closed on mobile by default
      }
    }

    // Set initial state on mount
    handleResize()

    // Listen for resize events
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className='min-h-screen font-inter bg-[var(--app-bg)] transition-colors duration-300'>
      {/* Top App Bar */}
      <header className='relative h-16 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white flex items-center px-4 md:px-6 shadow-2xl border-b border-white/10 backdrop-blur-sm'>
        {/* Animated background shimmer */}
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50 animate-pulse-slow'></div>
        
        {/* Left Section */}
        <div className='flex items-center gap-4 relative z-10'>
          <button 
            aria-label='Toggle menu' 
            onClick={() => setOpen(!open)} 
            className='group relative p-2.5 md:p-2.5 rounded-xl hover:bg-white/15 transition-all duration-500 transform hover:scale-110 active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center'
          >
            <div className='absolute inset-0 bg-gradient-to-r from-amber-400/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
            <FiMenu className='relative w-6 h-6 transition-all duration-500 group-hover:rotate-90 group-hover:text-amber-300' />
          </button>
          
          <div className='flex items-center gap-3'>
            <div className='hidden md:block w-1 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full shadow-lg shadow-amber-400/50'></div>
            <div className='relative'>
              <div className='text-lg sm:text-xl md:text-2xl font-bold tracking-wider bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent transition-all duration-500 hover:scale-105 cursor-default'>
                AdMotion
              </div>
              <div className='absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500'></div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className='ml-auto flex items-center gap-2 sm:gap-3 relative z-10'>
          {/* Theme Toggle */}
          <button
            aria-label='Toggle theme'
            onClick={toggleTheme}
            className='group relative inline-flex items-center gap-1.5 sm:gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-500 transform hover:scale-105 active:scale-95 border border-white/20 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-400/20 touch-manipulation min-w-[44px] min-h-[44px] justify-center'
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <div className='absolute inset-0 bg-gradient-to-r from-amber-400/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
            <span className='relative transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12'>
              {theme === 'dark' ? (
                <FiSun className='w-5 h-5 text-amber-300 group-hover:drop-shadow-lg' style={{ filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.5))' }} />
              ) : (
                <FiMoon className='w-5 h-5 group-hover:text-amber-200 group-hover:drop-shadow-lg' />
              )}
            </span>
            <span className='hidden sm:inline text-sm font-semibold transition-all duration-500 group-hover:font-bold group-hover:text-amber-200'>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>

          {/* User Profile */}
          <Link 
            to='/my-profile'
            className='group relative inline-flex items-center gap-1.5 sm:gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-500 transform hover:scale-105 active:scale-95 border border-white/20 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-400/20 touch-manipulation min-w-[44px] min-h-[44px] justify-center'
          >
            <div className='absolute inset-0 bg-gradient-to-r from-blue-400/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
            <div className='relative'>
              {currentUser?.image ? (
                <img 
                  src={currentUser.image} 
                  alt={currentUser?.displayName || 'User'} 
                  className='w-8 h-8 rounded-full object-cover border-2 border-white/40 transition-all duration-500 group-hover:border-amber-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-amber-300/50'
                />
              ) : (
                <div className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-white/40 transition-all duration-500 group-hover:border-amber-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-amber-300/50'>
                  <FiUser className='w-4 h-4 text-white' />
                </div>
              )}
              <div className='absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-brand-900 shadow-lg animate-pulse'></div>
            </div>
            <span className='hidden sm:inline text-sm font-semibold transition-all duration-500 group-hover:font-bold group-hover:text-blue-200'>
              {currentUser?.displayName || currentUser?.username || 'Admin'}
            </span>
          </Link>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className='group relative inline-flex items-center gap-1.5 sm:gap-2.5 bg-white/10 hover:bg-red-500/20 backdrop-blur-sm px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-500 transform hover:scale-105 active:scale-95 border border-white/20 hover:border-red-400/40 hover:shadow-lg hover:shadow-red-400/20 touch-manipulation min-w-[44px] min-h-[44px] justify-center'
          >
            <div className='absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
            <FiLogOut className='relative w-5 h-5 transition-all duration-500 group-hover:scale-110 group-hover:text-red-300 group-hover:rotate-12' style={{ filter: 'drop-shadow(0 0 2px rgba(239, 68, 68, 0.3))' }} />
            <span className='hidden sm:inline text-sm font-semibold transition-all duration-500 group-hover:font-bold group-hover:text-red-300'>
              Log out
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {open && (
        <div 
          className='fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300'
          onClick={handleSidebarClose}
        />
      )}

      {/* Body with Sidebar + Content */}
      <div className='flex relative'>
        {/* Sidebar */}
        <aside className={`sidebar fixed md:static z-50 transition-all duration-300 bg-gradient-to-b from-brand-900 via-brand-800 to-brand-900 text-white min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-3.5rem)] shadow-2xl border-r border-white/5 ${
          open 
            ? 'w-64 translate-x-0' 
            : '-translate-x-full md:translate-x-0 w-64'
        }`}>
          <nav className='pt-6 pb-4'>
            {navItems.map((item) => {
              const active = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleSidebarClose}
                  className={`group flex items-center gap-4 px-4 md:px-5 py-3 md:py-4 mb-1 mx-2 md:mx-3 rounded-xl relative overflow-hidden transition-all duration-500 ease-out touch-manipulation ${
                    active 
                      ? 'bg-gradient-to-r from-amber-500/20 via-yellow-400/15 to-transparent text-amber-300 shadow-lg shadow-amber-500/20 border border-amber-400/30' 
                      : 'text-white/80 hover:text-white hover:bg-white/10 active:bg-white/15'
                  }`}
                >
                  {/* Animated shimmer effect on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    active ? 'opacity-100 animate-shimmer' : ''
                  }`}></div>
                  
                  {/* Icon with enhanced styling */}
                  <span className={`relative z-10 transition-all duration-500 flex-shrink-0 ${
                    active 
                      ? 'text-2xl text-amber-300 drop-shadow-lg' 
                      : 'text-xl group-hover:text-2xl group-hover:text-amber-200'
                  }`} style={{
                    filter: active ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' : 'none'
                  }}>
                    {item.icon}
                  </span>
                  
                  {/* Label with enhanced typography */}
                  <span className={`relative z-10 whitespace-nowrap transition-all duration-500 ${
                    open ? 'block' : 'hidden'
                  } ${
                    active 
                      ? 'text-base font-semibold tracking-wide' 
                      : 'text-sm font-medium group-hover:text-base group-hover:font-semibold'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Active indicator bar with glow */}
                  {active && (
                    <>
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-amber-400 to-amber-600 rounded-r-full shadow-lg shadow-amber-400/60"></div>
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full shadow-md shadow-amber-400/50 animate-pulse"></div>
                    </>
                  )}
                  
                  {/* Hover glow effect */}
                  {!active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                  )}
                </Link>
              )
            })}
          </nav>
          
          {/* Supervisor Section - Bottom of Sidebar */}
          <div className={`absolute bottom-0 left-0 right-0 px-3 md:px-4 py-4 md:py-6 border-t border-white/10 bg-gradient-to-t from-brand-900/90 to-transparent transition-all duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className='flex flex-col items-center gap-1.5 md:gap-2'>
              <div className='w-full h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent mb-1.5 md:mb-2'></div>
              <div className='text-center'>
                <p className='text-[10px] md:text-xs font-light text-white/60 tracking-wider uppercase mb-0.5 md:mb-1'>
                  Supervised By
                </p>
                <p className='text-xs md:text-sm font-semibold text-amber-300 tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent'>
                  SIR ZOHAIB AHMED
                </p>
              </div>
              <div className='w-10 md:w-12 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent mt-0.5 md:mt-1'></div>
            </div>
          </div>
        </aside>

        {/* Content area */}
        <main className='flex-1 w-full md:w-auto p-3 sm:p-4 md:p-6 transition-all duration-300'>
          {/* Card-like dashboard container to match screenshot */}
          <div className='bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-lg md:rounded-xl shadow-lg border border-slate-200 overflow-hidden transition-colors duration-300'>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
