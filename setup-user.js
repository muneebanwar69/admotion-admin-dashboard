// Setup script to create initial user in Firebase
// Run this once to set up the initial user

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

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
const auth = getAuth(app);

async function createInitialUser() {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'muneeb@example.com', 
      'muneeb123'
    );
    
    console.log('User created successfully:', userCredential.user);
    console.log('Email: muneeb@example.com');
    console.log('Password: muneeb123');
    console.log('Username: muneeb');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('User already exists!');
    } else {
      console.error('Error creating user:', error);
    }
  }
}

// Run the setup
createInitialUser();

