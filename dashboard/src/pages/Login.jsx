import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { db, auth } from "../firebase";
import { UAParser } from "ua-parser-js";
import { ShieldCheck, Lock, AlertTriangle, Key } from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", pass: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // 'idle', 'verifying', 'success', 'security-key'
  const [securityKey, setSecurityKey] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [securityKeyError, setSecurityKeyError] = useState("");
  const [keyAttempts, setKeyAttempts] = useState(0);
  const [loginData, setLoginData] = useState(null); // Store login data for logging after security key
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Check if security key was verified in this session
        const securityVerified = sessionStorage.getItem("securityKeyVerified");
        if (securityVerified === "true") {
          navigate("/dashboard");
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setStatus("verifying");

    await processAuthentication();
  };

  const processAuthentication = async () => {
    // STEP 1: Verify credentials FIRST (fast)
    let isMatch = false;
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.pass);
      isMatch = true;
    } catch (authErr) {
      isMatch = false;
      console.error(authErr);
    }

    // If credentials are wrong, fail immediately (no IP fetch needed)
    if (!isMatch) {
      setError("Invalid credentials.");
      setLoading(false);
      setStatus("idle");
      return;
    }

    // STEP 2: Only fetch IP data if credentials are correct
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
    const lat = ipData.latitude || null;
    const lng = ipData.longitude || null;

    // Parse User Agent
    const parser = new UAParser(navigator.userAgent);
    let result = parser.getResult();

    let deviceType = result.device.type || "desktop";
    let os = `${result.os.name || "Unknown OS"} ${result.os.version || ""}`;
    let browser = `${result.browser.name || "Unknown Browser"}`;
    let deviceModel = result.device.model
      ? `${result.device.vendor || ""} ${result.device.model}`
      : "PC/Mac";

    // @ts-ignore
    if (navigator.userAgentData) {
      // @ts-ignore
      const platform = navigator.userAgentData.platform;
      if (platform === "Windows") {
        os = "Windows 11";
        deviceType = "desktop";
        deviceModel = "PC";
      }
    }

    if (navigator.userAgent.includes("Windows")) {
      deviceType = "desktop";
      if (!os.includes("Windows")) os = "Windows";
      deviceModel = "PC";
    }

    const role = formData.email === "yashrkm0101@gmail.com" ? "admin" : "viewer";

    // Store login data for logging after security key verification
    setLoginData({
      role,
      userId: formData.email,
      ip,
      city,
      country,
      location: lat && lng ? { lat, lng } : null,
      device: {
        type: deviceType,
        os,
        browser,
        model: deviceModel,
      },
      userAgent: navigator.userAgent,
    });

    // Proceed to security key verification
    setUserRole(role);
    setStatus("security-key");
    setLoading(false);
  };

  const handleSecurityKeySubmit = async (e) => {
    e.preventDefault();
    setSecurityKeyError("");
    setLoading(true);

    try {
      // Fetch the correct security key from Firebase based on role
      const collectionName = userRole === "admin" ? "adminSecurityKey" : "viewerSecurityKey";
      const docName = userRole === "admin" ? "adminKey" : "viewerKey";

      const keyDoc = await getDoc(doc(db, collectionName, docName));

      if (!keyDoc.exists()) {
        setSecurityKeyError("Security configuration error. Contact administrator.");
        setLoading(false);
        return;
      }

      const storedKey = keyDoc.data().key;

      if (securityKey === storedKey) {
        // Security key verified - NOW log LOGIN SUCCESS
        if (loginData) {
          try {
            await addDoc(collection(db, "admin_logs"), {
              action: "LOGIN",
              status: "SUCCESS",
              ...loginData,
              timestamp: serverTimestamp(),
            });
          } catch (err) {
            console.log("Log fail", err);
          }
        }

        // Set Session Expiry based on Role
        const now = Date.now();
        const expiryDuration =
          userRole === "admin"
            ? 30 * 24 * 60 * 60 * 1000 // 30 Days for Admin
            : 24 * 60 * 60 * 1000; // 24 Hours for Viewer

        const expiryTime = now + expiryDuration;

        localStorage.setItem("sessionExpiry", expiryTime.toString());
        localStorage.setItem("securityKeyVerified", "true"); // Persist across tabs
        // Clear old sessionStorage just in case
        sessionStorage.removeItem("securityKeyVerified");

        setStatus("success");
        setLoading(false);
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        // Wrong key
        const newAttempts = keyAttempts + 1;
        setKeyAttempts(newAttempts);

        if (newAttempts >= 3) {
          // Too many failed attempts - log failure and sign out
          if (loginData) {
            try {
              await addDoc(collection(db, "admin_logs"), {
                action: "LOGIN",
                status: "FAILED - SECURITY KEY",
                ...loginData,
                timestamp: serverTimestamp(),
              });
            } catch (err) {
              console.log("Log fail", err);
            }
          }

          setSecurityKeyError("Too many failed attempts. Session terminated.");
          setLoading(false);
          await signOut(auth);
          localStorage.removeItem("securityKeyVerified");
          localStorage.removeItem("sessionExpiry");
          sessionStorage.removeItem("securityKeyVerified");
          setTimeout(() => {
            setStatus("idle");
            setSecurityKey("");
            setUserRole(null);
            setSecurityKeyError("");
            setKeyAttempts(0);
            setFormData({ email: "", pass: "" });
            setLoginData(null);
          }, 2000);
        } else {
          setSecurityKeyError(`Invalid Security Key. ${3 - newAttempts} attempts remaining.`);
          setLoading(false);
          setSecurityKey("");
        }
      }
    } catch (err) {
      console.error("Security key verification error:", err);
      setSecurityKeyError("Verification failed. Please try again.");
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    await signOut(auth);
    localStorage.removeItem("securityKeyVerified");
    localStorage.removeItem("sessionExpiry");
    sessionStorage.removeItem("securityKeyVerified");
    setStatus("idle");
    setSecurityKey("");
    setUserRole(null);
    setSecurityKeyError("");
    setKeyAttempts(0);
    // formData is NOT cleared here, allowing persistence
    setLoginData(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
      {/* Scanline Effect Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
          backgroundSize: "100% 2px, 3px 100%",
        }}
      ></div>

      <div className="w-full max-w-md tactical-card p-8 border-t-4 border-t-emerald-700 relative z-10">
        {/* Security Key Verification Screen */}
        {status === "security-key" && (
          <>
            <div className="mb-8 border-b border-zinc-800 pb-6 text-center">
              <div className="inline-flex items-center gap-2 text-amber-500 mb-2 border border-amber-900/30 bg-amber-900/10 px-3 py-1 rounded-none">
                <Key size={14} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                  Security Verification
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-widest mt-2 font-mono">
                Enter Security Key
              </h1>
              <p className="text-zinc-500 text-[10px] uppercase tracking-wider mt-1">
                Additional verification required
              </p>
            </div>

            {securityKeyError && (
              <div className="mb-6 p-3 bg-red-900/20 border-l-2 border-red-600 flex items-start gap-3 text-red-400 text-xs font-mono">
                <AlertTriangle className="shrink-0" size={16} />
                <span className="font-bold uppercase">{securityKeyError}</span>
              </div>
            )}

            <form onSubmit={handleSecurityKeySubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                  Security Key
                </label>
                <input
                  type="password"
                  required
                  className="tactical-input"
                  placeholder="Enter your security key"
                  value={securityKey}
                  onChange={(e) => setSecurityKey(e.target.value)}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-tactical mt-4"
              >
                {loading ? "VERIFYING..." : "VERIFY & ACCESS"}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full text-zinc-500 text-xs hover:text-zinc-300 transition-colors mt-2"
              >
                ← Back to Login
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-zinc-800 text-center">
              <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
                SECURITY: TWO-FACTOR AUTHENTICATION ENABLED
              </p>
            </div>
          </>
        )}

        {/* Main Login Screen */}
        {status !== "security-key" && (
          <>
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

            {loading && status === "verifying" && (
              <div className="mb-6 p-3 bg-emerald-900/10 border-l-2 border-emerald-500/50 flex items-center gap-3 text-emerald-400 text-xs font-mono">
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 animate-ping rounded-full" />
                    <span className="uppercase font-bold tracking-wider">
                      Authenticating...
                    </span>
                  </div>
                  <span className="text-zinc-400 text-[10px] pl-4">
                    Verifying credentials. Please wait.
                  </span>
                </div>
              </div>
            )}

            {!loading && status !== "success" && (
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
                SECURITY: TWO-FACTOR AUTHENTICATION ENABLED
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
