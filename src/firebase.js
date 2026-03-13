import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBY531KR4npLICaE09ixt8_OnRckmJJQAM",
  authDomain: "admotion-f7970.firebaseapp.com",
  projectId: "admotion-f7970",
  storageBucket: "admotion-f7970.firebasestorage.app",
  messagingSenderId: "524294117835",
  appId: "1:524294117835:web:524dc4d26e7dfc51033e4e",
  measurementId: "G-DFLN5QCP12",
};

// Initialize Firebase (HMR-safe)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firestore - Get instance
const db = getFirestore(app);

// Firebase Auth
const auth = getAuth(app);

// Firebase Storage (for video/large file uploads)
const storage = getStorage(app);

export { db, auth, storage };
