/**
 * Safely converts a Firestore timestamp to a JavaScript Date.
 *
 * Handles three formats:
 *  1. Firestore Timestamp instance        → has a .toDate() method (live client writes)
 *  2. Plain object {_seconds, _nanoseconds} → written by Firebase Admin SDK during migration
 *  3. Plain object {seconds, nanoseconds}   → alternative Admin SDK serialization
 *  4. Anything else                         → returns fallback (default: new Date())
 */
export function tsToDate(ts, fallback = new Date()) {
  if (!ts) return fallback;
  if (typeof ts.toDate === "function") return ts.toDate();
  // Admin SDK stores with underscore prefix: _seconds, _nanoseconds
  if (typeof ts._seconds === "number") return new Date(ts._seconds * 1000);
  // Alternative plain object format: seconds, nanoseconds
  if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
  return fallback;
}

/**
 * Formats a Firestore timestamp to a readable string.
 * Returns "" if the timestamp is missing or invalid.
 *
 * Output: "07 Apr 2026, 11:30:00 PM"
 */
export function formatTimestamp(ts) {
  const date = tsToDate(ts, null);
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${day} ${month} ${year}, ${time}`;
}
