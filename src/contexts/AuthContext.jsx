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
      // First check if it's the main super admin
      if (username === 'muneeb' && password === 'muneeb') {
        const mockUser = {
          uid: 'demo-user-123',
          email: 'muneeb@example.com',
          displayName: 'Muneeb',
          username: 'muneeb',
          role: 'Super Admin'
        }
        setCurrentUser(mockUser)
        localStorage.setItem('currentUser', JSON.stringify(mockUser))
        await logUserLogin(mockUser.displayName)
        return Promise.resolve()
      }

      // Check Firebase admins collection for other admins
      const adminsRef = collection(db, 'admins')
      const q = query(adminsRef, where('email', '==', username))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0]
        const adminData = adminDoc.data()

        // Check password
        if (adminData.password === password) {
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
          await logUserLogin(user.displayName)
          return Promise.resolve()
        }
      }

      // If no match found, throw error
      throw new Error('Invalid username or password')
    } catch (error) {
      throw new Error('Login failed: ' + error.message)
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
