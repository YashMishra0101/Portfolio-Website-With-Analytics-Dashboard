import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// Config from .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase only if config is valid
let db;
try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "your_api_key_here") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } else {
    console.warn("Firebase Analytics: Missing .env config");
  }
} catch (error) {
  console.error("Firebase init error", error);
}

// Helper to get or create a persistent Visitor ID
const getVisitorId = () => {
  let vid = localStorage.getItem("p_vid");
  if (!vid) {
    vid = "v_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
    localStorage.setItem("p_vid", vid);
  }
  return vid;
};

// Helper to get IP and Geo Info
const getGeoInfo = async () => {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    return {
      ip: data.ip || "unknown",
      city: data.city || "Unknown",
      country: data.country_name || "Unknown",
      countryCode: data.country_code || "UN",
      isp: data.org || "Unknown",
    };
  } catch (e) {
    return {
      ip: "unknown",
      city: "Unknown",
      country: "Unknown",
      countryCode: "UN",
      isp: "Unknown",
    };
  }
};

const getOS = () => {
  const userAgent = window.navigator.userAgent;
  let platform = "Unknown";
  if (userAgent.indexOf("Win") !== -1) platform = "Windows";
  if (userAgent.indexOf("Mac") !== -1) platform = "MacOS";
  if (userAgent.indexOf("Linux") !== -1) platform = "Linux";
  if (userAgent.indexOf("Android") !== -1) platform = "Android";
  if (userAgent.indexOf("like Mac") !== -1) platform = "iOS";
  return platform;
};

export const logVisit = async () => {
  if (!db) return;

  const visitorId = getVisitorId();
  const geo = await getGeoInfo();
  const os = getOS();
  const userAgent = navigator.userAgent;
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const referrer = document.referrer || "Direct";

  try {
    // 1. Log the Visit Start
    const docRef = await addDoc(collection(db, "visits"), {
      visitorId,
      timestamp: serverTimestamp(),
      ip: geo.ip,
      city: geo.city,
      country: geo.country,
      countryCode: geo.countryCode,
      isp: geo.isp,
      os,
      userAgent,
      screenRes,
      referrer,
      page: window.location.pathname,
      sessionStart: Date.now(),
      type: "visit", // Distinguish from 'ping' or 'exit' if needed later
    });

    // 2. Setup Session heartbeat (Optional but good for "Live" status)
    // For now, we will just log the initial hit rich data.

    // 3. Store docId to update session duration on exit?
    // Complexity warning: Unload events are unreliable.
    // Better strategy: Simple "Ping" every 30s or just rely on start time for now.
  } catch (error) {
    // Silent fail
  }
};
