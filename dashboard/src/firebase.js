import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Config from .env file
// Config - API Key/Secrets from .env, Domains Hardcoded
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "monitoring-system-c02cf.firebaseapp.com",
  projectId: "monitoring-system-c02cf",
  storageBucket: "monitoring-system-c02cf.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error("Dashboard Firebase Init Error. Check .env", error);
}

export { db };
