import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { ShieldCheck, Lock, MapPin, AlertTriangle } from "lucide-react";

const ADMIN_CREDS = {
  id: import.meta.env.VITE_ADMIN_ID,
  pass: import.meta.env.VITE_ADMIN_PASS,
};

export default function Login() {
  const [formData, setFormData] = useState({ id: "", pass: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("d"); // 'idle', 'locating', 'verifying'
  const navigate = useNavigate();

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
        // Error: Location Denied
        console.error(geoError);
        setError(
          "ACCESS DENIED: Location permission is MANDATORY for security logging."
        );
        setLoading(false);
      },
      {
        enableHighAccuracy: true, // Use GPS if available
        timeout: 15000, // Wait up to 15s for best signal
        maximumAge: 0, // Force fresh reading
      }
    );
  };

  const processAuthentication = async (lat, lng) => {
    setStatus("verifying");
    let ip = "unknown";
    let city = "Unknown";
    let country = "Unknown";

    try {
      // Use ipapi.co to get IP + City/Country (matches analytics.js)
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      ip = data.ip || "unknown";
      city = data.city || "Unknown";
      country = data.country_name || "Unknown";
    } catch (err) {
      // Fallback if ipapi fails
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        ip = data.ip;
      } catch (e) {}
    }

    const isMatch =
      formData.id === ADMIN_CREDS.id && formData.pass === ADMIN_CREDS.pass;

    try {
      await addDoc(collection(db, "admin_logs"), {
        action: "LOGIN_ATTEMPT",
        status: isMatch ? "SUCCESS" : "FAILURE",
        userId: formData.id,
        ip: ip,
        city: city, // New Field
        country: country, // New Field
        location: { lat, lng }, // Keep coords for the map link
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.log("Log fail", err);
    }

    if (isMatch) {
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("adminSession", Date.now().toString());
      navigate("/dashboard");
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
            Authorized Access Only // Secured Environment
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

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
              Admin ID
            </label>
            <input
              type="text"
              required
              className="tactical-input"
              placeholder="USERNAME"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
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
            {loading ? "VERIFYING..." : "ACCESS DASHBOARD"}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-zinc-800 text-center">
          <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
            SECURITY: GEO-LOGGING ENABLED.
          </p>
        </div>
      </div>
    </div>
  );
}

// Icon helper
function UsersIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
