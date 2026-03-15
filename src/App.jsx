import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DriverAuthProvider, useDriverAuth } from './contexts/DriverAuthContext'
import { UndoProvider } from './contexts/UndoContext'
import { useTheme } from './contexts/ThemeContext'
import Layout from './components/layouts/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { SkeletonList } from './components/ui/SkeletonLoader'

// Global overlays (admin)
import CommandPalette from './components/CommandPalette'
import GlobalSearch from './components/GlobalSearch'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp'
import OnboardingTour from './components/OnboardingTour'
import UndoToast from './components/UndoToast'
import MessagingWidget from './components/MessagingWidget'
import OfflineIndicator from './components/OfflineIndicator'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'
import useOfflineSupport from './hooks/useOfflineSupport'

// Lazy load admin pages
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Ads = lazy(() => import('./pages/Ads'))
const Vehicles = lazy(() => import('./pages/Vehicles'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Scheduling = lazy(() => import('./pages/Scheduling'))
const Alerts = lazy(() => import('./pages/Alerts'))
const MyProfile = lazy(() => import('./pages/MyProfile'))
const Admin = lazy(() => import('./pages/Admin'))
const VehicleReports = lazy(() => import('./pages/VehicleReports'))
const ReportSettings = lazy(() => import('./pages/ReportSettings'))

// Lazy load driver pages
const DriverLogin = lazy(() => import('./pages/driver/DriverLogin'))
const DriverLayout = lazy(() => import('./components/driver/DriverLayout'))
const DriverDashboard = lazy(() => import('./pages/driver/DriverDashboard'))
const DriverEarnings = lazy(() => import('./pages/driver/DriverEarnings'))
const DriverRoute = lazy(() => import('./pages/driver/DriverRoute'))
const DriverAlerts = lazy(() => import('./pages/driver/DriverAlerts'))
const DriverProfile = lazy(() => import('./pages/driver/DriverProfile'))

// Lazy load vehicle display pages
const DisplaySetup = lazy(() => import('./pages/display/DisplaySetup'))
const DisplayPlayer = lazy(() => import('./pages/display/DisplayPlayer'))

// Protected Route Component (Admin)
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to="/login" replace />
}

// Protected Route Component (Driver)
function DriverProtectedRoute({ children }) {
  const { driver } = useDriverAuth()
  return driver ? children : <Navigate to="/driver/login" replace />
}

// Page transition wrapper
const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

// Loading fallback component
const PageLoader = () => (
  <div className="p-6">
    <SkeletonList items={5} />
  </div>
)

// Driver page loader - minimal for mobile
const DriverPageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full"
      />
      <p className="text-sm text-slate-400 dark:text-slate-500">Loading...</p>
    </div>
  </div>
)

// Global features wrapper (keyboard shortcuts, offline support, overlays)
function GlobalFeatures({ children }) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { isOffline, cachedData, flushQueue, pendingOperations } = useOfflineSupport()

  // Register keyboard shortcuts
  useKeyboardShortcuts(navigate, toggleTheme)

  return (
    <>
      <OfflineIndicator
        isOffline={isOffline}
        lastCached={cachedData?.lastCached}
        pendingOps={pendingOperations}
        onSync={flushQueue}
      />
      {children}
      {/* Global overlays */}
      <CommandPalette />
      <GlobalSearch />
      <KeyboardShortcutsHelp />
      <OnboardingTour />
      <UndoToast />
      <MessagingWidget />
    </>
  )
}

// Driver App Routes
function DriverAppRoutes() {
  const { driver } = useDriverAuth()

  return (
    <Suspense fallback={<DriverPageLoader />}>
      <Routes>
        {/* Vehicle Display routes (kiosk mode - no auth wrapper) */}
        <Route path="/display/setup" element={<DisplaySetup />} />
        <Route path="/display/play" element={<DisplayPlayer />} />
        <Route path="/display" element={<Navigate to="/display/setup" replace />} />

        {/* Driver routes */}
        <Route path="/driver/login" element={
          driver ? <Navigate to="/driver" replace /> : <DriverLogin />
        } />
        <Route path="/driver" element={
          <DriverProtectedRoute>
            <DriverLayout />
          </DriverProtectedRoute>
        }>
          <Route index element={<DriverDashboard />} />
          <Route path="earnings" element={<DriverEarnings />} />
          <Route path="route" element={<DriverRoute />} />
          <Route path="alerts" element={<DriverAlerts />} />
          <Route path="profile" element={<DriverProfile />} />
        </Route>
        {/* Pass through non-driver routes */}
        <Route path="*" element={<AdminAppRoutes />} />
      </Routes>
    </Suspense>
  )
}

// Admin App Routes
function AdminAppRoutes() {
  const { currentUser } = useAuth()
  const location = useLocation()

  if (!currentUser) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <GlobalFeatures>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path='/' element={<Navigate to='/dashboard' replace />} />
              <Route path='/dashboard' element={
                <ProtectedRoute>
                  <PageTransition>
                    <Dashboard />
                  </PageTransition>
                </ProtectedRoute>
              } />
              <Route path='/vehicles' element={
                <ProtectedRoute>
                  <PageTransition>
                    <Vehicles />
                  </PageTransition>
                </ProtectedRoute>
              } />
              <Route path='/ads' element={
                <ProtectedRoute>
                  <PageTransition>
                    <Ads />
                  </PageTransition>
                </ProtectedRoute>
              } />
              <Route path='/analytics' element={
                <ProtectedRoute>
                  <PageTransition>
                    <Analytics />
                  </PageTransition>
                </ProtectedRoute>
              } />
              <Route path='/scheduling' element={
                <ProtectedRoute>
                  <PageTransition>
                    <Scheduling />
                  </PageTransition>
                </ProtectedRoute>
              } />
              <Route path='/alerts' element={
                <ProtectedRoute>
                  <PageTransition>
                    <Alerts />
                  </PageTransition>
                </ProtectedRoute>
              } />
              <Route path='/my-profile' element={
                <ProtectedRoute>
                  <PageTransition>
                    <MyProfile />
                  </PageTransition>
                </ProtectedRoute>
              } />
              <Route path='/admin' element={
                <ProtectedRoute>
                  <PageTransition>
                    <Admin />
                  </PageTransition>
                </ProtectedRoute>
              } />
              <Route path='/vehicle-reports' element={
                <ProtectedRoute>
                  <PageTransition>
                    <VehicleReports />
                  </PageTransition>
                </ProtectedRoute>
              } />
              <Route path='/report-settings' element={
                <ProtectedRoute>
                  <PageTransition>
                    <ReportSettings />
                  </PageTransition>
                </ProtectedRoute>
              } />
              <Route path='/login' element={<Navigate to='/dashboard' replace />} />
              <Route path='*' element={<div className='p-8'>404 Not Found</div>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </Layout>
    </GlobalFeatures>
  )
}

// Main App Routes - handles both driver and admin
// If this device is a registered display (saved in localStorage), auto-redirect to display player
function AppRoutes() {
  return <DriverAppRoutes />
}

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DriverAuthProvider>
          <UndoProvider>
            <AppRoutes />
          </UndoProvider>
        </DriverAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
