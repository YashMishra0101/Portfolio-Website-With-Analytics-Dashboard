import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  LogOut,
  PieChart,
  Edit3,
  X,
  Shield,
  Lock,
  UserX,
} from "lucide-react";

import { useAuth } from "../context/AuthProvider";

export default function Sidebar({ onLogout, isOpen, onClose, isLoggingOut }) {
  const { role } = useAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [showRestricted, setShowRestricted] = useState(false);

  const navItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: "Analytics Dashboard",
      path: "/dashboard/analytics",
    },
    {
      icon: <Users size={20} />,
      label: "Recent Visitors",
      path: "/dashboard/visitors",
    },
    {
      icon: <PieChart size={20} />,
      label: "Content Manager",
      path: "/dashboard/content",
    },
    {
      icon: <ShieldAlert size={20} />,
      label: "Session History",
      path: "/dashboard/security",
    },
    {
      icon: <UserX size={20} />,
      label: "Visitor Management",
      path: "/dashboard/visitor-management",
      adminOnly: true,
    },
  ];

  const handleNavClick = (item, e) => {
    // Check if item is admin-only and user is not admin
    if (item.adminOnly && role !== "admin") {
      e.preventDefault();
      setShowRestricted(true);
      setTimeout(() => setShowRestricted(false), 3000);
      return;
    }
    // Close sidebar on mobile
    onClose && onClose();
  };

  return (
    <>
      {/* Restricted Access Notification */}
      {showRestricted && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-zinc-900 border border-red-500/50 px-5 py-4 shadow-lg flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500/20 flex items-center justify-center">
              <Lock size={16} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-100 font-bold uppercase tracking-wider">Access Denied</p>
              <p className="text-xs text-zinc-400 font-mono">Only Admin can access this section</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={`
        w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen fixed left-0 top-0 z-50 font-mono transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-emerald-700 flex items-center justify-center mr-3 rounded-none">
              <div className="w-2 h-2 bg-black"></div>
            </div>
            <span className="text-xs font-bold text-zinc-100 uppercase tracking-widest">
              Portfolio Monitor
            </span>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="md:hidden text-zinc-500 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-0 space-y-px">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.adminOnly && role !== "admin" ? "#" : item.path}
              onClick={(e) => handleNavClick(item, e)}
              className={`flex items-center gap-3 px-6 py-3 transition-colors uppercase text-xs tracking-wider border-l-2 ${isActive(item.path)
                ? "bg-zinc-900 border-emerald-500 text-emerald-400"
                : item.adminOnly && role !== "admin"
                  ? "border-transparent text-zinc-600 cursor-not-allowed opacity-60"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
                }`}
            >
              <div
                className={`${isActive(item.path) ? "text-emerald-500" : "text-zinc-600"
                  }`}
              >
                {item.icon}
              </div>
              <span className="font-bold">{item.label}</span>
              {item.adminOnly && role !== "admin" && (
                <Lock size={12} className="ml-auto text-zinc-600" />
              )}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2 border border-zinc-800 bg-zinc-900 mb-3">
            <div className="w-6 h-6 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 rounded-none">
              {role === "admin" ? "AD" : "VW"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-100 uppercase truncate tracking-wide">
                {role === "admin" ? "Administrator" : "Viewer (Read Only)"}
              </p>
              <div
                className={`mt-1.5 px-2 py-0.5 border font-mono text-[9px] font-bold uppercase tracking-widest w-fit ${role === "admin"
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-500"
                  : "bg-blue-950/40 border-blue-500/30 text-blue-400"
                  }`}
              >
                {role === "admin" ? "FULL ACCESS" : "READ ONLY"}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-900/20 border border-red-900/50 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-all uppercase text-xs font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={16} className={isLoggingOut ? "animate-spin" : ""} />
            {isLoggingOut ? "Logging Out..." : "Sign Out"}
          </button>
        </div>
      </div>
    </>
  );
}
