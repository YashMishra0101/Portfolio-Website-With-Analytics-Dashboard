import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

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


// Initialize Firebase only if config is valid
export let db;
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
  // Try primary API
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) throw new Error("Primary API failed");
    const data = await response.json();
    
    // Check if we got rate limited
    if (data.error) {
      console.warn("ipapi.co rate limited, trying fallback...");
      throw new Error("Rate limited");
    }
    
    return {
      ip: data.ip || "unknown",
      city: data.city || "Unknown",
      country: data.country_name || "Unknown",
      countryCode: data.country_code || "UN",
      isp: data.org || "Unknown",
    };
  } catch (e) {
    console.warn("Primary IP API failed, trying fallback 1...", e.message);
    
    // Fallback 1: ipify + ip-api.com
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      const ip = ipData.ip;
      
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      const geoData = await geoRes.json();
      
      return {
        ip: ip || "unknown",
        city: geoData.city || "Unknown",
        country: geoData.country || "Unknown",
        countryCode: geoData.countryCode || "UN",
        isp: geoData.isp || "Unknown",
      };
    } catch (e2) {
      console.warn("Fallback 1 failed, using minimal data...", e2.message);
      
      // Last resort: Just get IP
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        return {
          ip: data.ip || "unknown",
          city: "Unknown",
          country: "Unknown",
          countryCode: "UN",
          isp: "Unknown",
        };
      } catch (e3) {
        console.error("All IP APIs failed", e3);
        return {
          ip: "unknown",
          city: "Unknown",
          country: "Unknown",
          countryCode: "UN",
          isp: "Unknown",
        };
      }
    }
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

  // Deduplication: Prevent logging the same visit multiple times within 5 seconds
  // This handles React StrictMode double-calling in development
  const lastVisitKey = "last_visit_logged";
  const lastVisitTime = sessionStorage.getItem(lastVisitKey);
  const now = Date.now();
  
  if (lastVisitTime && (now - parseInt(lastVisitTime)) < 5000) {
    console.log("Analytics: Visit already logged recently, skipping duplicate");
    return;
  }
  
  // Mark this visit as logged
  sessionStorage.setItem(lastVisitKey, now.toString());

  const visitorId = getVisitorId();
  const geo = await getGeoInfo();
  const os = getOS();
  const userAgent = navigator.userAgent;
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const referrer = document.referrer || "Direct";

  // Determine device type for owner visits
  const getDeviceType = () => {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      return "Mobile";
    }
    return "Desktop";
  };

  const visitData = {
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
  };

  try {
    // Track all visits in the regular visits collection (including owner)
    await addDoc(collection(db, "visits"), {
      ...visitData,
      type: "visit",
    });
    console.log("✅ Analytics: Visit logged successfully", {
      ip: geo.ip,
      city: geo.city,
      os: os,
      device: getDeviceType()
    });
  } catch (error) {
    console.error("❌ Analytics: Failed to log visit", error);
    console.error("Visit data:", visitData);
  }
};
