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
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Analytics() {
  const [geoData, setGeoData] = useState([]);
  const [sourceData, setSourceData] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "visits"),
      orderBy("timestamp", "desc"),
      limit(300)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());

      // Geo
      const countries = {};
      data.forEach((d) => {
        const c = d.country || "Unknown";
        countries[c] = (countries[c] || 0) + 1;
      });
      setGeoData(
        Object.entries(countries)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, value]) => ({ name, value }))
      );

      // Source
      const sources = {};
      data.forEach((d) => {
        let r = d.referrer || "Direct";
        if (r.includes("http"))
          try {
            r = new URL(r).hostname;
          } catch (e) {}
        sources[r] = (sources[r] || 0) + 1;
      });
      setSourceData(
        Object.entries(sources)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, value]) => ({ name, value }))
      );
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="tactical-header text-xl">Analytics</h1>
        <p className="text-zinc-600 text-[10px] font-mono uppercase">
          Deep Dive Metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="tactical-card p-6">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 font-mono">
            Top Regions
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer>
              <BarChart data={geoData} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  stroke="#52525b"
                  fontSize={10}
                  fontFamily="monospace"
                />
                <Tooltip
                  cursor={{ fill: "#27272a" }}
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "0",
                    fontFamily: "monospace",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#059669"
                  radius={[0, 0, 0, 0]}
                  barSize={10}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="tactical-card p-6">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 font-mono">
            Traffic Sources
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={sourceData}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {sourceData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "0",
                    fontFamily: "monospace",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4">
              {sourceData.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-[10px] font-mono uppercase text-zinc-500"
                >
                  <div
                    className="w-2 h-2 rounded-none"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  ></div>
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
