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

// Helper to get IP and Geo Info with multiple fallbacks
const getGeoInfo = async () => {
  // Try primary API: ipapi.co
  try {
    const response = await fetch("https://ipapi.co/json/", {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error("Primary API failed");
    const data = await response.json();

    // Check if we got rate limited or error
    if (data.error || data.reason) {
      console.warn("ipapi.co error:", data.reason || data.error);
      throw new Error("Rate limited or error");
    }

    if (data.city && data.country_name) {
      return {
        ip: data.ip || "unknown",
        city: data.city,
        country: data.country_name,
        countryCode: data.country_code || "UN",
        isp: data.org || "Unknown",
      };
    }
    throw new Error("Incomplete data from ipapi.co");
  } catch (e) {
    console.warn("Primary IP API failed:", e.message);

    // Fallback 1: freeipapi.com (HTTPS, no key needed)
    try {
      const response = await fetch("https://freeipapi.com/api/json/");
      if (!response.ok) throw new Error("freeipapi failed");
      const data = await response.json();

      if (data.cityName && data.countryName) {
        return {
          ip: data.ipAddress || "unknown",
          city: data.cityName,
          country: data.countryName,
          countryCode: data.countryCode || "UN",
          isp: data.isp || "Unknown",
        };
      }
      throw new Error("Incomplete data from freeipapi");
    } catch (e2) {
      console.warn("Fallback 1 (freeipapi) failed:", e2.message);

      // Fallback 2: ipwho.is (HTTPS, reliable)
      try {
        const response = await fetch("https://ipwho.is/");
        if (!response.ok) throw new Error("ipwho.is failed");
        const data = await response.json();

        if (data.success !== false && data.city && data.country) {
          return {
            ip: data.ip || "unknown",
            city: data.city,
            country: data.country,
            countryCode: data.country_code || "UN",
            isp: data.connection?.isp || "Unknown",
          };
        }
        throw new Error("Incomplete data from ipwho.is");
      } catch (e3) {
        console.warn("Fallback 2 (ipwho.is) failed:", e3.message);

        // Fallback 3: ip-api.com via HTTPS with fields (limited but works)
        try {
          const ipRes = await fetch("https://api.ipify.org?format=json");
          const ipData = await ipRes.json();
          const ip = ipData.ip;

          // Use ip-api.com with HTTPS via cors-anywhere or direct with fields
          const geoRes = await fetch(`https://ipwho.is/${ip}`);
          const geoData = await geoRes.json();

          return {
            ip: ip || "unknown",
            city: geoData.city || "Unknown",
            country: geoData.country || "Unknown",
            countryCode: geoData.country_code || "UN",
            isp: geoData.connection?.isp || "Unknown",
          };
        } catch (e4) {
          console.warn("Fallback 3 failed:", e4.message);

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
          } catch (e5) {
            console.error("All IP APIs failed", e5);
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
