import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/layouts/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ads from './pages/Ads'
import Vehicles from './pages/Vehicles'
import Analytics from './pages/Analytics'
import Scheduling from './pages/Scheduling'
import Alerts from './pages/Alerts'
import MyProfile from './pages/MyProfile'
import Admin from './pages/Admin'

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

// Main App Routes
function AppRoutes() {
  const { currentUser } = useAuth()
  const location = useLocation()

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
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
    </Layout>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
