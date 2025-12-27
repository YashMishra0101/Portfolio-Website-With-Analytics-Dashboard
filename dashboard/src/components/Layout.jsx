import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, AlertTriangle, X } from "lucide-react";
import Sidebar from "./Sidebar";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { UAParser } from "ua-parser-js";
import { useAuth } from "../context/AuthProvider";

export default function Layout() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);

  // Helper: Reverse Geocoding
  // eslint-disable-next-line no-unused-vars
  const handleLogout = async () => {
    if (!navigator.geolocation) {
      setShowSecurityAlert(true);
      return;
    }

    setIsLoggingOut(true);

    // 1. IP Fetch (Robust)
    const ipFetchPromise = (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("ipapi failed");
        return await res.json();
      } catch (err) {
        try {
          const res = await fetch("https://api.db-ip.com/v2/free/self");
          if (!res.ok) throw new Error("db-ip failed");
          const data = await res.json();
          return {
            ip: data.ipAddress,
            city: data.city,
            country_name: data.countryName,
          };
        } catch (e) {
          try {
            const res = await fetch("https://api.ipify.org?format=json");
            if (!res.ok) throw new Error("ipify failed");
            const data = await res.json();
            return { ip: data.ip };
          } catch (finalErr) {
            return null;
          }
        }
      }
    })();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Wait for IP data
        const ipData = await ipFetchPromise;

        const ip = ipData?.ip || "unknown";
        const city = ipData?.city || "Unknown";
        const country = ipData?.country_name || "Unknown";

        // Use IP Location only
        // const city = ipData?.city || "Unknown";
        // const country = ipData?.country_name || "Unknown";

        // 2. Parse Device Info
        const parser = new UAParser(navigator.userAgent);
        let result = parser.getResult();
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

        // 3. Log & SignOut
        try {
          await addDoc(collection(db, "admin_logs"), {
            action: "LOGOUT",
            status: "SUCCESS",
            userId: auth.currentUser?.email || "admin",
            ip: ip,
            city: city,
            country: country,
            location: { lat: latitude, lng: longitude },
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
          console.error("Logout Log Failed", err);
        }

        localStorage.removeItem("sessionStart");
        // Delay SignOut to show "Logout Successful" message (handled via UI prop)
        setTimeout(async () => {
          await signOut(auth);
          navigate("/");
          setIsLoggingOut(false);
        }, 1500);
      },
      (error) => {
        console.error(error);
        setShowSecurityAlert(true);
        setIsLoggingOut(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 25000, // Increased to 25s for mobile stability
        maximumAge: 30000, // Allow 30s cached location
      }
    );
  };

  return (
    <div className="min-h-screen font-sans flex bg-zinc-950 flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-emerald-600 flex items-center justify-center rounded-none">
            <div className="w-1.5 h-1.5 bg-black"></div>
          </div>
          <span className="text-xs font-bold text-zinc-100 uppercase tracking-widest font-mono">
            Portfolio Monitor
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-zinc-400 hover:text-emerald-500 transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      <Sidebar
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Logout Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-bold text-white uppercase tracking-widest font-mono">
              Logging Out...
            </h2>
            <p className="text-zinc-500 text-xs mt-2 font-mono">
              Securing session data & clearing cache.
            </p>
          </div>
        </div>
      )}

      {/* Security Alert Modal */}
      {showSecurityAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border-2 border-red-600 w-full max-w-md p-8 shadow-2xl relative">
            <button
              onClick={() => setShowSecurityAlert(false)}
              className="absolute top-4 right-4 text-white hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-start gap-5">
              <div className="bg-red-900/20 p-3 rounded-none border border-red-500/30">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-500 uppercase tracking-widest font-mono">
                  Logout Blocked
                </h3>
                <p className="text-zinc-400 text-xs mt-2 font-mono leading-relaxed">
                  We cannot verify your location.
                  <br />
                  <br />
                  <span className="text-white">
                    Location access is mandatory
                  </span>{" "}
                  for secure session termination and audit logging. Please
                  enable location permissions to proceed.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSecurityAlert(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Understand
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-[calc(100vh-60px)] md:h-screen">
        <div className="max-w-6xl mx-auto space-y-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
