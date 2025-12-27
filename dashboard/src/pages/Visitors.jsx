import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function Visitors() {
  const [visits, setVisits] = useState([]);

  useEffect(() => {
    // Simulating "All" logic with higher limit for now
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

  const formatTime = (ts) => (ts?.toDate ? ts.toDate().toLocaleString() : "");

  return (
    <div className="space-y-0">
      <div className="flex justify-between items-end pb-2">
        <div>
          <h1 className="tactical-header text-xl">Recent Visitors</h1>
          <p className="text-zinc-600 text-[10px] font-mono uppercase">
            Real-time List
          </p>
        </div>
        <div className="flex gap-2 items-center px-2 py-1 bg-emerald-900/10 border border-emerald-900/30 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
          <div className="w-1.5 h-1.5 bg-emerald-500 animate-pulse"></div>
          Monitoring Active
        </div>
      </div>

      {/* Mobile: Card View */}
      <div className="md:hidden space-y-4">
        {visits.map((v) => (
          <div
            key={v.id}
            className="tactical-card p-4 flex flex-col gap-3 border-l-2 border-l-emerald-700"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-zinc-500 text-[10px] font-mono mb-1">
                  {formatTime(v.timestamp)}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="font-bold text-zinc-100 text-sm">
                    {v.ip}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/50">
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1 flex flex-col items-center">
                  <span>Location</span>
                  <span className="text-[7px] opacity-70 whitespace-nowrap">
                    (BASED ON IP ADDRESS)
                  </span>
                </p>
                <p className="text-xs text-zinc-300 truncate">
                  {v.city}, {v.country}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">
                  Platform
                </p>
                <p className="text-xs text-zinc-400 font-mono truncate">
                  {v.os}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">
                  Source
                </p>
                <p className="text-xs text-zinc-400 break-all">
                  {v.referrer || "Direct"}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">
                  ID
                </p>
                <p className="text-[10px] text-zinc-600 font-mono truncate">
                  {v.visitorId}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block tactical-card overflow-x-auto tactical-scroll pb-2 [transform:rotateX(180deg)]">
        <table className="w-full text-left text-sm font-mono min-w-[1200px] [transform:rotateX(180deg)]">
          <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">
                <div className="flex flex-col items-center">
                  <span>Location</span>
                  <span className="text-[8px] font-normal opacity-70 whitespace-nowrap">
                    (ESTIMATED LOCATION)
                  </span>
                </div>
              </th>
              <th className="px-6 py-3">Source</th>
              <th className="px-6 py-3">Platform</th>
              <th className="px-6 py-3">IP Address</th>
              <th className="px-6 py-3">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {visits.map((v) => (
              <tr key={v.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-2 text-zinc-400 text-xs whitespace-nowrap">
                  {formatTime(v.timestamp)}
                </td>
                <td className="px-6 py-2 text-zinc-200 whitespace-nowrap">
                  {v.city}, {v.country}
                </td>
                <td className="px-6 py-2 text-zinc-500 text-xs">
                  {v.referrer || "Direct"}
                </td>
                <td className="px-6 py-2 text-zinc-300 whitespace-nowrap">
                  {v.os}
                </td>
                <td className="px-6 py-2 text-emerald-700/70 text-xs font-mono whitespace-nowrap">
                  {v.ip}
                </td>
                <td className="px-6 py-2 text-xs text-zinc-600 font-mono">
                  {v.visitorId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
