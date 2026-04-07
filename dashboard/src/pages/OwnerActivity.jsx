import { useState, useEffect } from "react";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    limit,
    deleteDoc,
    doc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
    User,
    Smartphone,
    Monitor,
    Clock,
    MapPin,
    Globe,
    Trash2,
    Activity,
    Shield,
} from "lucide-react";

export default function OwnerActivity() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        mobile: 0,
        desktop: 0,
        today: 0,
    });

    useEffect(() => {
        const q = query(
            collection(db, "owner_activity"),
            orderBy("timestamp", "desc"),
            limit(100)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Calculate stats
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayCount = data.filter((d) => {
                if (d.timestamp?.toDate) {
                    return d.timestamp.toDate() >= today;
                }
                return false;
            }).length;

            const mobileCount = data.filter((d) => d.device === "Mobile").length;
            const desktopCount = data.filter((d) => d.device === "Desktop").length;

            setStats({
                total: data.length,
                mobile: mobileCount,
                desktop: desktopCount,
                today: todayCount,
            });

            setActivities(data);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const deleteActivity = async (id) => {
        if (window.confirm("Delete this activity record?")) {
            try {
                await deleteDoc(doc(db, "owner_activity", id));
            } catch (error) {
                console.error("Error deleting:", error);
            }
        }
    };

    const formatTime = (ts) => {
        if (!ts?.toDate) return "Unknown";
        const date = ts.toDate();
        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return `${day} ${month} ${year}, ${time}`;
    };

    const getTimeAgo = (timestamp) => {
        if (!timestamp?.toDate) return "";
        const now = new Date();
        const date = timestamp.toDate();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                        Owner Activity Audit
                    </h1>
                    <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mt-1">
                        Personal visit logs <span className="block md:inline text-[10px] md:text-xs opacity-70 md:opacity-100">(Excluded from public analytics)</span>
                    </p>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-violet-500 font-mono text-xl font-bold">
                        {stats.total}
                    </div>
                    <div className="text-zinc-600 text-[9px] uppercase tracking-widest">
                        Total Visits
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="tactical-card p-4 border-l-4 border-l-violet-500">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Activity size={14} />
                        <span className="text-[10px] uppercase tracking-wider font-bold">Today</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-zinc-100">
                        {stats.today}
                    </div>
                </div>

                <div className="tactical-card p-4 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Monitor size={14} />
                        <span className="text-[10px] uppercase tracking-wider font-bold">Desktop</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-zinc-100">
                        {stats.desktop}
                    </div>
                </div>

                <div className="tactical-card p-4 border-l-4 border-l-emerald-500">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Smartphone size={14} />
                        <span className="text-[10px] uppercase tracking-wider font-bold">Mobile</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-zinc-100">
                        {stats.mobile}
                    </div>
                </div>

                <div className="tactical-card p-4 border-l-4 border-l-amber-500">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Globe size={14} />
                        <span className="text-[10px] uppercase tracking-wider font-bold">All Time</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-zinc-100">
                        {stats.total}
                    </div>
                </div>
            </div>

            {/* Activity List */}
            <div className="tactical-card overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-2">
                        <User size={14} className="text-violet-500" />
                        Activity Log
                    </h3>
                    <span className="text-[10px] text-zinc-600 font-mono">
                        Last 100 entries
                    </span>
                </div>

                {activities.length === 0 ? (
                    <div className="p-8 text-center">
                        <Shield className="mx-auto text-zinc-700 mb-3" size={40} />
                        <p className="text-zinc-500 text-sm">No owner activity recorded yet</p>
                        <p className="text-zinc-600 text-xs mt-1">
                            Visit your portfolio from your devices to see activity here
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800/50">
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="p-4 hover:bg-zinc-900/50 transition-colors group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Date & Time */}
                                        <div className="flex items-center gap-1 text-sm text-zinc-300 mb-2">
                                            <Clock size={12} className="text-violet-500" />
                                            {formatTime(activity.timestamp)}
                                        </div>

                                        {/* Location & OS */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <MapPin size={10} />
                                                {activity.city}, {activity.country}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Globe size={10} />
                                                {activity.os}
                                            </span>
                                        </div>

                                        {/* Source (Referrer) */}
                                        <div className="mt-2 text-xs text-zinc-500">
                                            <span className="text-zinc-600">Source: </span>
                                            <span className="text-zinc-400">{activity.referrer || "Direct"}</span>
                                        </div>

                                        {/* IP & Page */}
                                        <div className="mt-2 text-[10px] text-zinc-600 font-mono">
                                            IP: {activity.ip} • Page: {activity.page || "/"}
                                        </div>
                                    </div>

                                    {/* Time ago */}
                                    <span className="text-[10px] text-zinc-600 font-mono">
                                        {getTimeAgo(activity.timestamp)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
