import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Layout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    // Audit Log
    try {
      await addDoc(collection(db, "admin_logs"), {
        action: "LOGOUT",
        status: "SUCCESS",
        userId: "admin",
        timestamp: serverTimestamp(),
      });
    } catch (err) {}

    localStorage.removeItem("sessionStart");
    await signOut(auth);
    navigate("/");
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
            Monitor
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
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-[calc(100vh-60px)] md:h-screen">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
