import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useEffect } from "react";
import { db, auth } from "../firebase";
import { UAParser } from "ua-parser-js";
import { ShieldCheck, Lock, MapPin, AlertTriangle } from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", pass: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("d"); // 'idle', 'locating', 'verifying'
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setStatus("locating");

    // 1. Strict Location Check
    if (!navigator.geolocation) {
      setError("Geolocation not supported. Login Blocked.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Success: Location Granted
        const { latitude, longitude } = position.coords;
        await processAuthentication(latitude, longitude);
      },
      (geoError) => {
        console.error(geoError);
        let msg = "Location Access Failed.";

        // Specific Error Handling
        if (geoError.code === 1) {
          // PERMISSION_DENIED
          msg =
            "ACCESS DENIED: Please enable Location Permissions in your browser settings.";
        } else if (geoError.code === 2) {
          // POSITION_UNAVAILABLE
          msg =
            "POSITION UNAVAILABLE: Your device cannot determine location. Check GPS/Network.";
        } else if (geoError.code === 3) {
          // TIMEOUT
          msg =
            "TIMEOUT: Location request took too long. Please ensure GPS is active and try again.";
        }

        setError(msg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 25000, // Increased to 25s for mobile
        maximumAge: 30000, // Accept cached location from last 30s (Fixes 'fresh fix' loops)
      }
    );
  };

  const processAuthentication = async (lat, lng) => {
    setStatus("verifying");

    // Fetch IP Data (Robust Fallback System)
    const ipData = await (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        return await res.json();
      } catch (e) {
        try {
          const res = await fetch("https://api.db-ip.com/v2/free/self");
          const d = await res.json();
          return { ip: d.ipAddress, city: d.city, country_name: d.countryName };
        } catch (e2) {
          try {
            const res = await fetch("https://api.ipify.org?format=json");
            const d = await res.json();
            return { ip: d.ip };
          } catch (e3) {
            return { ip: "unknown" };
          }
        }
      }
    })();

    const ip = ipData.ip || "unknown";
    const city = ipData.city || "Unknown";
    const country = ipData.country_name || "Unknown";

    // Use IP Location only
    // const city = ipData.city || "Unknown";
    // const country = ipData.country_name || "Unknown";

    let isMatch = false;

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.pass);
      isMatch = true;
    } catch (authErr) {
      isMatch = false;
      console.error(authErr);
    }

    // Parse User Agent
    const parser = new UAParser(navigator.userAgent);
    let result = parser.getResult();

    // Enhanced Detection Logic
    let deviceType = result.device.type || "desktop";
    let os = `${result.os.name || "Unknown OS"} ${result.os.version || ""}`;
    let browser = `${result.browser.name || "Unknown Browser"}`;
    let deviceModel = result.device.model
      ? `${result.device.vendor || ""} ${result.device.model}`
      : "PC/Mac";

    // Client Hints for Windows 11
    // @ts-ignore
    if (navigator.userAgentData) {
      // @ts-ignore
      const platform = navigator.userAgentData.platform;
      if (platform === "Windows") {
        os = "Windows 11 (Detected)";
        deviceType = "desktop";
        deviceModel = "PC";
      }
    }

    // Force Desktop if Windows is in UA
    if (navigator.userAgent.includes("Windows")) {
      deviceType = "desktop";
      if (!os.includes("Windows")) os = "Windows";
      deviceModel = "PC";
    }

    try {
      await addDoc(collection(db, "admin_logs"), {
        action: "LOGIN",
        status: isMatch ? "SUCCESS" : "FAILURE",
        userId: formData.email,
        ip: ip,
        city: city, // Precise
        country: country,
        location: { lat, lng },
        // Device Info
        device: {
          type: deviceType,
          os: os,
          browser: browser,
          model: deviceModel,
        },
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.log("Log fail", err);
    }

    if (isMatch) {
      setStatus("success"); // New State for UI Feedback
      localStorage.setItem("sessionStart", Date.now().toString());
      setTimeout(() => navigate("/dashboard"), 1500); // Delay for user to see success msg
    } else {
      setError("Invalid credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
      {/* Scanline Effect Overlay (Optional, simple version) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
          backgroundSize: "100% 2px, 3px 100%",
        }}
      ></div>

      <div className="w-full max-w-md tactical-card p-8 border-t-4 border-t-emerald-700 relative z-10">
        {/* Top Warning Banner */}
        <div className="mb-8 border-b border-zinc-800 pb-6 text-center">
          <div className="inline-flex items-center gap-2 text-emerald-600 mb-2 border border-emerald-900/30 bg-emerald-900/10 px-3 py-1 rounded-none">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Secure Gateway
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-widest mt-2 font-mono">
            Admin Login
          </h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider mt-1">
            Authorized Access Only
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/20 border-l-2 border-red-600 flex items-start gap-3 text-red-400 text-xs font-mono">
            <AlertTriangle className="shrink-0" size={16} />
            <span className="font-bold uppercase">ACCESS DENIED: {error}</span>
          </div>
        )}

        {status === "locating" && !error && (
          <div className="mb-6 p-3 bg-emerald-900/20 border-l-2 border-emerald-600 flex items-center gap-3 text-emerald-400 text-xs font-mono animate-pulse">
            <MapPin className="shrink-0" size={16} />
            <span className="uppercase font-bold">
              Verifying Location Compliance...
            </span>
          </div>
        )}

        {status === "success" && (
          <div className="mb-6 p-3 bg-emerald-900/30 border-l-2 border-emerald-500 flex items-center gap-3 text-emerald-400 text-xs font-mono">
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
              <div className="w-1.5 h-2.5 border-r-2 border-b-2 border-black rotate-45 mb-0.5"></div>
            </div>
            <span className="uppercase font-bold tracking-wider">
              Login Successful. Redirecting...
            </span>
          </div>
        )}

        {loading && !error && status !== "locating" && status !== "success" && (
          <div className="mb-6 p-3 bg-emerald-900/10 border-l-2 border-emerald-500/50 flex items-center gap-3 text-emerald-400 text-xs font-mono">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 animate-ping rounded-full" />
                <span className="uppercase font-bold tracking-wider">
                  Authenticating...
                </span>
              </div>
              <span className="text-zinc-400 text-[10px] pl-4">
                We are verifying your identity. Please wait.
              </span>
            </div>
          </div>
        )}

        {!loading && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                Email
              </label>
              <input
                type="email"
                required
                className="tactical-input"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                Password
              </label>
              <input
                type="password"
                required
                className="tactical-input"
                placeholder="PASSWORD"
                value={formData.pass}
                onChange={(e) =>
                  setFormData({ ...formData, pass: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-tactical mt-4"
            >
              ACCESS DASHBOARD
            </button>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-zinc-800 text-center">
          <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
            SECURITY: GEO-LOGGING ENABLED.
          </p>
        </div>
      </div>
    </div>
  );
}
