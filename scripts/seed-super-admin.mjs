import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBY531KR4npLICaE09ixt8_OnRckmJJQAM',
  authDomain: 'admotion-f7970.firebaseapp.com',
  projectId: 'admotion-f7970',
  storageBucket: 'admotion-f7970.firebasestorage.app',
  messagingSenderId: '524294117835',
  appId: '1:524294117835:web:524dc4d26e7dfc51033e4e',
  measurementId: 'G-DFLN5QCP12',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const seed = async () => {
  const adminsRef = collection(db, 'admins')

  const existing = await getDocs(query(adminsRef, where('username', '==', 'muneeb')))
  if (!existing.empty) {
    console.log('ℹ️ Super Admin already exists for username: muneeb')
    process.exit(0)
  }

  const docRef = await addDoc(adminsRef, {
    name: 'muneeb',
    username: 'muneeb',
    email: 'muneeb@admin.com',
    password: 'muneeb',
    role: 'Super Admin',
    createdAt: new Date().toISOString(),
  })

  console.log('✅ Super Admin created successfully')
  console.log(`Doc ID: ${docRef.id}`)
  console.log('Login credentials: username = muneeb, password = muneeb')
}

seed().catch((error) => {
  console.error('❌ Failed to seed super admin')
  console.error(error.code || error.message)
  process.exit(1)
})
