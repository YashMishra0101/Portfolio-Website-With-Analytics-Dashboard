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
import {
  Monitor,
  Smartphone,
  Globe,
  Activity,
  Map as MapIcon,
  TrendingUp,
} from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Sphere,
  Graticule,
} from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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

  // Independent graph filter - default to 3 months
  const [graphFilter, setGraphFilter] = useState("3months");

  // Graph filter options
  const graphFilterOptions = [
    { value: "all", label: "All Time" },
    { value: "24h", label: "24 Hours" },
    { value: "7d", label: "7 Days" },
    { value: "15d", label: "15 Days" },
    { value: "30d", label: "30 Days" },
    { value: "3months", label: "3 Months" },
    { value: "6months", label: "6 Months" },
    { value: "1year", label: "1 Year" },
  ];

  // Helper to filter data by time range
  const filterByTimeRange = (visits, range) => {
    if (range === "all") return visits;

    const now = new Date();
    let cutoffDate;

    switch (range) {
      case "24h":
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "15d":
        cutoffDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3months":
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "6months":
        cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case "1year":
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return visits;
    }

    return visits.filter(v => {
      if (!v.timestamp?.toDate) return false;
      return v.timestamp.toDate() >= cutoffDate;
    });
  };

  // Helper to generate trend data grouped by date
  const generateTrendData = (visits, range) => {
    const filteredVisits = filterByTimeRange(visits, range);

    if (filteredVisits.length === 0) return [];

    // Group visits by date
    const dateGroups = {};
    filteredVisits.forEach(v => {
      if (!v.timestamp?.toDate) return;
      const date = v.timestamp.toDate();
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateGroups[dateKey] = (dateGroups[dateKey] || 0) + 1;
    });

    // Convert to array and sort by date
    const trendData = Object.entries(dateGroups)
      .map(([name, value]) => ({ name, value }))
      .slice(-20); // Show last 20 data points

    return trendData;
  };

  // Store raw visits for graph filtering
  const [rawVisits, setRawVisits] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "visits"),
      orderBy("timestamp", "desc"),
      limit(500)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const raw = snapshot.docs.map((doc) => doc.data());
      setRawVisits(raw);

      const countries = {};
      raw.forEach((d) => {
        const c = d.country || "Unknown";
        countries[c] = (countries[c] || 0) + 1;
      });
      const geo = Object.entries(countries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }));

      const sources = {};
      raw.forEach((d) => {
        let r = d.referrer || "Direct";
        if (r.includes("http"))
          try {
            r = new URL(r).hostname.replace("www.", "");
          } catch (e) { }
        sources[r] = (sources[r] || 0) + 1;
      });
      const source = Object.entries(sources)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

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

      // Generate trend data based on current filter
      const trend = generateTrendData(raw, graphFilter);

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
  }, [graphFilter]);

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
      <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="tactical-header text-2xl">Testing & Simulation</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="tactical-card p-6 border-l-4 border-l-blue-500 bg-zinc-950/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <MapIcon size={120} />
        </div>
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-2">
              <Globe size={14} className="text-blue-500 animate-spin-slow" />{" "}
              Global Activity Radar
            </h3>
            <p className="text-[10px] text-zinc-600 font-mono mt-1">
              Satellite Visualization
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span>Live Intercepts</span>
          </div>
        </div>

        <div className="h-[400px] w-full bg-zinc-900/40 border border-zinc-800/50 rounded-sm relative overflow-hidden">
          <ComposableMap
            projectionConfig={{
              rotate: [-10, 0, 0],
              scale: 147,
            }}
            className="w-full h-full"
          >
            <Sphere stroke="#27272a" strokeWidth={0.5} />
            <Graticule stroke="#27272a" strokeWidth={0.5} />
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#18181b"
                    stroke="#27272a"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "#1f1f23", outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>
            {data.geo.map((country, i) => {
              const coordsMap = {
                India: [78.9629, 20.5937],
                USA: [-95.7129, 37.0902],
                Germany: [10.4515, 51.1657],
                UK: [-3.436, 55.3781],
                France: [2.2137, 46.2276],
                Canada: [-106.3468, 56.1304],
                Australia: [133.7751, -25.2744],
                Brazil: [-51.9253, -14.235],
                China: [104.1954, 35.8617],
              };
              const coords = coordsMap[country.name];
              if (!coords) return null;

              return (
                <Marker key={country.name} coordinates={coords}>
                  <circle
                    r={2 + Math.sqrt(country.value)}
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <circle r={1} fill="#fff" />
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <text
                      textAnchor="middle"
                      y={-10}
                      style={{
                        fontFamily: "monospace",
                        fill: "#71717a",
                        fontSize: "8px",
                      }}
                    >
                      {country.name}
                    </text>
                  </g>
                </Marker>
              );
            })}
          </ComposableMap>

          <div className="absolute bottom-4 left-4 flex flex-col gap-1">
            {data.geo.slice(0, 3).map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 px-2 py-1 rounded-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-tighter">
                  {c.name}: {c.value} SIGS
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visitor Trend Graph with Independent Filter */}
      <div className="tactical-card p-6 border-l-4 border-l-emerald-500 bg-zinc-950/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-500" /> Visitor Trend
            </h3>
            <p className="text-[10px] text-zinc-600 font-mono mt-1">
              Traffic pattern over time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Time Range:</span>
            <select
              value={graphFilter}
              onChange={(e) => setGraphFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-mono rounded px-3 py-1.5 focus:outline-none focus:border-emerald-500 hover:border-zinc-600 transition-colors cursor-pointer"
            >
              {graphFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="h-[280px]">
          {data.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ stroke: "#10b981", strokeWidth: 1 }} content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#trendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
              <Activity size={32} className="mb-2 opacity-30" />
              <p className="text-xs font-mono">No data available for selected time range</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="tactical-card p-6 lg:col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-2">
              <Monitor size={14} className="text-blue-500" /> Operating Systems
            </h3>
          </div>
          <div className="flex-1 min-h-[320px] relative">
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
                  height={70}
                  iconType="rect"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => (
                    <span className="text-[10px] font-mono text-zinc-500 uppercase ml-1">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-16">
              <span className="text-xs font-mono text-zinc-600 uppercase">
                Systems
              </span>
            </div>
          </div>
        </div>

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
