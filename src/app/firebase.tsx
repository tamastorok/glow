import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInWithCustomToken } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Debug: Log environment variables (without sensitive values)
console.log('Environment variables check:', {
  hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // safe to log
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // safe to log
});

// Initialize Firebase
console.log('Initializing Firebase client with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
});

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Function to sign in with Farcaster
async function signInWithFarcaster(fid: string, username: string) {
  try {
    console.log('Attempting to sign in with Farcaster:', { fid, username });
    // Get the custom token from your backend
    const response = await fetch('/api/auth/firebase-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fid, username }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get Firebase token');
    }
    
    const { token } = await response.json();
    
    if (!token) {
      throw new Error('No token received from server');
    }
    
    console.log('Got Firebase token, signing in...');
    // Sign in with the custom token
    const userCredential = await signInWithCustomToken(auth, token);
    console.log('Successfully signed in with Firebase');
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in with Farcaster:', error);
    throw error;
  }
}

export { app, db, auth, signInWithFarcaster };