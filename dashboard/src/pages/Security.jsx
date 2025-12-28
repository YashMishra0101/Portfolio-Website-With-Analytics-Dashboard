import { useState, useEffect } from "react";
import { MapPin, Smartphone, Monitor } from "lucide-react";
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
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setLogs(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      },
      (error) => {
        console.error("Error fetching security logs:", error);
      }
    );
    return () => unsub();
  }, []);

  const formatTime = (ts) => (ts?.toDate ? ts.toDate().toLocaleString() : "");

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="tactical-header text-xl">Activity Audit</h1>
        <p className="text-zinc-600 text-[10px] font-mono uppercase">
          User Activity History
        </p>
      </div>

      <div className="md:hidden space-y-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className="tactical-card p-4 flex flex-col gap-3 border-l-2 border-l-zinc-700"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-zinc-500 text-[10px] font-mono mb-1">
                  {formatTime(log.timestamp)}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-100 italic">
                      {log.action.replace("_ATTEMPT", "")}
                    </span>
                    <span className="text-[8px] text-zinc-500 font-mono tracking-tighter">
                      (
                      {(
                        log.role ||
                        (log.userId === "yashrkm0101@gmail.com"
                          ? "ADMIN"
                          : "VIEWER")
                      ).toUpperCase()}
                      )
                    </span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-900/10 text-emerald-500 border-emerald-900/30"
                        : "bg-red-900/10 text-red-500 border-red-900/30"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/50">
              <div className="overflow-hidden">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">
                  User
                </p>
                <p
                  className="text-xs text-zinc-300 truncate"
                  title={log.userId}
                >
                  {log.userId}
                </p>
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">
                  IP Address
                </p>
                <p className="text-xs text-zinc-400 font-mono break-all">
                  {log.ip}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">
                  Device
                </p>
                <div className="flex items-center gap-2">
                  {log.device?.type === "mobile" ? (
                    <Smartphone size={14} className="text-zinc-500" />
                  ) : (
                    <Monitor size={14} className="text-zinc-500" />
                  )}
                  <span className="text-xs text-zinc-300">
                    {log.device?.os?.replace(" (Detected)", "")} •{" "}
                    {log.device?.model !== "PC/Mac"
                      ? log.device?.model
                      : log.device?.browser}
                  </span>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1 flex flex-col items-center">
                  <span>Location</span>
                  <span className="text-[7px] opacity-70 whitespace-nowrap">
                    (ESTIMATED LOCATION)
                  </span>
                </p>
                {log.location ? (
                  <a
                    href={`https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-500 hover:text-emerald-400 text-xs flex items-center gap-1"
                  >
                    <MapPin size={12} />
                    {log.city ? `${log.city}, ${log.country}` : "View Map"}
                  </a>
                ) : (
                  <span className="text-zinc-600 text-xs">-</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block tactical-card overflow-x-auto">
        <table className="w-full text-left font-mono min-w-[900px]">
          <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-500 font-bold uppercase text-[9px] tracking-wider">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Device Info</th>
              <th className="px-4 py-3">IP Address</th>
              <th className="px-4 py-3">
                <div className="flex flex-col items-center">
                  <span>Location</span>
                  <span className="text-[8px] font-normal opacity-70 whitespace-nowrap">
                    (ESTIMATED LOCATION)
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {logs.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-zinc-800/50 transition-colors"
              >
                <td className="px-4 py-2 text-zinc-400 text-[10px]">
                  {formatTime(log.timestamp)}
                </td>
                <td className="px-4 py-2 font-bold text-zinc-200 text-[10px]">
                  <div className="flex flex-col">
                    <span className="italic">
                      {log.action.replace("_ATTEMPT", "")}
                    </span>
                    <span className="text-[8px] text-zinc-500 font-mono font-normal tracking-tighter">
                      (
                      {(
                        log.role ||
                        (log.userId === "yashrkm0101@gmail.com"
                          ? "ADMIN"
                          : "VIEWER")
                      ).toUpperCase()}
                      )
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-900/10 text-emerald-500 border-emerald-900/30"
                        : "bg-red-900/10 text-red-500 border-red-900/30"
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
                <td
                  className="px-4 py-2 text-zinc-400 text-[10px] truncate max-w-[150px]"
                  title={log.userId}
                >
                  {log.userId}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {log.device?.type === "mobile" ? (
                      <Smartphone size={12} className="text-zinc-500" />
                    ) : (
                      <Monitor size={12} className="text-zinc-500" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-200 font-bold">
                        {log.device?.os?.replace(" (Detected)", "") ||
                          "Unknown OS"}
                      </span>
                      <span className="text-[9px] text-zinc-500 truncate max-w-[120px]">
                        {log.device?.model !== "PC/Mac"
                          ? log.device?.model
                          : log.device?.browser || "Browser"}
                      </span>
                    </div>
                  </div>
                </td>
                <td
                  className="px-4 py-2 text-zinc-500 text-[10px] font-mono whitespace-nowrap"
                  title={log.ip}
                >
                  {log.ip}
                </td>
                <td className="px-4 py-2 text-[10px]">
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
