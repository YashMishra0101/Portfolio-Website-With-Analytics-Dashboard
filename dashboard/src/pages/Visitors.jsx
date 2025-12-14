import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";

export default function Visitors() {
  const [visits, setVisits] = useState([]);

  useEffect(() => {
    // Simulating "All" logic with higher limit for now
    const q = query(
      collection(db, "visits"),
      orderBy("timestamp", "desc"),
      limit(500)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setVisits(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsub();
  }, []);

  const formatTime = (ts) => (ts?.toDate ? ts.toDate().toLocaleString() : "");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h1 className="tactical-header text-xl">Visitor Logs</h1>
          <p className="text-zinc-600 text-[10px] font-mono uppercase">
            Real-time Feed
          </p>
        </div>
        <div className="flex gap-2 items-center px-2 py-1 bg-emerald-900/10 border border-emerald-900/30 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
          <div className="w-1.5 h-1.5 bg-emerald-500 animate-pulse"></div>
          Monitoring Active
        </div>
      </div>

      <div className="tactical-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Platform</th>
                <th className="px-6 py-3">IP Address</th>
                <th className="px-6 py-3">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {visits.map((v) => (
                <tr
                  key={v.id}
                  className="hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-6 py-2 text-zinc-400 text-xs">
                    {formatTime(v.timestamp)}
                  </td>
                  <td className="px-6 py-2 text-zinc-200">
                    {v.city}, {v.country}
                  </td>
                  <td className="px-6 py-2 text-zinc-500 truncate max-w-[200px]">
                    {v.referrer || "Direct"}
                  </td>
                  <td className="px-6 py-2 text-zinc-300">{v.os}</td>
                  <td className="px-6 py-2 text-emerald-700/70 text-xs">
                    {v.ip}
                  </td>
                  <td className="px-6 py-2 text-xs text-zinc-600 truncate max-w-[100px]">
                    {v.visitorId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
