import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC-ASaXxPtdhOEnFMfaNYdepP7-PJm2BrI",
  authDomain: "admotion-a6654.firebaseapp.com",
  projectId: "admotion-a6654",
  storageBucket: "admotion-a6654.appspot.com",
  messagingSenderId: "829049079348",
  appId: "1:829049079348:web:7d03562bb2b9e5121eec61",
  measurementId: "G-8R544G8V34",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore (you need this for Ads page)
const db = getFirestore(app);

// Firebase Auth
const auth = getAuth(app);

// Firebase Storage (for video/large file uploads)
const storage = getStorage(app);

export { db, auth, storage };
