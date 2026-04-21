import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { UAParser } from "ua-parser-js";
import {
  clearStoredAdminSession,
  getStoredAdminSession,
} from "../utils/sessionIdentity";

export default function Layout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const session = getStoredAdminSession();

    // Fetch IP Data (No location permission needed)
    const ipData = await (async () => {
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

    const ip = ipData?.ip || "unknown";
    const city = ipData?.city || "Unknown";
    const country = ipData?.country_name || "Unknown";
    // Get lat/lng from IP API if available
    const lat = ipData?.latitude || null;
    const lng = ipData?.longitude || null;

    // Parse Device Info
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
        os = "Windows 11";
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

    // Log & SignOut
    try {
      await addDoc(collection(db, "admin_logs"), {
        action: "LOGOUT",
        status: "SUCCESS",
        role: "admin",
        userId: auth.currentUser?.email || "admin",
        ip: ip,
        city: city,
        country: country,
        location: lat && lng ? { lat, lng } : null,
        device: {
          type: deviceType,
          os: os,
          browser: browser,
          model: deviceModel,
        },
        sessionId: session.id,
        clientId: session.clientId,
        displayMode: session.displayMode,
        sessionStartedAt: session.startedAt ? Number(session.startedAt) : null,
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Logout Log Failed", err);
    }

    localStorage.removeItem("sessionStart");
    localStorage.removeItem("securityKeyVerified");
    localStorage.removeItem("sessionExpiry");
    clearStoredAdminSession();
    sessionStorage.removeItem("securityKeyVerified");

    // Delay SignOut to show "Logout Successful" message
    setTimeout(async () => {
      await signOut(auth);
      navigate("/");
      setIsLoggingOut(false);
    }, 1500);
  };

  return (
    <div className="h-screen w-full overflow-hidden font-sans flex flex-col md:block bg-zinc-950">
      {/* Mobile Header */}
      <div className="md:hidden flex-none flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 z-40">
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

      {/* Main Content Area */}
      <main className="flex-1 md:h-screen md:ml-64 p-4 md:p-8 overflow-y-auto overflow-x-hidden h-full">
        <div className="max-w-6xl mx-auto space-y-4 pb-20 md:pb-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
