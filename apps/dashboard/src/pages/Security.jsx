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
import { tsToDate, formatTimestamp } from "../utils/timestamp";
import { getDisplayModeLabel } from "../utils/sessionIdentity";

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
        const data = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        data.sort((a, b) => {
          const timeA = tsToDate(a.timestamp, new Date(0)).getTime();
          const timeB = tsToDate(b.timestamp, new Date(0)).getTime();
          return timeB - timeA;
        });
        setLogs(data);
      },
      (error) => {
        console.error("Error fetching security logs:", error);
      }
    );
    return () => unsub();
  }, []);

  /**
   * Count active admin sessions, not broad device buckets.
   *
   * New logs carry a sessionId, so login/logout events can be matched exactly.
   * Older logs did not have one, so each successful legacy login is treated as
   * its own session instead of merging same-IP Windows/browser rows together.
   */
  const ADMIN_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

  const activeSessionCount = (() => {
    const now = Date.now();
    const sessionEvents = logs.filter(
      (log) =>
        (log.action === "LOGIN" || log.action === "LOGOUT") &&
        log.status === "SUCCESS" &&
        log.timestamp
    );

    const latestBySession = new Map();
    for (const log of sessionEvents) {
      const sessionKey = log.sessionId
        ? `session:${log.sessionId}`
        : log.action === "LOGIN"
          ? `legacy-login:${log.id}`
          : null;

      if (!sessionKey) continue;

      const logTime = tsToDate(log.timestamp).getTime();
      const previousLog = latestBySession.get(sessionKey);
      const previousTime = previousLog
        ? tsToDate(previousLog.timestamp).getTime()
        : 0;

      if (!previousLog || logTime > previousTime) {
        latestBySession.set(sessionKey, log);
      }
    }

    let count = 0;
    for (const log of latestBySession.values()) {
      if (log.action !== "LOGIN") continue;

      const loginTime = tsToDate(log.timestamp).getTime();
      const expiresAt =
        typeof log.sessionExpiresAt === "number"
          ? log.sessionExpiresAt
          : loginTime + ADMIN_TTL;

      if (now < expiresAt) {
        count++;
      }
    }

    return count;
  })();



  const formatOS = (osName) => {
    if (!osName) return "Unknown OS";
    const lower = osName.toLowerCase();
    if (lower.includes("android")) return "Android";
    if (lower.includes("windows")) return "Windows";
    if (lower.includes("ios")) return "iOS";
    if (lower.includes("mac")) return "Mac";
    if (lower.includes("linux")) return "Linux";
    return osName.replace(" (Detected)", "");
  };

  const getActionColor = (action) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("login")) return "text-emerald-500";
    if (actionLower.includes("logout")) return "text-red-500";
    return "text-zinc-200";
  };

  const getDisplayRole = (log) => {
    return (log.role || "ADMIN").toUpperCase();
  };

  const getStatusDisplay = (status) => {
    if (status === "FAILED - SECURITY KEY") return "KEY FAILED";
    return status;
  };

  const getStatusClass = (status) => {
    if (status === "SUCCESS") {
      return "bg-emerald-900/10 text-emerald-500 border-emerald-900/30";
    }
    return "bg-red-900/10 text-red-500 border-red-900/30";
  };

  const getDeviceMode = (log) => {
    if (!log.displayMode) return null;
    return getDisplayModeLabel(log.displayMode);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="tactical-header text-xl">Session History</h1>
          <p className="text-zinc-600 text-[11px] font-mono uppercase">
            Activity History
          </p>
        </div>
        {/* Active Sessions Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-900/15 border border-emerald-900/30 rounded-sm shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
            Active Sessions:
          </span>
          <span className="text-[11px] font-bold font-mono text-emerald-400">
            {activeSessionCount}
          </span>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className="tactical-card p-4 flex flex-col gap-3 border-l-2 border-l-zinc-700"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-zinc-500 text-[11px] font-mono mb-1">
                  {formatTimestamp(log.timestamp)}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className={`font-bold ${getActionColor(log.action)}`}>
                      {log.action.replace("_ATTEMPT", "")}
                    </span>
                    <span className="text-[9px] font-mono tracking-tighter text-sky-400">
                      ({getDisplayRole(log)})
                    </span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold uppercase border ${getStatusClass(log.status)}`}
                  >
                    {getStatusDisplay(log.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/50">
              <div className="overflow-hidden">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                  User
                </p>
                <p className="text-xs text-zinc-300 truncate" title={log.userId}>
                  {log.userId}
                </p>
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                  IP Address
                </p>
                <p className="text-xs text-zinc-400 font-mono break-all">
                  {log.ip}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                  Device
                </p>
                <div className="flex items-center gap-2">
                  {log.device?.type === "mobile" ? (
                    <Smartphone size={14} className="text-zinc-500" />
                  ) : (
                    <Monitor size={14} className="text-zinc-500" />
                  )}
                  <span className="text-xs text-zinc-300">
                    {formatOS(log.device?.os)} •{" "}
                    {log.device?.model !== "PC/Mac"
                      ? log.device?.model
                      : log.device?.browser}
                  </span>
                  {getDeviceMode(log) && (
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500">
                      {getDeviceMode(log)}
                    </span>
                  )}
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

      {/* Desktop Table */}
      <div className="hidden md:block tactical-card overflow-x-auto">
        <table className="w-full text-left font-mono min-w-[900px] table-fixed">
          <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3 w-[15%]">Timestamp</th>
              <th className="px-4 py-3 w-[10%]">Action</th>
              <th className="px-4 py-3 w-[9%]">Status</th>
              <th className="px-4 py-3 w-[16%]">Email</th>
              <th className="px-4 py-3 w-[15%]">Device Info</th>
              <th className="px-4 py-3 w-[16%]">IP Address</th>
              <th className="px-4 py-3 w-[19%]">
                <div className="flex flex-col items-center">
                  <span>Location</span>
                  <span className="text-[9px] font-normal opacity-70 whitespace-nowrap">
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
                <td className="px-4 py-2 text-zinc-400 text-[11px] align-top">
                  {formatTimestamp(log.timestamp)}
                </td>
                <td className="px-4 py-2 font-bold text-[11px] align-top">
                  <div className="flex flex-col">
                    <span className={`text-[11px] ${getActionColor(log.action)}`}>
                      {log.action.replace("_ATTEMPT", "")}
                    </span>
                    <span className="text-[9px] font-mono font-normal tracking-tighter text-sky-400">
                      ({getDisplayRole(log)})
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 align-top">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold uppercase border ${getStatusClass(log.status)}`}
                  >
                    {getStatusDisplay(log.status)}
                  </span>
                </td>
                <td
                  className="px-4 py-2 text-zinc-400 text-[11px] whitespace-normal break-all align-top"
                  title={log.userId}
                >
                  {log.userId}
                </td>
                <td className="px-4 py-2 align-top">
                  <div className="flex items-center gap-2">
                    {log.device?.type === "mobile" ? (
                      <Smartphone size={12} className="text-zinc-500" />
                    ) : (
                      <Monitor size={12} className="text-zinc-500" />
                    )}
                    <span className="text-[11px] text-zinc-200">
                      {formatOS(log.device?.os)} •{" "}
                      {log.device?.model !== "PC/Mac"
                        ? log.device?.model
                        : log.device?.browser || "Browser"}
                    </span>
                    {getDeviceMode(log) && (
                      <span className="text-[9px] uppercase tracking-widest text-zinc-600">
                        {getDeviceMode(log)}
                      </span>
                    )}
                  </div>
                </td>
                <td
                  className="px-4 py-2 text-zinc-500 text-[11px] font-mono whitespace-normal break-all align-top"
                  title={log.ip}
                >
                  {log.ip}
                </td>
                <td className="px-4 py-2 text-[11px] align-top">
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
