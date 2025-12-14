import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";

export default function Security() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "admin_logs"),
      orderBy("timestamp", "desc"),
      limit(100)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsub();
  }, []);

  const formatTime = (ts) => (ts?.toDate ? ts.toDate().toLocaleString() : "");

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="tactical-header text-xl">Security Access Log</h1>
        <p className="text-zinc-600 text-[10px] font-mono uppercase">
          Audit Trail
        </p>
      </div>

      <div className="tactical-card overflow-hidden">
        <table className="w-full text-left text-sm font-mono">
          <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">User ID</th>
              <th className="px-6 py-3">IP Address</th>
              <th className="px-6 py-3">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {logs.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-zinc-800/50 transition-colors"
              >
                <td className="px-6 py-2 text-zinc-400 text-xs">
                  {formatTime(log.timestamp)}
                </td>
                <td className="px-6 py-2 font-bold text-zinc-200">
                  {log.action}
                </td>
                <td className="px-6 py-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-900/10 text-emerald-500 border-emerald-900/30"
                        : "bg-red-900/10 text-red-500 border-red-900/30"
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-2 text-zinc-400">{log.userId}</td>
                <td className="px-6 py-2 text-zinc-500 text-xs">{log.ip}</td>
                <td className="px-6 py-2 text-xs">
                  {log.location ? (
                    <a
                      href={`https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:text-emerald-500 hover:underline flex items-center gap-1"
                    >
                      <MapPin size={12} />
                      {log.city
                        ? `${log.city}, ${log.country}`
                        : "View Map (GPS)"}
                    </a>
                  ) : (
                    <span className="text-zinc-700">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
