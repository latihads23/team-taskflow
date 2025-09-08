import * as firebaseApp from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration, sourced from environment variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if all required environment variables are set
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Firebase configuration environment variables are not set. Database features will not work.");
}


// FIX: Implement HMR-safe initialization to prevent re-initialization errors in development.
// This checks if a Firebase app is already initialized before attempting to create a new one.
const app = firebaseApp.getApps().length && firebaseConfig.projectId ? firebaseApp.getApp() : firebaseApp.initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);