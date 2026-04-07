import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function Visitors() {
  const [visits, setVisits] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "visits"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setVisits(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      },
      (error) => {
        console.error("Error fetching visitors:", error);
      }
    );
    return () => unsub();
  }, []);

  const formatTime = (ts) => {
    if (!ts?.toDate) return "";
    const date = ts.toDate();
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${day} ${month} ${year}, ${time}`;
  };

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1.5 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="tactical-header text-sm md:text-base tracking-normal md:tracking-widest">
              Recent Visitors
            </h1>
            <span className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-mono">
              Total Visitors: <span className="text-zinc-200 font-bold">{visits.length}</span>
            </span>
          </div>
          <p className="text-zinc-600 text-[9px] font-mono uppercase">Real-time List</p>
        </div>
        <div className="flex gap-1.5 items-center px-1.5 py-0.5 bg-emerald-900/10 border border-emerald-900/30 text-emerald-500 text-[9px] font-bold uppercase tracking-widest w-fit">
          <div className="w-1 h-1 bg-emerald-500 animate-pulse"></div>
          Monitoring Active
        </div>
      </div>

      {/* Visitor Cards */}
      <div className="space-y-2">
        {visits.map((v) => (
          <div
            key={v.id}
            className="tactical-card px-3 py-2.5 border-l-2 border-l-emerald-700 hover:border-l-emerald-500 transition-colors"
          >
            {/* Row 1: Date-Time | Location | IP Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
              {/* Date-Time */}
              <div>
                <p className="text-zinc-600 text-[9px] uppercase tracking-widest mb-0.5">Date & Time</p>
                <p className="text-zinc-400 text-[11px] font-mono">{formatTime(v.timestamp)}</p>
              </div>

              {/* Location */}
              <div>
                <p className="text-zinc-600 text-[9px] uppercase tracking-widest mb-0.5">Location</p>
                <p className="text-zinc-300 text-[11px]">{v.city}, {v.country}</p>
              </div>

              {/* IP Address */}
              <div>
                <p className="text-zinc-600 text-[9px] uppercase tracking-widest mb-0.5">IP Address</p>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
                  <span className="text-emerald-400 text-[11px] font-mono font-semibold">{v.ip}</span>
                </div>
              </div>
            </div>

            {/* Row 2: Platform | Source | Visitor ID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-800/40">
              {/* Platform */}
              <div>
                <p className="text-zinc-600 text-[9px] uppercase tracking-widest mb-0.5">Platform</p>
                <p className="text-zinc-300 text-[11px] font-mono">{v.os}</p>
              </div>

              {/* Source */}
              <div>
                <p className="text-zinc-600 text-[9px] uppercase tracking-widest mb-0.5">Source</p>
                <p className="text-zinc-400 text-[11px] break-all">
                  {(v.referrer && v.referrer.toLowerCase().includes("localhost")) || 
                   v.referrer === "Localhost" || 
                   v.ip === "127.0.0.1" || 
                   v.ip === "::1" 
                    ? "Localhost" 
                    : (v.referrer || "Direct")}
                </p>
              </div>

              {/* Visitor ID */}
              <div>
                <p className="text-zinc-600 text-[9px] uppercase tracking-widest mb-0.5">Visitor ID</p>
                <p className="text-zinc-500 text-[10px] font-mono break-all">{v.visitorId}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {visits.length === 0 && (
        <div className="tactical-card p-5 text-center">
          <p className="text-zinc-500 text-[11px] font-mono">No visitor records found</p>
        </div>
      )}

      {/* Summary */}
      {visits.length > 0 && (
        <div className="text-center pt-1">
          <p className="text-zinc-600 text-[9px] font-mono uppercase">
            Showing {visits.length} visitor{visits.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
