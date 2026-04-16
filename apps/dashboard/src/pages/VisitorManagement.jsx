import { useState, useEffect, useMemo } from "react";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    deleteDoc,
    doc,
    writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { tsToDate, formatTimestamp } from "../utils/timestamp";
import {
    Trash2,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Shield,
    Filter,
    Calendar,
    Globe,
    Monitor,
    Link2,
    ChevronDown,
    RotateCcw,
} from "lucide-react";

export default function VisitorManagement() {
    const [visits, setVisits] = useState([]);
    const [selectedVisitors, setSelectedVisitors] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteResult, setDeleteResult] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [bulkConfirm, setBulkConfirm] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        dateRange: "all",
        startDate: "",
        endDate: "",
        country: "all",
        os: "all",
        source: "all",
        ip: "",
    });

    useEffect(() => {
        const q = query(collection(db, "visits"), orderBy("timestamp", "desc"));
        const unsub = onSnapshot(
            q,
            (snapshot) => {
                const data = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
                data.sort((a, b) => {
                    const timeA = tsToDate(a.timestamp, new Date(0)).getTime();
                    const timeB = tsToDate(b.timestamp, new Date(0)).getTime();
                    return timeB - timeA;
                });
                setVisits(data);
            },
            (error) => {
                console.error("Error fetching visitors:", error);
            }
        );
        return () => unsub();
    }, []);

    const filterOptions = useMemo(() => {
        const countries = [...new Set(visits.map((v) => v.country).filter(Boolean))].sort();
        const osList = [...new Set(visits.map((v) => v.os).filter(Boolean))].sort();
        const sources = [...new Set(visits.map((v) => v.referrer || "Direct").filter(Boolean))].sort();
        return { countries, osList, sources };
    }, [visits]);

    const filteredVisits = useMemo(() => {
        return visits.filter((v) => {
            if (filters.dateRange !== "all") {
                const visitDate = tsToDate(v.timestamp, null);
                if (!visitDate) return true; // can't filter, include
                const now = new Date();
                if (filters.dateRange === "today") {
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    if (visitDate < todayStart) return false;
                } else if (filters.dateRange === "week") {
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (visitDate < weekAgo) return false;
                } else if (filters.dateRange === "month") {
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    if (visitDate < monthAgo) return false;
                } else if (filters.dateRange === "custom") {
                    if (filters.startDate) {
                        const start = new Date(filters.startDate);
                        if (visitDate < start) return false;
                    }
                    if (filters.endDate) {
                        const end = new Date(filters.endDate);
                        end.setHours(23, 59, 59, 999);
                        if (visitDate > end) return false;
                    }
                }
            }
            if (filters.country !== "all" && v.country !== filters.country) return false;
            if (filters.os !== "all" && v.os !== filters.os) return false;
            if (filters.source !== "all") {
                const visitorSource = v.referrer || "Direct";
                if (visitorSource !== filters.source) return false;
            }
            if (filters.ip && !v.ip?.toLowerCase().includes(filters.ip.toLowerCase())) return false;
            return true;
        });
    }, [visits, filters]);

    const resetFilters = () => {
        setFilters({ dateRange: "all", startDate: "", endDate: "", country: "all", os: "all", source: "all", ip: "" });
    };

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.dateRange !== "all") count++;
        if (filters.country !== "all") count++;
        if (filters.os !== "all") count++;
        if (filters.source !== "all") count++;
        if (filters.ip) count++;
        return count;
    }, [filters]);




    const handleDeleteSingle = async (visitorId) => {
        setIsDeleting(true);
        setDeleteResult(null);
        try {
            await deleteDoc(doc(db, "visits", visitorId));
            setDeleteResult({ success: true, message: "Visitor deleted successfully" });
            setConfirmDelete(null);
            setSelectedVisitors((prev) => prev.filter((id) => id !== visitorId));
        } catch (error) {
            setDeleteResult({ success: false, message: "Failed to delete visitor" });
        } finally {
            setIsDeleting(false);
            setTimeout(() => setDeleteResult(null), 3000);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedVisitors.length === 0) return;
        setIsDeleting(true);
        setDeleteResult(null);
        try {
            const batch = writeBatch(db);
            selectedVisitors.forEach((visitorId) => batch.delete(doc(db, "visits", visitorId)));
            await batch.commit();
            setDeleteResult({ success: true, message: `${selectedVisitors.length} visitor(s) deleted` });
            setSelectedVisitors([]);
            setBulkConfirm(false);
        } catch (error) {
            setDeleteResult({ success: false, message: "Failed to delete visitors" });
        } finally {
            setIsDeleting(false);
            setTimeout(() => setDeleteResult(null), 3000);
        }
    };

    const toggleSelectVisitor = (visitorId) => {
        setSelectedVisitors((prev) =>
            prev.includes(visitorId) ? prev.filter((id) => id !== visitorId) : [...prev, visitorId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedVisitors.length === filteredVisits.length) {
            setSelectedVisitors([]);
        } else {
            setSelectedVisitors(filteredVisits.map((v) => v.id));
        }
    };

    return (
        <div className="space-y-2.5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 pb-1">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="tactical-header text-sm md:text-base tracking-normal md:tracking-widest">Visitor Management</h1>
                        <span className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-mono">
                            Total Visitors: <span className="text-zinc-200 font-bold">{visits.length}</span>
                        </span>
                    </div>
                    <p className="text-zinc-600 text-[9px] font-mono uppercase">Admin Only - Delete Visitors</p>
                </div>
                <div className="flex gap-1.5 items-center flex-wrap">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex gap-1 items-center px-2 py-1 border text-[9px] font-bold uppercase tracking-widest transition-all ${showFilters || activeFiltersCount > 0
                            ? "bg-amber-900/20 border-amber-500/50 text-amber-400"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                            }`}
                    >
                        <Filter size={10} />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="px-1 py-0.5 bg-amber-500 text-black text-[7px] font-bold">{activeFiltersCount}</span>
                        )}
                        <ChevronDown size={10} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
                    </button>
                    <div className="flex gap-1 items-center px-1.5 py-0.5 bg-red-900/10 border border-red-900/30 text-red-500 text-[9px] font-bold uppercase tracking-widest">
                        <Shield size={10} />
                        Admin
                    </div>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="p-3 bg-zinc-900/50 border border-zinc-800 text-[10px]">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1">
                            <Filter size={10} /> Filter Visitors
                        </h3>
                        <button onClick={resetFilters} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300">
                            <RotateCcw size={10} /> Reset
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        <div>
                            <label className="flex items-center gap-1 text-zinc-500 uppercase tracking-widest mb-1">
                                <Calendar size={8} /> Date
                            </label>
                            <select
                                value={filters.dateRange}
                                onChange={(e) => setFilters((prev) => ({ ...prev, dateRange: e.target.value }))}
                                className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-mono focus:border-amber-500/50 focus:outline-none"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        {filters.dateRange === "custom" && (
                            <>
                                <div>
                                    <label className="text-zinc-500 uppercase tracking-widest mb-1 block">Start</label>
                                    <input type="date" value={filters.startDate} onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-mono focus:border-amber-500/50 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="text-zinc-500 uppercase tracking-widest mb-1 block">End</label>
                                    <input type="date" value={filters.endDate} onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-mono focus:border-amber-500/50 focus:outline-none" />
                                </div>
                            </>
                        )}
                        <div>
                            <label className="flex items-center gap-1 text-zinc-500 uppercase tracking-widest mb-1">
                                <Globe size={8} /> Country
                            </label>
                            <select value={filters.country} onChange={(e) => setFilters((prev) => ({ ...prev, country: e.target.value }))}
                                className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-mono focus:border-amber-500/50 focus:outline-none">
                                <option value="all">All</option>
                                {filterOptions.countries.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="flex items-center gap-1 text-zinc-500 uppercase tracking-widest mb-1">
                                <Monitor size={8} /> OS
                            </label>
                            <select value={filters.os} onChange={(e) => setFilters((prev) => ({ ...prev, os: e.target.value }))}
                                className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-mono focus:border-amber-500/50 focus:outline-none">
                                <option value="all">All</option>
                                {filterOptions.osList.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="flex items-center gap-1 text-zinc-500 uppercase tracking-widest mb-1">
                                <Link2 size={8} /> Source
                            </label>
                            <select value={filters.source} onChange={(e) => setFilters((prev) => ({ ...prev, source: e.target.value }))}
                                className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-mono focus:border-amber-500/50 focus:outline-none">
                                <option value="all">All</option>
                                {filterOptions.sources.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-zinc-500 uppercase tracking-widest mb-1 block">IP Search</label>
                            <input type="text" value={filters.ip} onChange={(e) => setFilters((prev) => ({ ...prev, ip: e.target.value }))}
                                placeholder="192.168..." className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-mono focus:border-amber-500/50 focus:outline-none placeholder:text-zinc-700" />
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between">
                        <p className="text-zinc-500 font-mono">
                            Showing <span className="text-amber-400 font-bold">{filteredVisits.length}</span> of {visits.length}
                        </p>
                    </div>
                </div>
            )}

            {/* Result Notification */}
            {deleteResult && (
                <div className={`p-2 border flex items-center gap-2 text-[11px] ${deleteResult.success ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400" : "bg-red-900/20 border-red-500/30 text-red-400"}`}>
                    {deleteResult.success ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                    <span className="font-mono">{deleteResult.message}</span>
                </div>
            )}

            {/* Bulk Actions */}
            {selectedVisitors.length > 0 && (
                <div className="p-2 bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 text-[11px] font-bold">{selectedVisitors.length}</span>
                        <span className="text-zinc-300 text-[11px] font-mono">selected</span>
                    </div>
                    <div className="flex gap-1.5">
                        <button onClick={() => setSelectedVisitors([])} className="px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[9px] font-bold uppercase">Clear</button>
                        <button onClick={() => setBulkConfirm(true)} disabled={isDeleting} className="px-2 py-1 bg-red-900/30 border border-red-500/50 text-red-400 text-[9px] font-bold uppercase flex items-center gap-1">
                            <Trash2 size={10} /> Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk Delete Modal */}
            {bulkConfirm && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-red-500/50 p-4 max-w-sm w-full">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="text-red-500" size={20} />
                            <div>
                                <h3 className="text-sm font-bold text-zinc-100 uppercase">Confirm Delete</h3>
                                <p className="text-zinc-500 text-[10px] font-mono">Cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-zinc-300 text-[11px] mb-4">Delete <span className="text-red-400 font-bold">{selectedVisitors.length}</span> visitor(s)?</p>
                        <div className="flex gap-2">
                            <button onClick={() => setBulkConfirm(false)} className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase">Cancel</button>
                            <button onClick={handleBulkDelete} disabled={isDeleting} className="flex-1 px-3 py-2 bg-red-600 border border-red-500 text-white text-[10px] font-bold uppercase flex items-center justify-center gap-1">
                                {isDeleting ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                {isDeleting ? "..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Single Delete Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-red-500/50 p-4 max-w-sm w-full">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="text-red-500" size={20} />
                            <div>
                                <h3 className="text-sm font-bold text-zinc-100 uppercase">Confirm Delete</h3>
                                <p className="text-zinc-500 text-[10px] font-mono">Cannot be undone</p>
                            </div>
                        </div>
                        <div className="bg-zinc-950 border border-zinc-800 p-2 mb-3 text-[11px]">
                            <p className="text-zinc-300 font-mono">IP: {confirmDelete.ip}</p>
                            <p className="text-zinc-400">{confirmDelete.city}, {confirmDelete.country}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase">Cancel</button>
                            <button onClick={() => handleDeleteSingle(confirmDelete.id)} disabled={isDeleting} className="flex-1 px-3 py-2 bg-red-600 border border-red-500 text-white text-[10px] font-bold uppercase flex items-center justify-center gap-1">
                                {isDeleting ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                {isDeleting ? "..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {/* Visitor Cards */}
            <div className="space-y-2">
                {filteredVisits.map((v) => (
                    <div
                        key={v.id}
                        className={`tactical-card px-3 py-2.5 border-l-2 transition-colors ${selectedVisitors.includes(v.id) ? "border-l-amber-500 bg-amber-500/5" : "border-l-emerald-700 hover:border-l-emerald-500"
                            }`}
                    >
                        {/* Row 1: Checkbox + Delete + Date-Time | Location | IP Address */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                            {/* Date-Time with controls */}
                            <div className="flex items-start gap-2">
                                <button
                                    onClick={() => toggleSelectVisitor(v.id)}
                                    className={`w-4 h-4 border flex items-center justify-center shrink-0 mt-0.5 ${selectedVisitors.includes(v.id) ? "bg-amber-500 border-amber-500" : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                                        }`}
                                >
                                    {selectedVisitors.includes(v.id) && <CheckCircle size={10} className="text-black" />}
                                </button>
                                <button
                                    onClick={() => setConfirmDelete(v)}
                                    className="p-1 bg-red-900/20 border border-red-900/50 text-red-500 hover:bg-red-900/40 shrink-0"
                                >
                                    <Trash2 size={10} />
                                </button>
                                <div>
                                    <p className="text-zinc-600 text-[9px] uppercase tracking-widest mb-0.5">Date & Time</p>
                                    <p className="text-zinc-400 text-[11px] font-mono">{formatTimestamp(v.timestamp)}</p>
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <p className="text-zinc-600 text-[9px] uppercase tracking-widest mb-0.5">Location</p>
                                <p className="text-zinc-300 text-[11px]">{v.city}, {v.country}</p>
                            </div>

                            {/* IP Address */}
                            <div>
                                <p className="text-zinc-600 text-[9px] uppercase tracking-widest mb-0.5">IP Address</p>
                                <div className="flex items-center gap-1">
                                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
                                    <span className="text-emerald-400 text-[11px] font-mono font-semibold">{v.ip}</span>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Platform | Source | Visitor ID */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-800/40">
                            <div>
                                <p className="text-zinc-600 text-[9px] uppercase tracking-widest mb-0.5">Platform</p>
                                <p className="text-zinc-300 text-[11px] font-mono">{v.os}</p>
                            </div>
                            <div>
                                <p className="text-zinc-600 text-[9px] uppercase tracking-widest mb-0.5">Source</p>
                                <p className="text-zinc-400 text-[11px] break-all">{v.referrer || "Direct"}</p>
                            </div>
                            <div>
                                <p className="text-zinc-600 text-[9px] uppercase tracking-widest mb-0.5">Visitor ID</p>
                                <p className="text-zinc-500 text-[10px] font-mono break-all">{v.visitorId}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredVisits.length === 0 && (
                <div className="tactical-card p-5 text-center">
                    <p className="text-zinc-500 text-[11px] font-mono">
                        {visits.length === 0 ? "No visitor records found" : "No visitors match filters"}
                    </p>
                    {activeFiltersCount > 0 && (
                        <button onClick={resetFilters} className="mt-2 px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[9px] font-bold uppercase">
                            Clear Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
