import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/layouts/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { SkeletonList } from './components/ui/SkeletonLoader'

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Ads = lazy(() => import('./pages/Ads'))
const Vehicles = lazy(() => import('./pages/Vehicles'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Scheduling = lazy(() => import('./pages/Scheduling'))
const Alerts = lazy(() => import('./pages/Alerts'))
const MyProfile = lazy(() => import('./pages/MyProfile'))
const Admin = lazy(() => import('./pages/Admin'))

// Protected Route Component
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to="/login" replace />
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

// Main App Routes
function AppRoutes() {
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
            <Route path='/login' element={<Navigate to='/dashboard' replace />} />
            <Route path='*' element={<div className='p-8'>404 Not Found</div>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </Layout>
  )
}

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
