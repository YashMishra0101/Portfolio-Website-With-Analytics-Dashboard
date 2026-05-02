import { useState, useEffect, useMemo } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  Save, User, Link as LinkIcon, AlertCircle, CheckCircle,
  Briefcase, Code, Plus, Trash2, ImageOff, ArrowUp, ArrowDown,
  Eye, EyeOff, Settings, GitFork, Lock, Tag, Type, GitBranch,
} from "lucide-react";

const CONTENT_DOC_COLLECTION = "portfolio";
const CONTENT_DOC_ID = "config";

// ─── Canonical default shape (must mirror App.jsx DEFAULT_CONFIG) ─────────────
const DEFAULT_CONTENT = {
  // Identity
  name: "Yash.RK.Mishra",
  specialization: "Full Stack Developer",
  location: "Based in India",
  bio: "Full Stack Developer ready to build scalable web applications using the MERN Stack and TypeScript.",
  bioHighlightKeywords: "MERN Stack,TypeScript",
  status: "Actively seeking new job opportunities",
  tagline: "Learning · Building · Improving",
  // Resume
  resumeUrl: "/resume.pdf",
  resumeAvailable: false,
  // GitHub
  githubUsername: "YashMishra0101",
  githubStatsSubtitle: "Proof I am a Developer",
  // UI labels (fully controllable text)
  labels: {
    resumeCardTitle: "Resume",
    resumeCardSubtitle: "Download CV",
    resumeNotAvailable: "Not Available",
    viewProjectBtn: "View Project",
    viewProfileBtn: "View Profile",
    connectSectionTitle: "Connect With Me",
    techStackSectionTitle: "Tech Stack",
    experienceSectionTitle: "Experience",
    githubStatsSectionTitle: "GitHub Stats",
    projectsSectionTitle: "Projects",
  },
  // Section visibility
  sections: {
    showTechStack: true,
    showExperience: true,
    showGithubStats: true,
    showProjects: true,
    showConnect: true,
  },
  // Socials
  socials: {
    github: "https://github.com/YashMishra0101",
    linkedin: "https://www.linkedin.com/in/yash-mishra-356280223/",
    twitter: "https://x.com/YashRKMishra1",
    email: "yashrkm0011@gmail.com",
  },
  // Experience
  experience: [
    { role: "Full Stack Intern", company: "Sky Mentor Technology", location: "Nagpur, India", duration: "3 months", type: "In Office", experienceType: "Internship" },
    { role: "Full Stack Intern", company: "Coladco", location: "Delhi, Faridabad, India", duration: "3 months", type: "Remote", experienceType: "Internship" },
    { role: "Freelancer", company: "Self-Employed", location: "Work From Home", duration: "3 months", type: "Remote", experienceType: "Freelancing" },
  ],
  // Projects
  projects: [
    { title: "Major Project in Progress", status: "In Development", description: "", tech: [], link: "" },
  ],
  // Open source contributions
  openSourceContributions: [],
};

// ─── Normalize Firestore → complete shape ─────────────────────────────────────
function normalizeContent(data) {
  return {
    ...DEFAULT_CONTENT,
    ...data,
    labels: { ...DEFAULT_CONTENT.labels, ...(data.labels || {}) },
    socials: { ...DEFAULT_CONTENT.socials, ...(data.socials || {}) },
    sections: { ...DEFAULT_CONTENT.sections, ...(data.sections || {}) },
    experience: Array.isArray(data.experience)
      ? data.experience.map((item) => ({
        role: item?.role || "",
        company: item?.company || "",
        location: item?.location || "",
        duration: item?.duration || "",
        type: item?.type || "Remote",
        experienceType: item?.experienceType || "Job",
      }))
      : DEFAULT_CONTENT.experience,
    projects: Array.isArray(data.projects)
      ? data.projects.map((p) => ({ description: "", ...p, tech: Array.isArray(p.tech) ? p.tech : [], link: p.link || "" }))
      : DEFAULT_CONTENT.projects,
    openSourceContributions: Array.isArray(data.openSourceContributions)
      ? data.openSourceContributions.map((item) => ({
        companyName: typeof item?.companyName === "string" ? item.companyName : "",
        link: typeof item?.link === "string" ? item.link : "",
      }))
      : DEFAULT_CONTENT.openSourceContributions,
  };
}

