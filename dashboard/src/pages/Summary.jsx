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
  Users,
  Smartphone,
  Globe,
  Activity,
  Eye,
  Radar,
  Monitor,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

// Tactical Palette from Analytics
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

export default function Summary() {
  const [timeRange, setTimeRange] = useState("1d");
  const [stats, setStats] = useState({
    total: 0,
    desktop: 0,
    mobile: 0,
    topCountry: "scanning...",
    chartData: [],
    geo: [],
    source: [],
    os: [],
    windows: 0,
    mac: 0,
    android: 0,
    ios: 0,
  });

  useEffect(() => {
    // Increase limit to allow for filtering
    const q = query(
      collection(db, "visits"),
      orderBy("timestamp", "desc"),
      limit(1000)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const allData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          createdAt: doc.data().timestamp?.toDate() || new Date(),
          id: doc.id,
        }));

        // Filter by Time Range
        const now = new Date();
        let startTime = new Date();
        if (timeRange === "1h") startTime.setHours(now.getHours() - 1);
        if (timeRange === "3h") startTime.setHours(now.getHours() - 3);
        if (timeRange === "6h") startTime.setHours(now.getHours() - 6);
        if (timeRange === "1d") startTime.setHours(now.getHours() - 24);
        if (timeRange === "7d") startTime.setDate(now.getDate() - 7);
        if (timeRange === "30d") startTime.setDate(now.getDate() - 30);
        if (timeRange === "1y") startTime.setFullYear(now.getFullYear() - 1);

        const filteredData = allData.filter((d) => d.createdAt >= startTime);

        // Calc Stats
        const total = filteredData.length;

        const mobileCount = filteredData.filter((d) =>
          ["Android", "iOS"].includes(d.os)
        ).length;

        const desktopCount = filteredData.filter((d) =>
          ["Windows", "MacOS", "Linux"].includes(d.os)
        ).length;

        // Granular OS Counts
        const windowsCount = filteredData.filter(
          (d) => d.os === "Windows"
        ).length;
        const macCount = filteredData.filter((d) => d.os === "MacOS").length;
        const androidCount = filteredData.filter(
          (d) => d.os === "Android"
        ).length;
        const iosCount = filteredData.filter((d) => d.os === "iOS").length;

        // Top Country
        const countries = {};
        filteredData.forEach((d) => {
          const c = d.country || "Unknown";
          countries[c] = (countries[c] || 0) + 1;
        });
        const topCountry =
          Object.entries(countries).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "N/A";

        // Geo for Chart (Top 8)
        const geo = Object.entries(countries)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, value]) => ({ name, value }));

        // ... rest of logic ...

        // Traffic Sources
        const sources = {};
        filteredData.forEach((d) => {
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

        // OS / Devices Breakdown
        const osCount = {};
        filteredData.forEach((d) => {
          const o = d.os || "Unknown";
          osCount[o] = (osCount[o] || 0) + 1;
        });
        const os = Object.entries(osCount)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({ name, value }));

        // Chart Data Generation based on Range
        // Grouping logic (Simplified for visual trend)
        const chartPoints = 20;
        const chartData = [];
        const step = (now - startTime) / chartPoints;

        for (let i = 0; i < chartPoints; i++) {
          const pointStart = new Date(startTime.getTime() + i * step);
          const pointEnd = new Date(pointStart.getTime() + step);
          const count = filteredData.filter(
            (d) => d.createdAt >= pointStart && d.createdAt < pointEnd
          ).length;
          chartData.push({
            name: i,
            value: count,
          });
        }

        setStats({
          total,
          desktop: total ? Math.round((desktopCount / total) * 100) : 0,
          mobile: total ? Math.round((mobileCount / total) * 100) : 0,
          topCountry,
          chartData,
          geo,
          source,
          os,
          windows: windowsCount,
          mac: macCount,
          android: androidCount,
          ios: iosCount,
        });
      },
      (error) => {
        console.error("Error fetching analytics:", error);
      }
    );
    return () => unsub();
  }, [timeRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="tactical-header text-xl">Overview</h1>
          <p className="text-zinc-600 text-[10px] font-mono uppercase">
            Real-time Metrics
          </p>
        </div>
        <div className="flex items-center gap-2 text-emerald-500 animate-pulse">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span className="text-[10px] uppercase font-bold tracking-widest">
            Live
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      {/* KPI Grid */}
      {/* Row 1: High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TacticalCard
          title="Total Views"
          value={stats.total}
          icon={<Eye size={20} className="text-blue-500" />}
          sub="Filtered Events"
        />
        <TacticalCard
          title="Desktop Users"
          value={`${stats.desktop}%`}
          icon={<Monitor size={20} className="text-emerald-500" />}
          sub="Workstations"
        />
        <TacticalCard
          title="Mobile Users"
          value={`${stats.mobile}%`}
          icon={<Smartphone size={20} className="text-amber-500" />}
          sub="Handhelds"
        />
        <TacticalCard
          title="Top Country"
          value={stats.topCountry}
          icon={<Globe size={20} className="text-rose-500" />}
          sub="Most Visits"
        />
      </div>

      {/* Row 2: Desktop OS Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TacticalCard
          title="Windows"
          value={stats.windows}
          icon={<Monitor size={20} className="text-blue-400" />}
          sub="PC Systems"
        />
        <TacticalCard
          title="MacOS"
          value={stats.mac}
          icon={<Monitor size={20} className="text-zinc-400" />}
          sub="Apple Computers"
        />
      </div>

      {/* Row 3: Mobile OS Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TacticalCard
          title="Android"
          value={stats.android}
          icon={<Smartphone size={20} className="text-emerald-400" />}
          sub="Google OS"
        />
        <TacticalCard
          title="iOS"
          value={stats.ios}
          icon={<Smartphone size={20} className="text-zinc-100" />}
          sub="Apple Mobile"
        />
      </div>

      {/* Main Chart */}
      <div className="tactical-card p-6 border-l-4 border-l-emerald-600 relative overflow-hidden">
        {/* Decorative BG */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Activity size={100} />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Radar size={14} className="text-emerald-500" /> Visitor Trend
          </h3>

          {/* Filter Controls */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-sm p-1">
            {["1h", "3h", "6h", "1d", "7d", "30d", "1y"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`
                            px-3 py-1 text-[10px] font-mono uppercase transition-colors
                            ${
                              timeRange === range
                                ? "bg-emerald-600 text-white font-bold"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                            }
                        `}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer>
            <AreaChart
              data={stats.chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />
              <XAxis dataKey="name" hide />
              <YAxis
                stroke="#52525b"
                fontSize={10}
                fontFamily="monospace"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "0px",
                  fontFamily: "monospace",
                }}
                itemStyle={{ color: "#10b981" }}
                formatter={(val) => [`${val} Signals`, "Activity"]}
                labelStyle={{ color: "#52525b" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#059669"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTraffic)"
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytics Drill-Down Grid */}
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
                  data={stats.os}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.os.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                  }}
                />
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
              <BarChart data={stats.geo} margin={{ left: 0, right: 0 }}>
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
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                  }}
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
                data={stats.source}
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
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                  }}
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

        {/* Info Panel */}
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

function TacticalCard({ title, value, icon, sub }) {
  return (
    <div className="tactical-card p-5 group hover:bg-zinc-900/50 transition-colors relative">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
          {icon}
        </div>
        {/* Decorative corner */}
        <div className="w-2 h-2 bg-zinc-800 group-hover:bg-emerald-500/50 transition-colors"></div>
      </div>

      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1 font-mono">
        {title}
      </p>
      <p className="text-2xl font-bold text-zinc-100 font-mono truncate tracking-tight">
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-zinc-600 mt-2 font-mono uppercase tracking-wider">
          {sub}
        </p>
      )}
    </div>
  );
}
