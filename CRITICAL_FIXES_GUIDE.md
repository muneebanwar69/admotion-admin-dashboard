# 🚨 Critical Fixes Implementation Guide

## 1. Move Firebase Config to Environment Variables

### Step 1: Create `.env` file (DO NOT COMMIT)
```bash
# .env
VITE_FIREBASE_API_KEY=AIzaSyC-ASaXxPtdhOEnFMfaNYdepP7-PJm2BrI
VITE_FIREBASE_AUTH_DOMAIN=admotion-a6654.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=admotion-a6654
VITE_FIREBASE_STORAGE_BUCKET=admotion-a6654.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=829049079348
VITE_FIREBASE_APP_ID=1:829049079348:web:7d03562bb2b9e5121eec61
VITE_FIREBASE_MEASUREMENT_ID=G-8R544G8V34
```

### Step 2: Update `src/firebase.js`
```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
```

### Step 3: Update `.gitignore`
```
.env
.env.local
.env.*.local
```

### Step 4: Create `.env.example` (template for others)
```bash
# .env.example
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

## 2. Implement Password Hashing

### Step 1: Install bcrypt
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### Step 2: Create password utility
```javascript
// src/utils/password.js
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}
```

### Step 3: Update Admin.jsx
```javascript
import { hashPassword, comparePassword } from '../utils/password'

// When creating/updating admin
const handleSave = async () => {
  // ... validation ...
  
  const saveData = {
    ...formData,
    password: await hashPassword(formData.password), // Hash before saving
    // ... rest
  }
  
  // Save to Firestore
  if (editingAdmin) {
    await updateDoc(doc(db, 'admins', editingAdmin), saveData)
  } else {
    await addDoc(collection(db, 'admins'), saveData)
  }
}
```

### Step 4: Update AuthContext.jsx
```javascript
import { comparePassword } from '../utils/password'

async function login(username, password) {
  // Remove hardcoded credentials!
  
  // Check Firebase admins collection
  const adminsRef = collection(db, 'admins')
  const q = query(adminsRef, where('email', '==', username))
  const querySnapshot = await getDocs(q)

  if (!querySnapshot.empty) {
    const adminDoc = querySnapshot.docs[0]
    const adminData = adminDoc.data()

    // Compare hashed password
    const passwordMatch = await comparePassword(password, adminData.password)
    
    if (passwordMatch) {
      const user = {
        uid: adminDoc.id,
        email: adminData.email,
        displayName: adminData.name,
        username: adminData.email,
        role: adminData.role,
        // ... rest
      }
      setCurrentUser(user)
      localStorage.setItem('currentUser', JSON.stringify(user))
      await logUserLogin(user.displayName)
      return Promise.resolve()
    }
  }

  throw new Error('Invalid username or password')
}
```

---

## 3. Remove Hardcoded Credentials

### Update AuthContext.jsx
```javascript
async function login(username, password) {
  try {
    // REMOVE THIS ENTIRE BLOCK:
    // if (username === 'muneeb' && password === 'muneeb') { ... }
    
    // Instead, create a proper super admin in Firestore
    // Or use Firebase Auth with custom claims
    
    // Check Firebase admins collection
    const adminsRef = collection(db, 'admins')
    const q = query(adminsRef, where('email', '==', username))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // ... rest of login logic
    }

    throw new Error('Invalid username or password')
  } catch (error) {
    throw new Error('Login failed: ' + error.message)
  }
}
```

---

## 4. Add Input Sanitization

### Step 1: Install DOMPurify
```bash
npm install dompurify
```

### Step 2: Create sanitization utility
```javascript
// src/utils/sanitize.js
import DOMPurify from 'dompurify'

