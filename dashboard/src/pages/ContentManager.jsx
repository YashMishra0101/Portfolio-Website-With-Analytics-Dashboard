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
  Briefcase,
  Code,
  Plus,
  Trash2,
  ImageOff,
} from "lucide-react";
import { useAuth } from "../context/AuthProvider";

export default function ContentManager() {
  const { role } = useAuth();
  const isReadOnly = role === "viewer";
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
    resumeAvailable: false,
    socials: {
      github: "https://github.com/YashMishra0101",
      linkedin: "https://www.linkedin.com/in/yash-mishra-356280223/",
      twitter: "https://x.com/YashRKMishra1",
      email: "yashrkm0011@gmail.com",
    },
    experience: [
      {
        role: "Full Stack Intern",
        company: "Sky Mentor Technology",
        location: "Nagpur, India",
        duration: "3 months",
        type: "In Office"
      },
      {
        role: "Full Stack Intern",
        company: "Coladco",
        location: "Delhi, Faridabad, India",
        duration: "3 months",
        type: "Remote"
      },
      {
        role: "Freelancer",
        company: "Self-Employed",
        location: "Work From Home, India",
        duration: "3 months",
        type: "Remote"
      }
    ],
    projects: [
      {
        title: "Major Project in Progress",
        status: "In Development",
        description: "",
        tech: [],
        link: null
      }
    ]
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "portfolio", "config"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure experience and projects arrays exist
        setContent({
          ...data,
          experience: data.experience || [],
          projects: data.projects || []
        });
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

  // Experience CRUD
  const addExperience = () => {
    setContent((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { role: "", company: "", location: "", duration: "", type: "Remote" }
      ]
    }));
  };

  const updateExperience = (index, field, value) => {
    setContent((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (index) => {
    setContent((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  // Projects CRUD
  const addProject = () => {
    setContent((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        { title: "", status: "In Development", description: "", tech: [], link: null }
      ]
    }));
  };

  const updateProject = (index, field, value) => {
    setContent((prev) => ({
      ...prev,
      projects: prev.projects.map((proj, i) =>
        i === index ? { ...proj, [field]: value } : proj
      )
    }));
  };

  const removeProject = (index) => {
    setContent((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
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

      {/* Firebase Free Plan Notice */}
      <div className="p-4 bg-amber-950/20 border border-amber-900/50 rounded-sm flex items-start gap-3">
        <ImageOff size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-amber-400 font-mono font-bold uppercase">
            Image/Icon Upload - Read Only Mode
          </p>
          <p className="text-[10px] text-amber-500/80 font-mono leading-relaxed mt-1">
            Image and icon uploads are currently disabled due to Firebase free plan limitations.
            Profile pictures and tech stack icons are managed via code. Full image upload
            functionality will be available after upgrading to a paid Firebase plan (Blaze).
          </p>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 border font-mono text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === "success"
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
                readOnly={isReadOnly}
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
                readOnly={isReadOnly}
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
                readOnly={isReadOnly}
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
                readOnly={isReadOnly}
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
                readOnly={isReadOnly}
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
                readOnly={isReadOnly}
                className="tactical-input"
                value={content.resumeUrl}
                onChange={(e) => updateField("resumeUrl", e.target.value)}
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono flex items-center gap-2">
                Resume Available
                <span className="text-zinc-600 normal-case font-normal">
                  (Toggle to show/hide "Not Available" message)
                </span>
              </label>
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => updateField("resumeAvailable", !content.resumeAvailable)}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border transition-all ${content.resumeAvailable
                  ? "bg-emerald-950/30 border-emerald-700 text-emerald-500"
                  : "bg-red-950/30 border-red-700 text-red-500"
                  } ${isReadOnly ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
              >
                {content.resumeAvailable ? "✓ Resume Available" : "✗ Resume Not Available"}
              </button>
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
                readOnly={isReadOnly}
                className="tactical-input"
                value={content.socials?.github || ""}
                onChange={(e) => updateSocial("github", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                LinkedIn
              </label>
              <input
                type="text"
                readOnly={isReadOnly}
                className="tactical-input"
                value={content.socials?.linkedin || ""}
                onChange={(e) => updateSocial("linkedin", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                Twitter (X)
              </label>
              <input
                type="text"
                readOnly={isReadOnly}
                className="tactical-input"
                value={content.socials?.twitter || ""}
                onChange={(e) => updateSocial("twitter", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                Email
              </label>
              <input
                type="email"
                readOnly={isReadOnly}
                className="tactical-input"
                value={content.socials?.email || ""}
                onChange={(e) => updateSocial("email", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs uppercase tracking-widest border-l-2 border-purple-600 pl-3">
              <Briefcase size={14} /> Experience Records
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={addExperience}
                className="flex items-center gap-1 px-3 py-1 bg-purple-950/30 border border-purple-700 text-purple-400 text-xs font-mono uppercase hover:bg-purple-900/40 transition-colors"
              >
                <Plus size={12} /> Add
              </button>
            )}
          </div>

          <div className="space-y-4">
            {content.experience?.map((exp, index) => (
              <div key={index} className="p-4 border border-zinc-800 bg-zinc-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase">
                    Experience #{index + 1}
                  </span>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="p-1 text-red-500 hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">Role</label>
                    <input
                      type="text"
                      readOnly={isReadOnly}
                      className="tactical-input"
                      value={exp.role}
                      onChange={(e) => updateExperience(index, "role", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">Company</label>
                    <input
                      type="text"
                      readOnly={isReadOnly}
                      className="tactical-input"
                      value={exp.company}
                      onChange={(e) => updateExperience(index, "company", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">Location</label>
                    <input
                      type="text"
                      readOnly={isReadOnly}
                      className="tactical-input"
                      value={exp.location}
                      onChange={(e) => updateExperience(index, "location", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">Duration</label>
                    <input
                      type="text"
                      readOnly={isReadOnly}
                      className="tactical-input"
                      value={exp.duration}
                      onChange={(e) => updateExperience(index, "duration", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">Type</label>
                    <select
                      disabled={isReadOnly}
                      className="tactical-input"
                      value={exp.type}
                      onChange={(e) => updateExperience(index, "type", e.target.value)}
                    >
                      <option value="Remote">Remote</option>
                      <option value="In Office">In Office</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs uppercase tracking-widest border-l-2 border-cyan-600 pl-3">
              <Code size={14} /> Project Registry
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={addProject}
                className="flex items-center gap-1 px-3 py-1 bg-cyan-950/30 border border-cyan-700 text-cyan-400 text-xs font-mono uppercase hover:bg-cyan-900/40 transition-colors"
              >
                <Plus size={12} /> Add
              </button>
            )}
          </div>

          <div className="space-y-4">
            {content.projects?.map((proj, index) => (
              <div key={index} className="p-4 border border-zinc-800 bg-zinc-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase">
                    Project #{index + 1}
                  </span>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => removeProject(index)}
                      className="p-1 text-red-500 hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">Title</label>
                    <input
                      type="text"
                      readOnly={isReadOnly}
                      className="tactical-input"
                      value={proj.title}
                      onChange={(e) => updateProject(index, "title", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">Status</label>
                    <select
                      disabled={isReadOnly}
                      className="tactical-input"
                      value={proj.status}
                      onChange={(e) => updateProject(index, "status", e.target.value)}
                    >
                      <option value="In Development">In Development</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Planning">Planning</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      readOnly={isReadOnly}
                      className="tactical-input resize-none"
                      value={proj.description || ""}
                      onChange={(e) => updateProject(index, "description", e.target.value)}
                      placeholder="Leave empty to hide on frontend"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                      Project Link (Optional)
                    </label>
                    <input
                      type="text"
                      readOnly={isReadOnly}
                      className="tactical-input"
                      value={proj.link || ""}
                      onChange={(e) => updateProject(index, "link", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                      Tech Stack (Comma separated)
                    </label>
                    <input
                      type="text"
                      readOnly={isReadOnly}
                      className="tactical-input"
                      value={proj.tech?.join(", ") || ""}
                      onChange={(e) => updateProject(index, "tech", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                      placeholder="React, Node.js, MongoDB"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Read-Only Mode Notice for Images */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs uppercase tracking-widest border-l-2 border-zinc-600 pl-3">
            <ImageOff size={14} /> Media Assets (Read Only)
          </div>
          <div className="p-4 border border-zinc-800 bg-zinc-900/30 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                  Profile Picture
                </label>
                <input
                  type="text"
                  readOnly
                  className="tactical-input opacity-50 cursor-not-allowed"
                  value="/profile.jpg"
                  placeholder="Managed via code"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                  Tech Stack Icons
                </label>
                <input
                  type="text"
                  readOnly
                  className="tactical-input opacity-50 cursor-not-allowed"
                  value="15 icons configured"
                  placeholder="Managed via code"
                />
              </div>
            </div>
            <p className="text-[9px] text-zinc-600 font-mono">
              * These fields are read-only. Upgrade to Firebase Blaze plan to enable image uploads.
            </p>
          </div>
        </section>

        {/* Action Bar */}
        <div className="flex justify-end pt-6 border-t border-zinc-900">
          <button
            type="submit"
            disabled={saving || isReadOnly}
            className={`btn-tactical flex items-center gap-2 px-10 group ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            <Save
              size={16}
              className={
                saving
                  ? "animate-spin"
                  : "group-hover:scale-110 transition-transform"
              }
            />
            {saving
              ? "TRANSMITTING..."
              : isReadOnly
                ? "READ ONLY MODE"
                : "SAVE CONFIGURATION"}
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
