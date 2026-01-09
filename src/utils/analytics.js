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

// IP addresses to exclude from tracking (owner's IPs)
const EXCLUDED_IPS = [
  "152.56.13.0",
  "2409:40c2:400c:2d74:f987:a6b6:ae9:49f9"
];

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

// Check if IP should be excluded from tracking
const isExcludedIP = (ip) => {
  if (!ip || ip === "unknown") return false;
  
  // Check for exact match or prefix match
  // For IPv4: match first 3 octets (e.g., 152.56.13.x)
  // For IPv6: match first 4 segments
  return EXCLUDED_IPS.some(excludedIP => {
    if (ip === excludedIP) return true;
    
    // IPv4 prefix match (match first 3 octets)
    if (!excludedIP.includes(':') && !ip.includes(':')) {
      const excludedPrefix = excludedIP.split('.').slice(0, 3).join('.');
      const ipPrefix = ip.split('.').slice(0, 3).join('.');
      return excludedPrefix === ipPrefix;
    }
    
    // IPv6 prefix match (match first 4 segments)
    if (excludedIP.includes(':') && ip.includes(':')) {
      const excludedPrefix = excludedIP.split(':').slice(0, 4).join(':');
      return ip.startsWith(excludedPrefix);
    }
    
    return false;
  });
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
    // Check if this is owner's IP - log to separate collection
    if (isExcludedIP(geo.ip)) {
      // Determine which device based on IP
      const isMobileIP = geo.ip === "152.56.13.0";
      const isLaptopIPv6 = geo.ip.includes(":");
      
      await addDoc(collection(db, "owner_activity"), {
        ...visitData,
        ip: geo.ip,
        type: "owner_visit",
        device: getDeviceType(),
        note: isMobileIP ? "Mobile Phone" : (isLaptopIPv6 ? "Laptop (IPv6)" : "Desktop"),
      });
      console.log("Analytics: Owner activity logged to separate collection");
      return;
    }

    // Regular visitor - log to visits collection
    await addDoc(collection(db, "visits"), {
      ...visitData,
      type: "visit",
    });
  } catch (error) {
    // Silent fail
  }
};