export const sanitizeString = (input) => {
  if (typeof input !== 'string') return input
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

export const sanitizeObject = (obj) => {
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}
```

### Step 3: Use in forms
```javascript
import { sanitizeObject } from '../utils/sanitize'

const handleSave = async () => {
  // Sanitize all inputs before saving
  const sanitizedData = sanitizeObject(formData)
  
  await addDoc(collection(db, 'ads'), sanitizedData)
}
```

---

## 5. Implement Firestore Security Rules

### Go to Firebase Console → Firestore Database → Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is Super Admin
    function isSuperAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'Super Admin';
    }
    
    // Admins collection
    match /admins/{adminId} {
      allow read: if isAuthenticated();
      allow create: if isSuperAdmin();
      allow update: if isSuperAdmin() || request.auth.uid == adminId;
      allow delete: if isSuperAdmin();
    }
    
    // Ads collection
    match /ads/{adId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // Vehicles collection
    match /vehicles/{vehicleId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // Activity logs - read only for admins, write only by system
    match /activityLogs/{logId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only server-side writes
    }
  }
}
```

---

## 6. Add Rate Limiting for Login

### Step 1: Create rate limiter utility
```javascript
// src/utils/rateLimiter.js
class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
    this.attempts = new Map()
  }

  isAllowed(identifier) {
    const now = Date.now()
    const userAttempts = this.attempts.get(identifier) || { count: 0, resetTime: now + this.windowMs }

    if (now > userAttempts.resetTime) {
      // Reset window
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs })
      return true
    }

    if (userAttempts.count >= this.maxAttempts) {
      return false
    }

    userAttempts.count++
    this.attempts.set(identifier, userAttempts)
    return true
  }

  getRemainingTime(identifier) {
    const userAttempts = this.attempts.get(identifier)
    if (!userAttempts) return 0
    return Math.max(0, userAttempts.resetTime - Date.now())
  }
}

export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000) // 5 attempts per 15 minutes
```

### Step 2: Use in AuthContext
```javascript
import { loginRateLimiter } from '../utils/rateLimiter'

async function login(username, password) {
  // Check rate limit
  if (!loginRateLimiter.isAllowed(username)) {
    const remainingMs = loginRateLimiter.getRemainingTime(username)
    const remainingMins = Math.ceil(remainingMs / 60000)
    throw new Error(`Too many login attempts. Please try again in ${remainingMins} minutes.`)
  }

  try {
    // ... login logic ...
    // Reset on success
    loginRateLimiter.attempts.delete(username)
  } catch (error) {
    // Rate limit already checked, just throw error
    throw error
  }
}
```

---

## 7. Improve File Upload Validation

### Update UploadContext.jsx
```javascript
// Add file signature validation
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
  // Add more as needed
}

const validateFileSignature = async (file, expectedType) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const bytes = new Uint8Array(e.target.result)
      const signature = FILE_SIGNATURES[expectedType]
      
      if (!signature) {
        resolve(true) // Unknown type, allow
        return
      }

      const matches = signature.every((byte, index) => bytes[index] === byte)
      resolve(matches)
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file.slice(0, 20)) // Read first 20 bytes
  })
}

// In startUpload function:
if (file) {
  // Validate file type by signature, not just MIME type
  const isValidType = await validateFileSignature(
    file, 
    file.type.startsWith('video') ? 'video/mp4' : 'image/jpeg'
  )
  
  if (!isValidType) {
    throw new Error('Invalid file type. File signature does not match.')
  }
  
  // ... rest of upload logic
}
```

---

## 8. Add Error Boundary

### Create ErrorBoundary.jsx
```javascript
// src/components/ErrorBoundary.jsx
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Send to error tracking service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h1>
            <p className="text-slate-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
```

### Use in App.jsx
```javascript
import ErrorBoundary from './components/ErrorBoundary'

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  )
}
```

---

## Priority Checklist

- [ ] Move Firebase config to .env
- [ ] Implement password hashing
- [ ] Remove hardcoded credentials
- [ ] Add input sanitization
- [ ] Implement Firestore security rules
- [ ] Add rate limiting
- [ ] Improve file validation
- [ ] Add error boundary

**Estimated Time:** 4-6 hours for all critical fixes