// ─── Helper: Section card wrapper ─────────────────────────────────────────────
function SectionCard({ children }) {
  return (
    <div className="bg-zinc-950/40 border border-zinc-800/70 rounded-sm p-5 space-y-4">
      {children}
    </div>
  );
}

// ─── Helper: Section header strip ─────────────────────────────────────────────
const BORDER_COLORS = {
  emerald: "border-emerald-600", blue: "border-blue-600", purple: "border-purple-600",
  cyan: "border-cyan-600", orange: "border-orange-500", zinc: "border-zinc-600",
  rose: "border-rose-600", violet: "border-violet-600",
};
function SectionHeader({ icon, label, color = "zinc", badge }) {
  return (
    <div className="flex items-center justify-between">
      <div className={`flex items-center gap-2 text-zinc-300 font-mono text-xs uppercase tracking-widest border-l-2 ${BORDER_COLORS[color] || "border-zinc-600"} pl-3`}>
        <span className="opacity-70">{icon}</span>
        <span>{label}</span>
      </div>
      {badge && (
        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-600 border border-zinc-800 px-2 py-0.5 rounded-sm">
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── Helper: form field wrapper ────────────────────────────────────────────────
function Field({ label, hint, className = "", readOnlyField = false, children }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 flex-wrap">
        <label className="text-[10px] text-zinc-400 uppercase font-bold font-mono tracking-wider">
          {label}
        </label>
        {readOnlyField && (
          <span className="flex items-center gap-1 text-[9px] text-amber-600 font-mono bg-amber-950/30 border border-amber-900/40 px-1.5 py-0.5 rounded-sm">
            <Lock size={8} /> Read Only
          </span>
        )}
        {hint && !readOnlyField && (
          <span className="text-[9px] text-zinc-600 font-mono normal-case">— {hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Helper: visibility toggle button ─────────────────────────────────────────
function VisibilityToggle({ label, field, value, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(field, !value)}
      title={value ? `Hide ${label} section` : `Show ${label} section`}
      className={`flex items-center gap-2 px-3 py-2 border font-mono text-xs uppercase tracking-wider transition-all ${value ? "bg-emerald-950/30 border-emerald-700/70 text-emerald-400" : "bg-zinc-900/60 border-zinc-700/60 text-zinc-600"
        } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}`}
    >
      {value ? <Eye size={11} /> : <EyeOff size={11} />}
      {label}
    </button>
  );
}

function SaveSnackbar({ notification, onClose }) {
  useEffect(() => {
    if (!notification?.text) return undefined;
    const timer = setTimeout(onClose, notification.durationMs || 3000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification?.text) return null;

  const isSuccess = notification.type === "success";
  return (
    <div className="fixed right-4 bottom-4 z-50 max-w-sm w-[calc(100%-2rem)]">
      <div
        className={`flex items-center gap-2.5 p-3 border shadow-lg backdrop-blur-sm font-mono text-xs ${isSuccess
          ? "bg-emerald-950/95 border-emerald-800/70 text-emerald-300"
          : "bg-red-950/95 border-red-800/70 text-red-300"
          }`}
        role="status"
        aria-live="polite"
      >
        {isSuccess ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
        <span className="uppercase tracking-wide">{notification.text}</span>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ContentManager() {
  // Viewer role removed — all authenticated users are admins, always editable
  const isReadOnly = false;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ type: "", text: "", durationMs: 0 });
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [savedContent, setSavedContent] = useState(DEFAULT_CONTENT);

  // Real-time sync
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, CONTENT_DOC_COLLECTION, CONTENT_DOC_ID),
      (snap) => {
        if (snap.exists()) {
          const normalized = normalizeContent(snap.data());
          setContent(normalized);
          setSavedContent(normalized);
        } else {
          setSavedContent(DEFAULT_CONTENT);
        }
        setLoading(false);
      },
      (err) => { console.error("Firestore error:", err); setLoading(false); }
    );
    return () => unsub();
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(content) !== JSON.stringify(savedContent),
    [content, savedContent]
  );

  // ── Persist ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotification({ type: "", text: "", durationMs: 0 });
    try {
      await setDoc(doc(db, CONTENT_DOC_COLLECTION, CONTENT_DOC_ID), content);
      setSavedContent(content);
      setNotification({
        type: "success",
        text: "Changes saved successfully",
        durationMs: 3000,
      });
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        text: "Failed to save changes. Please try again.",
        durationMs: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Updaters ─────────────────────────────────────────────────────────────────
  const updateField = (field, value) => setContent((p) => ({ ...p, [field]: value }));
  const updateSocial = (key, val) => setContent((p) => ({ ...p, socials: { ...p.socials, [key]: val } }));
  const updateSection = (key, val) => setContent((p) => ({ ...p, sections: { ...p.sections, [key]: val } }));
  const updateLabel = (key, val) => setContent((p) => ({ ...p, labels: { ...p.labels, [key]: val } }));

  // ── Experience CRUD ───────────────────────────────────────────────────────────
  const addExperience = () =>
    setContent((p) => ({
      ...p,
      experience: [...p.experience, { role: "", company: "", location: "", duration: "", type: "Remote", experienceType: "Job" }],
    }));
  const updateExperience = (i, field, val) =>
    setContent((p) => ({ ...p, experience: p.experience.map((e, idx) => idx === i ? { ...e, [field]: val } : e) }));
  const removeExperience = (i) =>
    setContent((p) => ({ ...p, experience: p.experience.filter((_, idx) => idx !== i) }));
  const moveExperience = (i, dir) =>
    setContent((p) => {
      const exp = [...p.experience];
      const t = i + dir;
      if (t < 0 || t >= exp.length) return p;
      [exp[i], exp[t]] = [exp[t], exp[i]];
      return { ...p, experience: exp };
    });

  // ── Projects CRUD ─────────────────────────────────────────────────────────────
  const addProject = () =>
    setContent((p) => ({ ...p, projects: [...p.projects, { title: "", status: "In Development", description: "", tech: [], link: "" }] }));
  const updateProject = (i, field, val) =>
    setContent((p) => ({ ...p, projects: p.projects.map((pr, idx) => idx === i ? { ...pr, [field]: val } : pr) }));
  const removeProject = (i) =>
    setContent((p) => ({ ...p, projects: p.projects.filter((_, idx) => idx !== i) }));
  const moveProject = (i, dir) =>
    setContent((p) => {
      const projects = [...p.projects];
      const t = i + dir;
      if (t < 0 || t >= projects.length) return p;
      [projects[i], projects[t]] = [projects[t], projects[i]];
      return { ...p, projects };
    });

  // ── Open Source Contributions CRUD ────────────────────────────────────────────
  const addOpenSourceContribution = () =>
    setContent((p) => ({
      ...p,
      openSourceContributions: [...(p.openSourceContributions || []), { companyName: "", link: "" }],
    }));
  const updateOpenSourceContribution = (i, field, val) =>
    setContent((p) => ({
      ...p,
      openSourceContributions: (p.openSourceContributions || []).map((item, idx) =>
        idx === i ? { ...item, [field]: val } : item
      ),
    }));
  const removeOpenSourceContribution = (i) =>
    setContent((p) => ({
      ...p,
      openSourceContributions: (p.openSourceContributions || []).filter((_, idx) => idx !== i),
    }));
  const moveOpenSourceContribution = (i, dir) =>
    setContent((p) => {
      const items = [...(p.openSourceContributions || [])];
      const t = i + dir;
      if (t < 0 || t >= items.length) return p;
      [items[i], items[t]] = [items[t], items[i]];
      return { ...p, openSourceContributions: items };
    });

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-emerald-500 font-mono animate-pulse uppercase text-xs tracking-widest">
        Syncing with Portfolio Hub...
      </div>
    );
  }

  const L = content.labels || {};

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto w-full space-y-5 pb-10">

      {/* ── Page Header ── */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="tactical-header text-xl">Content Management</h1>
        <p className="text-zinc-500 text-[10px] font-mono uppercase mt-1 tracking-wider">
          Manage live portfolio — all changes reflect on frontend instantly after saving
        </p>
      </div>

      {/* ── Global notice: Firebase free plan ── */}
      <div className="flex items-start gap-3 p-3.5 bg-amber-950/20 border border-amber-900/40 rounded-sm">
        <ImageOff size={15} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider">
            Firebase Free Plan — Image / File Upload Disabled
          </p>
          <p className="text-[9px] text-amber-500/70 font-mono leading-relaxed mt-0.5">
            Profile pictures and tech-stack icons are managed directly in code.
            Upgrade to Firebase Blaze to enable storage uploads.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5 w-full">

        {/* ══════════════════════════════════════════════════════════════
            §1  IDENTITY CORE
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <SectionHeader icon={<User size={13} />} label="Identity Core" color="emerald" badge="text · links" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={content.name} onChange={(e) => updateField("name", e.target.value)} />
            </Field>

            <Field label="Specialization" hint="Shown below your name on the portfolio">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={content.specialization}
                onChange={(e) => updateField("specialization", e.target.value)}
                placeholder="e.g. Full Stack Developer" />
            </Field>

            <Field label="Availability Status" className="md:col-span-2"
              hint="Text inside the animated green badge">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={content.status} onChange={(e) => updateField("status", e.target.value)} />
            </Field>

            <Field label="Biography" className="md:col-span-2">
              <textarea rows={3} readOnly={isReadOnly} className="tactical-input resize-none"
                value={content.bio} onChange={(e) => updateField("bio", e.target.value)} />
            </Field>

            <Field label="Bio Highlight Keywords" className="md:col-span-2"
              hint="Comma-separated — these words appear accented (coloured) inside the bio">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={content.bioHighlightKeywords || ""}
                onChange={(e) => updateField("bioHighlightKeywords", e.target.value)}
                placeholder="MERN Stack,TypeScript" />
            </Field>

            <Field label="Location String">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={content.location} onChange={(e) => updateField("location", e.target.value)} />
            </Field>
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════
            §8.1  OPEN SOURCE CONTRIBUTIONS
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <div className="flex items-center justify-between">
            <SectionHeader
              icon={<GitBranch size={13} />}
              label="Open Source Contributions"
              color="cyan"
              badge={`${content.openSourceContributions?.length ?? 0} entries`}
            />
            {!isReadOnly && (
              <button
                type="button"
                onClick={addOpenSourceContribution}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/30 border border-cyan-700/60 text-cyan-400 text-xs font-mono uppercase hover:bg-cyan-900/40 transition-colors"
              >
                <Plus size={11} /> Add
              </button>
            )}
          </div>

          {content.openSourceContributions?.length === 0 && (
            <p className="text-[10px] text-zinc-600 font-mono text-center py-4">
              No contributions added yet. Click "Add" to create one.
            </p>
          )}

          <div className="space-y-3">
            {content.openSourceContributions?.map((item, i) => (
              <div key={i} className="border border-zinc-800/80 bg-zinc-900/20 rounded-sm">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/60">
                  <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
                    Contribution #{i + 1}
                    {item.companyName && <span className="text-zinc-500 ml-2 normal-case">— {item.companyName}</span>}
                  </span>
                  {!isReadOnly && (
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveOpenSourceContribution(i, -1)}
                        disabled={i === 0}
                        className="p-1.5 text-zinc-500 hover:text-cyan-400 hover:bg-cyan-950/30 transition-colors disabled:opacity-25 disabled:cursor-not-allowed rounded-sm"
                        title="Move Up"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOpenSourceContribution(i, 1)}
                        disabled={i === (content.openSourceContributions?.length ?? 1) - 1}
                        className="p-1.5 text-zinc-500 hover:text-cyan-400 hover:bg-cyan-950/30 transition-colors disabled:opacity-25 disabled:cursor-not-allowed rounded-sm"
                        title="Move Down"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeOpenSourceContribution(i)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors rounded-sm"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                  <Field label="Company Name">
                    <input
                      type="text"
                      readOnly={isReadOnly}
                      className="tactical-input"
                      value={item.companyName || ""}
                      onChange={(e) => updateOpenSourceContribution(i, "companyName", e.target.value)}
                      placeholder="e.g. Vercel"
                    />
                  </Field>
                  <Field label="Contribution Link" hint="Must be a valid public URL">
                    <input
                      type="url"
                      readOnly={isReadOnly}
                      className="tactical-input"
                      value={item.link || ""}
                      onChange={(e) => updateOpenSourceContribution(i, "link", e.target.value)}
                      placeholder="https://..."
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════
            §4  SOCIAL / UPLINK CHANNELS
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <SectionHeader icon={<LinkIcon size={13} />} label="Uplink Channels" color="blue" badge="links" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="GitHub URL">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={content.socials?.github || ""} onChange={(e) => updateSocial("github", e.target.value)} />
            </Field>
            <Field label="LinkedIn URL">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={content.socials?.linkedin || ""} onChange={(e) => updateSocial("linkedin", e.target.value)} />
            </Field>
            <Field label="Twitter (X) URL">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={content.socials?.twitter || ""} onChange={(e) => updateSocial("twitter", e.target.value)} />
            </Field>
            <Field label="Email Address">
              <input type="email" readOnly={isReadOnly} className="tactical-input"
                value={content.socials?.email || ""} onChange={(e) => updateSocial("email", e.target.value)} />
            </Field>
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════
            §7  EXPERIENCE RECORDS
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <div className="flex items-center justify-between">
            <SectionHeader icon={<Briefcase size={13} />} label="Experience Records" color="purple" badge={`${content.experience?.length ?? 0} entries`} />
            {!isReadOnly && (
              <button type="button" onClick={addExperience}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/30 border border-purple-700/60 text-purple-400 text-xs font-mono uppercase hover:bg-purple-900/40 transition-colors">
                <Plus size={11} /> Add
              </button>
            )}
          </div>

          {content.experience?.length === 0 && (
            <p className="text-[10px] text-zinc-600 font-mono text-center py-4">
              No experience entries. Click "Add" to create one.
            </p>
          )}

          <div className="space-y-3">
            {content.experience?.map((exp, i) => (
              <div key={i} className="border border-zinc-800/80 bg-zinc-900/20 rounded-sm">
                {/* Row header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/60">
                  <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
                    Experience #{i + 1}
                    {exp.role && <span className="text-zinc-500 ml-2 normal-case">— {exp.role}</span>}
                  </span>
                  {!isReadOnly && (
                    <div className="flex items-center gap-0.5">
                      <button type="button" onClick={() => moveExperience(i, -1)} disabled={i === 0}
                        className="p-1.5 text-zinc-500 hover:text-purple-400 hover:bg-purple-950/30 transition-colors disabled:opacity-25 disabled:cursor-not-allowed rounded-sm" title="Move Up">
                        <ArrowUp size={12} />
                      </button>
                      <button type="button" onClick={() => moveExperience(i, 1)} disabled={i === (content.experience?.length ?? 1) - 1}
                        className="p-1.5 text-zinc-500 hover:text-purple-400 hover:bg-purple-950/30 transition-colors disabled:opacity-25 disabled:cursor-not-allowed rounded-sm" title="Move Down">
                        <ArrowDown size={12} />
                      </button>
                      <button type="button" onClick={() => removeExperience(i)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors rounded-sm" title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                {/* Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                  <Field label="Role"><input type="text" readOnly={isReadOnly} className="tactical-input" value={exp.role} onChange={(e) => updateExperience(i, "role", e.target.value)} /></Field>
                  <Field label="Company"><input type="text" readOnly={isReadOnly} className="tactical-input" value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} /></Field>
                  <Field label="Location"><input type="text" readOnly={isReadOnly} className="tactical-input" value={exp.location} onChange={(e) => updateExperience(i, "location", e.target.value)} /></Field>
                  <Field label="Duration"><input type="text" readOnly={isReadOnly} className="tactical-input" value={exp.duration} onChange={(e) => updateExperience(i, "duration", e.target.value)} /></Field>
                  <Field label="Experience Type">
                    <select
                      disabled={isReadOnly}
                      className="tactical-input"
                      value={exp.experienceType || "Job"}
                      onChange={(e) => updateExperience(i, "experienceType", e.target.value)}
                    >
                      <option value="Job">Job</option>
                      <option value="Internship">Internship</option>
                      <option value="Freelancing">Freelancing</option>
                      <option value="Contract-Based">Contract-Based</option>
                    </select>
                  </Field>
                  <Field label="Work Type">
                    <select disabled={isReadOnly} className="tactical-input" value={exp.type} onChange={(e) => updateExperience(i, "type", e.target.value)}>
                      <option value="Remote">Remote</option>
                      <option value="In Office">In Office</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════
            §8  PROJECT REGISTRY
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <div className="flex items-center justify-between">
            <SectionHeader icon={<Code size={13} />} label="Project Registry" color="cyan" badge={`${content.projects?.length ?? 0} projects`} />
            {!isReadOnly && (
              <button type="button" onClick={addProject}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/30 border border-cyan-700/60 text-cyan-400 text-xs font-mono uppercase hover:bg-cyan-900/40 transition-colors">
                <Plus size={11} /> Add
              </button>
            )}
          </div>

          {content.projects?.length === 0 && (
            <p className="text-[10px] text-zinc-600 font-mono text-center py-4">
              No projects. Click "Add" to create one.
            </p>
          )}

          <div className="space-y-3">
            {content.projects?.map((proj, i) => (
              <div key={i} className="border border-zinc-800/80 bg-zinc-900/20 rounded-sm">
                {/* Row header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/60">
                  <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
                    Project #{i + 1}
                    {proj.title && <span className="text-zinc-500 ml-2 normal-case">— {proj.title}</span>}
                    {proj.status && (
                      <span className={`ml-2 text-[8px] px-1.5 py-0.5 rounded-sm border ${proj.status === "Completed" ? "border-emerald-800/60 text-emerald-600 bg-emerald-950/20"
                        : proj.status === "In Development" ? "border-amber-800/60 text-amber-600 bg-amber-950/20"
                          : "b  order-zinc-700/60 text-zinc-600"
                        }`}>{proj.status}</span>
                    )}
                  </span>
                  {!isReadOnly && (
                    <div className="flex items-center gap-0.5">
                      <button type="button" onClick={() => moveProject(i, -1)} disabled={i === 0}
                        className="p-1.5 text-zinc-500 hover:text-cyan-400 hover:bg-cyan-950/30 transition-colors disabled:opacity-25 disabled:cursor-not-allowed rounded-sm" title="Move Up">
                        <ArrowUp size={12} />
                      </button>
                      <button type="button" onClick={() => moveProject(i, 1)} disabled={i === (content.projects?.length ?? 1) - 1}
                        className="p-1.5 text-zinc-500 hover:text-cyan-400 hover:bg-cyan-950/30 transition-colors disabled:opacity-25 disabled:cursor-not-allowed rounded-sm" title="Move Down">
                        <ArrowDown size={12} />
                      </button>
                      <button type="button" onClick={() => removeProject(i)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors rounded-sm" title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                {/* Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                  <Field label="Title">
                    <input type="text" readOnly={isReadOnly} className="tactical-input" value={proj.title}
                      onChange={(e) => updateProject(i, "title", e.target.value)} />
                  </Field>
                  <Field label="Status">
                    <select disabled={isReadOnly} className="tactical-input" value={proj.status}
                      onChange={(e) => updateProject(i, "status", e.target.value)}>
                      <option value="In Development">In Development</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Planning">Planning</option>
                    </select>
                  </Field>
                  <Field label="Description" className="md:col-span-2" hint="Leave empty to hide on frontend">
                    <textarea rows={2} readOnly={isReadOnly} className="tactical-input resize-none"
                      value={proj.description || ""}
                      onChange={(e) => updateProject(i, "description", e.target.value)}
                      placeholder="Brief description of the project..." />
                  </Field>
                  <Field label="Project Link" hint="Leave blank to hide 'View Project' button">
                    <input type="text" readOnly={isReadOnly} className="tactical-input"
                      value={proj.link || ""} onChange={(e) => updateProject(i, "link", e.target.value)}
                      placeholder="https://..." />
                  </Field>
                  <Field label="Tech Stack" hint="Comma-separated">
                    <input type="text" readOnly={isReadOnly} className="tactical-input"
                      value={proj.tech?.join(", ") || ""}
                      onChange={(e) => updateProject(i, "tech", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                      placeholder="React, Node.js, MongoDB" />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════
            §3  GITHUB SETTINGS
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <SectionHeader icon={<GitFork size={13} />} label="GitHub Settings" color="zinc" badge="text" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="GitHub Username" hint="Drives all three stats widget images">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={content.githubUsername || ""}
                onChange={(e) => updateField("githubUsername", e.target.value)}
                placeholder="YashMishra0101" />
            </Field>

            <Field label="GitHub Stats Subtitle" hint="Small text under 'GitHub Stats' heading">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={content.githubStatsSubtitle || ""}
                onChange={(e) => updateField("githubStatsSubtitle", e.target.value)}
                placeholder="Proof I am a Developer" />
            </Field>

            <Field label="Section Heading" hint="The visible 'GitHub Stats' title">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={L.githubStatsSectionTitle || ""}
                onChange={(e) => updateLabel("githubStatsSectionTitle", e.target.value)}
                placeholder="GitHub Stats" />
            </Field>

            <Field label="'View Profile' Button Text">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={L.viewProfileBtn || ""}
                onChange={(e) => updateLabel("viewProfileBtn", e.target.value)}
                placeholder="View Profile" />
            </Field>
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════
            §5  SECTION LABELS (headings + button texts)
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <SectionHeader icon={<Type size={13} />} label="Section Labels &amp; Button Text" color="violet" badge="text" />
          <p className="text-[9px] text-zinc-600 font-mono">
            All visible headings and button labels used across the portfolio.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tech Stack — Section Heading">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={L.techStackSectionTitle || ""}
                onChange={(e) => updateLabel("techStackSectionTitle", e.target.value)}
                placeholder="Tech Stack" />
            </Field>
            <Field label="Experience — Section Heading">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={L.experienceSectionTitle || ""}
                onChange={(e) => updateLabel("experienceSectionTitle", e.target.value)}
                placeholder="Experience" />
            </Field>
            <Field label="Projects — Section Heading">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={L.projectsSectionTitle || ""}
                onChange={(e) => updateLabel("projectsSectionTitle", e.target.value)}
                placeholder="Projects" />
            </Field>
            <Field label="Connect — Section Heading">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={L.connectSectionTitle || ""}
                onChange={(e) => updateLabel("connectSectionTitle", e.target.value)}
                placeholder="Connect With Me" />
            </Field>
            <Field label="'View Project' Button Text" hint="On each project card">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={L.viewProjectBtn || ""}
                onChange={(e) => updateLabel("viewProjectBtn", e.target.value)}
                placeholder="View Project" />
            </Field>
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════
            §6  SECTION VISIBILITY
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <SectionHeader icon={<Settings size={13} />} label="Section Visibility" color="orange" />
          <p className="text-[9px] text-zinc-600 font-mono">
            Toggle individual sections on the portfolio. Inactive sections are completely hidden from visitors.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { key: "showTechStack", label: "Tech Stack" },
              { key: "showExperience", label: "Experience" },
              { key: "showGithubStats", label: "GitHub Stats" },
              { key: "showProjects", label: "Projects" },
              { key: "showConnect", label: "Connect" },
            ].map(({ key, label }) => (
              <VisibilityToggle key={key} field={key} label={label}
                value={content.sections?.[key] ?? true}
                onChange={updateSection} disabled={isReadOnly} />
            ))}
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════
            §9  MEDIA ASSETS — READ ONLY
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <SectionHeader icon={<ImageOff size={13} />} label="Media Assets" color="zinc" badge="read only" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Profile Picture" readOnlyField>
              <input type="text" readOnly className="tactical-input opacity-40 cursor-not-allowed select-none" value="/profile.jpg" />
            </Field>
            <Field label="Tech Stack Icons" readOnlyField>
              <input type="text" readOnly className="tactical-input opacity-40 cursor-not-allowed select-none" value="15 icons — managed in code" />
            </Field>
          </div>
          <p className="text-[9px] text-zinc-600 font-mono leading-relaxed">
            These assets are managed directly in the frontend code and cannot be changed via the dashboard
            on the Firebase free plan. To enable dynamic image uploads, upgrade to the Firebase Blaze (pay-as-you-go) plan.
          </p>
        </SectionCard>


        {/* ══════════════════════════════════════════════════════════════
            §10 FOOTER CONFIGURATION
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <SectionHeader icon={<Type size={13} />} label="Footer Configuration" color="blue" badge="text" />
          <Field label="Footer Tagline Text" hint="Bottom tagline linked to the frontend footer">
            <input type="text" readOnly={isReadOnly} className="tactical-input"
              value={content.tagline || ""}
              onChange={(e) => updateField("tagline", e.target.value)}
              placeholder="Learning · Building · Improving" />
          </Field>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════
            §2  RESUME CARD
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <SectionHeader icon={<Tag size={13} />} label="Resume Card" color="orange" badge="text · links" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Resume URL" hint="Direct link to the PDF — leave blank if not hosted">
              <input type="text" readOnly={isReadOnly} className="tactical-input"
                value={content.resumeUrl} onChange={(e) => updateField("resumeUrl", e.target.value)}
                placeholder="https://... or /resume.pdf" />
            </Field>

            <Field label="Resume Available">
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => updateField("resumeAvailable", !content.resumeAvailable)}
                className={`mt-0.5 px-4 py-2 font-mono text-xs uppercase tracking-wider border transition-all w-full text-left ${content.resumeAvailable
                  ? "bg-emerald-950/30 border-emerald-700/70 text-emerald-400"
                  : "bg-red-950/30 border-red-700/70 text-red-400"
                  } ${isReadOnly ? "opacity-40 cursor-not-allowed" : "hover:opacity-80"}`}
              >
                {content.resumeAvailable ? "✓ Available — card is clickable" : "✗ Not Available — card is disabled"}
              </button>
            </Field>

            {/* Label controls */}
            <div className="md:col-span-2">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
                — Resume Card UI Labels —
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Card Title" hint="Heading on resume card">
                  <input type="text" readOnly={isReadOnly} className="tactical-input"
                    value={L.resumeCardTitle || ""}
                    onChange={(e) => updateLabel("resumeCardTitle", e.target.value)}
                    placeholder="Resume" />
                </Field>
                <Field label="Card Subtitle" hint="'Download CV' text">
                  <input type="text" readOnly={isReadOnly} className="tactical-input"
                    value={L.resumeCardSubtitle || ""}
                    onChange={(e) => updateLabel("resumeCardSubtitle", e.target.value)}
                    placeholder="Download CV" />
                </Field>
                <Field label="Not Available Text">
                  <input type="text" readOnly={isReadOnly} className="tactical-input"
                    value={L.resumeNotAvailable || ""}
                    onChange={(e) => updateLabel("resumeNotAvailable", e.target.value)}
                    placeholder="Not Available" />
                </Field>
              </div>
            </div>
          </div>
        </SectionCard>


        {/* ── Save button ── */}
        <div className="flex flex-col gap-3 pt-4 border-t border-zinc-900">
          {isReadOnly && (
            <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest flex items-center gap-1.5">
              <Lock size={11} /> Viewer mode — saving disabled
            </span>
          )}
          <button
            type="submit"
            disabled={saving || isReadOnly || !isDirty}
            className={`ml-auto btn-tactical flex items-center gap-2 px-10 group ${isReadOnly || !isDirty ? "opacity-40 cursor-not-allowed" : ""
              }`}
          >
            <Save size={15} className={saving ? "animate-spin" : "group-hover:scale-110 transition-transform"} />
            {saving ? "Saving..." : isReadOnly ? "Read Only" : !isDirty ? "No Changes" : "Save Configuration"}
          </button>
        </div>
      </form>


      {/* ── Footer note ── */}
      <div className="flex items-start gap-3 p-3.5 bg-zinc-900/30 border border-zinc-800/60 rounded-sm">
        <AlertCircle size={14} className="text-zinc-700 shrink-0 mt-0.5" />
        <p className="text-[9px] text-zinc-600 font-mono leading-relaxed">
          Changes saved here are deployed immediately to the live portfolio via Firebase real-time sync.
          Ensure all URLs are publicly accessible.
        </p>
      </div>

      <SaveSnackbar
        notification={notification}
        onClose={() => setNotification({ type: "", text: "", durationMs: 0 })}
      />
    </div>
  );
}
