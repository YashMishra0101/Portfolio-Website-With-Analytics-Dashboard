import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  Save,
  User,
  Link as LinkIcon,
  FileText,
  Globe,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function ContentManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [content, setContent] = useState({
    name: "Yash.RK.Mishra",
    specialization: "Full Stack Developer",
    location: "Based in India",
    bio: "Full Stack Developer ready to build scalable web applications using the MERN Stack and TypeScript.",
    status: "Actively seeking new job opportunities",
    resumeUrl: "/resume.pdf",
    socials: {
      github: "https://github.com/YashMishra0101",
      linkedin: "https://www.linkedin.com/in/yash-mishra-356280223/",
      twitter: "https://x.com/YashRKMishra1",
      email: "yashrkm0011@gmail.com",
    },
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "portfolio", "config"), (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data());
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await setDoc(doc(db, "portfolio", "config"), content);
      setMessage({
        type: "success",
        text: "Configuration beamed to main hub successfully.",
      });
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: "Transmission failed. Secure link compromised.",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    }
  };

  const updateField = (field, value) => {
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const updateSocial = (platform, value) => {
    setContent((prev) => ({
      ...prev,
      socials: { ...prev.socials, [platform]: value },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-emerald-500 font-mono animate-pulse uppercase text-xs tracking-widest">
        Syncing with Portfolio Hub...
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="tactical-header text-xl">Content Infrastructure</h1>
        <p className="text-zinc-600 text-[10px] font-mono uppercase mt-1">
          Manage Live Portfolio Identity
        </p>
      </div>

      {message.text && (
        <div
          className={`p-4 border font-mono text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            message.type === "success"
              ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-500"
              : "bg-red-950/20 border-red-900/50 text-red-500"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Identity Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs uppercase tracking-widest border-l-2 border-emerald-600 pl-3">
            <User size={14} /> Identity Core
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                Full Name
              </label>
              <input
                type="text"
                className="tactical-input"
                value={content.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                Specialization
              </label>
              <input
                type="text"
                className="tactical-input"
                value={content.specialization}
                onChange={(e) => updateField("specialization", e.target.value)}
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                Availability Status
              </label>
              <input
                type="text"
                className="tactical-input"
                value={content.status}
                onChange={(e) => updateField("status", e.target.value)}
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                Biography
              </label>
              <textarea
                rows={3}
                className="tactical-input resize-none"
                value={content.bio}
                onChange={(e) => updateField("bio", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                Location String
              </label>
              <input
                type="text"
                className="tactical-input"
                value={content.location}
                onChange={(e) => updateField("location", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                Resume Resource URL
              </label>
              <input
                type="text"
                className="tactical-input"
                value={content.resumeUrl}
                onChange={(e) => updateField("resumeUrl", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Social Connects Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs uppercase tracking-widest border-l-2 border-blue-600 pl-3">
            <LinkIcon size={14} /> Uplink Channels
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                GitHub
              </label>
              <input
                type="text"
                className="tactical-input"
                value={content.socials.github}
                onChange={(e) => updateSocial("github", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                LinkedIn
              </label>
              <input
                type="text"
                className="tactical-input"
                value={content.socials.linkedin}
                onChange={(e) => updateSocial("linkedin", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                Twitter (X)
              </label>
              <input
                type="text"
                className="tactical-input"
                value={content.socials.twitter}
                onChange={(e) => updateSocial("twitter", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                Admin Email
              </label>
              <input
                type="email"
                className="tactical-input"
                value={content.socials.email}
                onChange={(e) => updateSocial("email", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Action Bar */}
        <div className="flex justify-end pt-6 border-t border-zinc-900">
          <button
            type="submit"
            disabled={saving}
            className="btn-tactical flex items-center gap-2 px-10 group"
          >
            <Save
              size={16}
              className={
                saving
                  ? "animate-spin"
                  : "group-hover:scale-110 transition-transform"
              }
            />
            {saving ? "TRANSMITTING..." : "SAVE CONFIGURATION"}
          </button>
        </div>
      </form>

      {/* Footer Info */}
      <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-sm flex items-start gap-3">
        <AlertCircle size={18} className="text-zinc-600 shrink-0 mt-0.5" />
        <p className="text-[9px] text-zinc-600 font-mono leading-relaxed">
          WARNING: SYSTEM IDENTITY UPDATES ARE DEPLOYED IMMEDIATELY ACROSS ALL
          ACTIVE PORTFOLIO NODES. ENSURE ALL RESOURCE URLS ARE ACCESSIBLE TO
          EXTERNAL TRAFFIC.
        </p>
      </div>
    </div>
  );
}
