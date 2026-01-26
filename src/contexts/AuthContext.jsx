import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { auth, db } from '../firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { logUserLogin, logUserLogout } from '../services/activityLogger'
import { comparePassword } from '../utils/password'
import { loginRateLimiter } from '../utils/rateLimiter'
import { ERROR_MESSAGES } from '../constants'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Sign up function (for creating initial user)
  async function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  // Login function
  async function login(username, password) {
    try {
      // Check rate limiting
      if (!loginRateLimiter.isAllowed(username)) {
        const remainingMs = loginRateLimiter.getRemainingTime(username)
        const remainingMins = Math.ceil(remainingMs / 60000)
        throw new Error(`Too many login attempts. Please try again in ${remainingMins} minute${remainingMins > 1 ? 's' : ''}.`)
      }

      // Check Firebase admins collection
      const adminsRef = collection(db, 'admins')
      const q = query(adminsRef, where('email', '==', username))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0]
        const adminData = adminDoc.data()

        // Check password using bcrypt
        // Support both hashed (new) and plain text (legacy) passwords for migration
        let passwordMatch = false
        
        if (adminData.password) {
          // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
          if (adminData.password.startsWith('$2')) {
            // Hashed password - use bcrypt compare
            passwordMatch = await comparePassword(password, adminData.password)
          } else {
            // Legacy plain text password - compare directly (for migration period)
            // TODO: Remove this after all passwords are migrated to hashed
            passwordMatch = adminData.password === password
            console.warn('⚠️ Using plain text password comparison. Please migrate to hashed passwords.')
          }
        }

        if (passwordMatch) {
          const user = {
            uid: adminDoc.id,
            email: adminData.email,
            displayName: adminData.name,
            username: adminData.email,
            role: adminData.role,
            phoneNo: adminData.phoneNo,
            location: adminData.location,
            image: adminData.image
          }
          setCurrentUser(user)
          localStorage.setItem('currentUser', JSON.stringify(user))
          
          // Reset rate limiter on successful login
          loginRateLimiter.reset(username)
          
          await logUserLogin(user.displayName)
          return Promise.resolve()
        }
      }

      // If no match found, throw error
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS)
    } catch (error) {
      // Don't reset rate limiter on failure - it will block after max attempts
      throw new Error(error.message || 'Login failed')
    }
  }

  // Logout function
  async function logout() {
    const userName = currentUser?.displayName || currentUser?.username || 'Admin'
    // Log the logout activity before clearing user
    await logUserLogout(userName)
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
    return Promise.resolve()
  }

  useEffect(() => {
    // Check for stored user on app load
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }
    setLoading(false)

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
      }
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    login,
    logout,
    signup
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
