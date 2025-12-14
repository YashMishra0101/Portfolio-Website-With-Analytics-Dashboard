import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";
import { Users, Smartphone, Globe, Link } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";

export default function Summary() {
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unique: 0,
    mobile: 0,
    topCountry: "N/A",
  });

  useEffect(() => {
    const q = query(
      collection(db, "visits"),
      orderBy("timestamp", "desc"),
      limit(200)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setVisits(data);

      // Calc Stats
      const total = data.length;
      const unique = new Set(data.map((d) => d.visitorId)).size;
      const mobile = data.filter((d) =>
        ["Android", "iOS"].includes(d.os)
      ).length;

      // Top Country
      const countries = {};
      data.forEach((d) => {
        const c = d.country || "Unknown";
        countries[c] = (countries[c] || 0) + 1;
      });
      const topCountry =
        Object.entries(countries).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      setStats({ total, unique, mobile, topCountry });
    });
    return () => unsub();
  }, []);

  const chartData = Object.entries(
    visits.reduce((acc, v) => {
      const d = v.timestamp?.toDate
        ? v.timestamp.toDate().toLocaleDateString()
        : "Today";
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .reverse();

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-4 flex justify-between items-end">
        <div>
          <h1 className="tactical-header text-xl">System Overview</h1>
          <p className="text-zinc-600 text-[10px] font-mono uppercase">
            Live Metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Totals Views" value={stats.total} />
        <Card title="Unique Visitors" value={stats.unique} />
        <Card
          title="Mobile Ratio"
          value={`${
            stats.total ? Math.round((stats.mobile / stats.total) * 100) : 0
          }%`}
        />
        <Card title="Top Region" value={stats.topCountry} />
      </div>

      <div className="tactical-card p-6 border-l-4 border-l-emerald-600">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 font-mono">
          Visitor Trend
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "0px",
                  color: "#10b981",
                }}
                itemStyle={{ color: "#10b981" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#059669"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTraffic)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="tactical-card p-5 border-t-2 border-t-zinc-800 hover:border-t-emerald-600 transition-colors">
      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2 font-mono">
        {title}
      </p>
      <p className="text-2xl font-bold text-zinc-200 font-mono">{value}</p>
    </div>
  );
}
