import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  PieChart,
  ShieldAlert,
  LogOut,
} from "lucide-react";

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: "Overview",
      path: "/dashboard",
    },
    {
      icon: <Users size={20} />,
      label: "Live Visitors",
      path: "/dashboard/visitors",
    },
    {
      icon: <PieChart size={20} />,
      label: "Analytics",
      path: "/dashboard/analytics",
    },
    {
      icon: <ShieldAlert size={20} />,
      label: "Security",
      path: "/dashboard/security",
    },
  ];

  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen fixed left-0 top-0 z-50 font-mono">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800 bg-zinc-900/50">
        <div className="w-6 h-6 bg-emerald-700 flex items-center justify-center mr-3 rounded-none">
          <div className="w-2 h-2 bg-black"></div>
        </div>
        <span className="text-xs font-bold text-zinc-100 uppercase tracking-widest">
          Portfolio Monitor
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-0 space-y-px">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-6 py-3 transition-colors uppercase text-xs tracking-wider border-l-2 ${
              isActive(item.path)
                ? "bg-zinc-900 border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
            }`}
          >
            <div
              className={`${
                isActive(item.path) ? "text-emerald-500" : "text-zinc-600"
              }`}
            >
              {item.icon}
            </div>
            <span className="font-bold">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2 border border-zinc-800 bg-zinc-900">
          <div className="w-6 h-6 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 rounded-none">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-zinc-300 uppercase truncate">
              Administrator
            </p>
            <p className="text-[9px] text-emerald-600 uppercase truncate">
              Secure Session
            </p>
          </div>
          <button
            onClick={onLogout}
            className="text-zinc-500 hover:text-red-500 transition-colors p-1"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
