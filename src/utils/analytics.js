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

// Comprehensive Traffic Source Detection
// Priority: Localhost > UTM params > Known platforms > Parsed referrer > Direct
const getTrafficSource = () => {
  const url = new URL(window.location.href);
  const rawReferrer = document.referrer;

  // 0. Explicit Localhost Check
  const hostname = url.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return {
      source: "Localhost",
      medium: "development",
      campaign: "none",
      raw: rawReferrer || "Direct",
      method: "localhost"
    };
  }

  // 1. Check UTM parameters first (most reliable - you control these in your shared links)
  const utmSource = url.searchParams.get("utm_source");
  const utmMedium = url.searchParams.get("utm_medium");
  const utmCampaign = url.searchParams.get("utm_campaign");

  if (utmSource) {
    // UTM source found - this is the most accurate
    return {
      source: utmSource.toLowerCase(),
      medium: utmMedium || "referral",
      campaign: utmCampaign || "none",
      raw: rawReferrer || "Direct",
      method: "utm"
    };
  }

  // 2. Check referrer against known platforms
  if (rawReferrer) {
    try {
      const referrerUrl = new URL(rawReferrer);
      const referrerHost = referrerUrl.hostname.toLowerCase();

      // Known social platforms and their variations
      const knownSources = {
        // LinkedIn
        "linkedin.com": { source: "LinkedIn", medium: "social" },
        "www.linkedin.com": { source: "LinkedIn", medium: "social" },
        "lnkd.in": { source: "LinkedIn", medium: "social" },

        // Twitter/X
        "twitter.com": { source: "Twitter", medium: "social" },
        "www.twitter.com": { source: "Twitter", medium: "social" },
        "x.com": { source: "Twitter", medium: "social" },
        "www.x.com": { source: "Twitter", medium: "social" },
        "t.co": { source: "Twitter", medium: "social" },

        // GitHub
        "github.com": { source: "GitHub", medium: "social" },
        "www.github.com": { source: "GitHub", medium: "social" },
        "gist.github.com": { source: "GitHub Gist", medium: "social" },

        // Facebook
        "facebook.com": { source: "Facebook", medium: "social" },
        "www.facebook.com": { source: "Facebook", medium: "social" },
        "m.facebook.com": { source: "Facebook", medium: "social" },
        "l.facebook.com": { source: "Facebook", medium: "social" },
        "fb.me": { source: "Facebook", medium: "social" },

        // Instagram
        "instagram.com": { source: "Instagram", medium: "social" },
        "www.instagram.com": { source: "Instagram", medium: "social" },
        "l.instagram.com": { source: "Instagram", medium: "social" },

        // Reddit
        "reddit.com": { source: "Reddit", medium: "social" },
        "www.reddit.com": { source: "Reddit", medium: "social" },
        "old.reddit.com": { source: "Reddit", medium: "social" },

        // WhatsApp
        "web.whatsapp.com": { source: "WhatsApp", medium: "social" },
        "whatsapp.com": { source: "WhatsApp", medium: "social" },

        // Telegram
        "t.me": { source: "Telegram", medium: "social" },
        "telegram.org": { source: "Telegram", medium: "social" },

        // Discord
        "discord.com": { source: "Discord", medium: "social" },
        "discordapp.com": { source: "Discord", medium: "social" },

        // YouTube
        "youtube.com": { source: "YouTube", medium: "social" },
        "www.youtube.com": { source: "YouTube", medium: "social" },
        "youtu.be": { source: "YouTube", medium: "social" },

        // Search Engines
        "google.com": { source: "Google", medium: "organic" },
        "www.google.com": { source: "Google", medium: "organic" },
        "google.co.in": { source: "Google", medium: "organic" },
        "www.google.co.in": { source: "Google", medium: "organic" },
        "bing.com": { source: "Bing", medium: "organic" },
        "www.bing.com": { source: "Bing", medium: "organic" },
        "duckduckgo.com": { source: "DuckDuckGo", medium: "organic" },
        "yahoo.com": { source: "Yahoo", medium: "organic" },
        "search.yahoo.com": { source: "Yahoo", medium: "organic" },
        "baidu.com": { source: "Baidu", medium: "organic" },

        // Dev platforms
        "stackoverflow.com": { source: "StackOverflow", medium: "referral" },
        "dev.to": { source: "Dev.to", medium: "referral" },
        "medium.com": { source: "Medium", medium: "referral" },
        "hashnode.com": { source: "Hashnode", medium: "referral" },
        "producthunt.com": { source: "ProductHunt", medium: "referral" },

        // Job platforms
        "indeed.com": { source: "Indeed", medium: "referral" },
        "glassdoor.com": { source: "Glassdoor", medium: "referral" },
        "naukri.com": { source: "Naukri", medium: "referral" },
        "wellfound.com": { source: "Wellfound", medium: "referral" },
        "angel.co": { source: "AngelList", medium: "referral" },
      };

      // Check for exact match first
      if (knownSources[referrerHost]) {
        return {
          source: knownSources[referrerHost].source,
          medium: knownSources[referrerHost].medium,
          campaign: "none",
          raw: rawReferrer,
          method: "known_platform"
        };
      }

      // Check for partial matches (handles subdomains)
      for (const [domain, info] of Object.entries(knownSources)) {
        if (referrerHost.includes(domain) || referrerHost.endsWith("." + domain)) {
          return {
            source: info.source,
            medium: info.medium,
            campaign: "none",
            raw: rawReferrer,
            method: "known_platform"
          };
        }
      }

      // Unknown referrer - extract domain name
      const domainParts = referrerHost.replace("www.", "").split(".");
      const sourceName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);

      return {
        source: sourceName,
        medium: "referral",
        campaign: "none",
        raw: rawReferrer,
        method: "parsed_referrer"
      };

    } catch (e) {
      // Invalid referrer URL - treat as the raw string
      return {
        source: rawReferrer.substring(0, 50),
        medium: "referral",
        campaign: "none",
        raw: rawReferrer,
        method: "raw_referrer"
      };
    }
  }

  // 3. Check for in-app browsers (these often don't send referrer)
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("linkedin")) {
    return { source: "LinkedIn", medium: "social", campaign: "none", raw: "Direct", method: "user_agent" };
  }
  if (ua.includes("twitter") || ua.includes(" x/")) {
    return { source: "Twitter", medium: "social", campaign: "none", raw: "Direct", method: "user_agent" };
  }
  if (ua.includes("instagram")) {
    return { source: "Instagram", medium: "social", campaign: "none", raw: "Direct", method: "user_agent" };
  }
  if (ua.includes("fban") || ua.includes("fbav")) {
    return { source: "Facebook", medium: "social", campaign: "none", raw: "Direct", method: "user_agent" };
  }

  // 4. No source detected - truly Direct traffic
  return {
    source: "Direct",
    medium: "none",
    campaign: "none",
    raw: "Direct",
    method: "direct"
  };
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

  // Get traffic source with comprehensive detection
  const trafficSource = getTrafficSource();

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
    // Enhanced traffic source tracking
    referrer: trafficSource.source, // Clean source name for display
    referrerRaw: trafficSource.raw, // Original referrer for debugging
    trafficMedium: trafficSource.medium, // social, organic, referral, none
    trafficCampaign: trafficSource.campaign, // UTM campaign if present
    trafficMethod: trafficSource.method, // How source was detected
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
      source: trafficSource.source,
      medium: trafficSource.medium,
      method: trafficSource.method,
      device: getDeviceType()
    });
  } catch (error) {
    console.error("❌ Analytics: Failed to log visit", error);
    console.error("Visit data:", visitData);
  }
};
