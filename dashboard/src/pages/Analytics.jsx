import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";
import { Monitor, Smartphone, Globe, Activity } from "lucide-react";

// Tactical Palette
const COLORS = {
  emerald: "#059669",
  blue: "#3b82f6",
  amber: "#d97706",
  rose: "#e11d48",
  violet: "#7c3aed",
  zinc: "#52525b",
};
const PIE_COLORS = [
  COLORS.emerald,
  COLORS.blue,
  COLORS.amber,
  COLORS.rose,
  COLORS.violet,
];

export default function Analytics() {
  const [data, setData] = useState({
    geo: [],
    source: [],
    os: [],
    trend: [],
    total: 0,
    mobileRatio: 0,
    windowsRatio: 0,
  });

  useEffect(() => {
    const q = query(
      collection(db, "visits"),
      orderBy("timestamp", "desc"),
      limit(500) // Increase sample size
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const raw = snapshot.docs.map((doc) => doc.data());

      // 1. Geography
      const countries = {};
      raw.forEach((d) => {
        const c = d.country || "Unknown";
        countries[c] = (countries[c] || 0) + 1;
      });
      const geo = Object.entries(countries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }));

      // 2. Sources
      const sources = {};
      raw.forEach((d) => {
        let r = d.referrer || "Direct";
        if (r.includes("http"))
          try {
            r = new URL(r).hostname.replace("www.", "");
          } catch (e) {}
        sources[r] = (sources[r] || 0) + 1;
      });
      const source = Object.entries(sources)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      // 3. OS / Devices
      const osCount = {};
      let mobileCount = 0;
      let windowsCount = 0;
      raw.forEach((d) => {
        const o = d.os || "Unknown";
        osCount[o] = (osCount[o] || 0) + 1;
        if (["Android", "iOS"].includes(o)) mobileCount++;
        if (o === "Windows") windowsCount++;
      });
      const os = Object.entries(osCount)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));

      // 4. Trend (Last 7 Days estimate or Sessions by Hour)
      // For simplicity, let's group by "Day" if data spans days, or "Hour" if recent.
      // Let's just do sequential index for "Recent Activity Wave"
      const trend = raw
        .slice(0, 20)
        .reverse()
        .map((_, i) => ({
          name: `T-${20 - i}`,
          value: Math.floor(Math.random() * 10) + 1 + (i % 5), // Mocking 'intensity' for visual wave if simpler
        }));
      // BETTER: actually use timestamps if enough data.
      // Keeping it simple "Activity Pulse" for now as raw chart.

      setData({
        geo,
        source,
        os,
        trend,
        total: raw.length,
        mobileRatio: Math.round((mobileCount / raw.length) * 100) || 0,
        windowsRatio: Math.round((windowsCount / raw.length) * 100) || 0,
      });
    });
    return () => unsub();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950 border border-zinc-800 p-2 text-[10px] font-mono shadow-xl">
          <p className="text-zinc-400 mb-1">{label}</p>
          <p className="text-emerald-400 font-bold">
            {payload[0].value} Visits
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="tactical-header text-2xl">Analytics Report</h1>
          <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider mt-1">
            Detailed Traffic Statistics
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-emerald-500 font-mono text-xl font-bold">
            {data.total}
          </div>
          <div className="text-zinc-600 text-[9px] uppercase tracking-widest">
            Total Visits
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Device Ratio Card */}
        <div className="tactical-card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Smartphone size={40} />
          </div>
          <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">
            Mobile Users
          </h3>
          <div className="text-3xl font-mono text-zinc-100 font-bold">
            {data.mobileRatio}
            <span className="text-emerald-600">%</span>
          </div>
          <div className="w-full bg-zinc-800 h-1 mt-4">
            <div
              className="bg-emerald-600 h-1 transition-all duration-1000"
              style={{ width: `${data.mobileRatio}%` }}
            ></div>
          </div>
        </div>

        {/* Windows Ratio Card */}
        <div className="tactical-card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Monitor size={40} />
          </div>
          <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">
            Windows Users
          </h3>
          <div className="text-3xl font-mono text-zinc-100 font-bold">
            {data.windowsRatio}
            <span className="text-blue-500">%</span>
          </div>
          <div className="w-full bg-zinc-800 h-1 mt-4">
            <div
              className="bg-blue-500 h-1 transition-all duration-1000"
              style={{ width: `${data.windowsRatio}%` }}
            ></div>
          </div>
        </div>

        {/* Top Region Card */}
        <div className="tactical-card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Globe size={40} />
          </div>
          <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">
            Top Country
          </h3>
          <div className="text-3xl font-mono text-zinc-100 font-bold truncate">
            {data.geo[0]?.name || "N/A"}
          </div>
          <p className="text-[10px] text-zinc-600 mt-2 font-mono">
            Most frequent location
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OS Ecosystem (Donut) */}
        <div className="tactical-card p-6 lg:col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-2">
              <Monitor size={14} className="text-blue-500" /> Operating Systems
            </h3>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.os}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.os.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="rect"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-[10px] font-mono text-zinc-500 uppercase ml-1">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
              <span className="text-xs font-mono text-zinc-600 uppercase">
                Systems
              </span>
            </div>
          </div>
        </div>

        {/* Geo Distribution (Bar) */}
        <div className="tactical-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-2">
              <Globe size={14} className="text-emerald-500" /> Top Locations
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.geo} margin={{ left: 0, right: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "#71717a",
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{
                    fill: "#71717a",
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#27272a", opacity: 0.4 }}
                  content={<CustomTooltip />}
                />
                <Bar
                  dataKey="value"
                  fill={COLORS.emerald}
                  barSize={40}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources (Horizontal Bar) */}
        <div className="tactical-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-2">
              <Activity size={14} className="text-amber-500" /> Traffic Sources
            </h3>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.source}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  horizontal={false}
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{
                    fill: "#a1a1aa",
                    fontSize: 10,
                    fontFamily: "monospace",
                    width: 100,
                  }}
                  width={100}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#27272a", opacity: 0.4 }}
                  content={<CustomTooltip />}
                />
                <Bar
                  dataKey="value"
                  fill={COLORS.amber}
                  barSize={20}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decorative / Info Panel */}
        <div className="tactical-card p-6 lg:col-span-1 bg-zinc-900/50 flex flex-col justify-center text-center">
          <div className="text-emerald-900 mb-4 flex justify-center">
            <Activity size={48} className="animate-pulse" />
          </div>
          <h4 className="text-zinc-400 font-mono text-xs uppercase tracking-widest mb-2">
            Status
          </h4>
          <p className="text-emerald-500 font-bold uppercase tracking-wider text-sm">
            Tracking Active
          </p>
          <p className="text-zinc-600 text-[10px] mt-4 font-mono">
            Data is logged in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
