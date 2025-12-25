import { useState, useEffect } from "react";
import { logVisit, db } from "./utils/analytics";
import { doc, onSnapshot } from "firebase/firestore";

function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined" && localStorage.getItem("theme")) {
      return localStorage.getItem("theme");
    }
    // Default to dark
    return "dark";
  });

  const [config, setConfig] = useState({
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
    if (!db) return;
    const unsub = onSnapshot(doc(db, "portfolio", "config"), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Log visit silently on mount
    logVisit();

    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    // Body replacement wrapper
    <div className="min-h-screen p-4 sm:p-8 flex items-center justify-center text-txt antialiased transition-colors duration-300">
      <button
        onClick={toggleTheme}
        className="theme-toggle-btn mt-1 mr-2 h-[2.8rem] w-[2.8rem] md:w-[3rem] md:h-[3rem] md:mt-0 md:mr-0"
        aria-label="Toggle Dark Mode"
      >
        <i
          id="theme-icon"
          className={`fas ${theme === "dark" ? "fa-sun" : "fa-moon"} text-xl`}
        ></i>
      </button>

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Card */}
        <div
          className="bento-card md:col-span-2 rounded-[2rem] p-4 flex flex-col sm:flex-row items-center sm:items-start md:gap-7 gap-2 animate-fade-in group"
          style={{ animationDelay: "0ms" }}
        >
          <div className="relative flex-shrink-0">
            <div className="w-36 h-36 relative group-hover:scale-105 transition-all duration-500">
              <div className="absolute inset-[6px] rounded-full overflow-hidden shadow-lg z-0">
                <img
                  src="/profile.jpg"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#007E33]/10 text-[#2ecc71] border border-[#007E33]/30 text-xs font-bold mb-4 tracking-wide">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {config.status}
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-txt">
              {config.name}
            </h1>

            <p className="text-sub text-sm leading-relaxed max-w-md mb-4">
              {config.bio}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-medium text-sub/80">
              <i className="fas fa-map-marker-alt text-accent"></i>
              <span>{config.location}</span>
            </div>
          </div>
        </div>

        {/* Resume Card */}
        <a
          href={config.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bento-card rounded-[2rem] p-6 flex flex-col justify-center items-center gap-4 group animate-fade-in cursor-pointer relative overflow-hidden"
          style={{ animationDelay: "100ms" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-blue-600/10 opacity-100 dark:opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-blue-500/5 opacity-0 dark:opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <i className="fas fa-file-arrow-down"></i>
            </div>
          </div>
          <div className="text-center relative z-10">
            <h2 className="text-xl font-bold text-txt mb-1">Resume</h2>
            <p className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
              Download CV
            </p>
          </div>
        </a>

        {/* Tech Stack Card */}
        <div
          className="bento-card md:row-span-2 rounded-[2rem] p-6 animate-fade-in flex flex-col"
          style={{ animationDelay: "200ms" }}
        >
          <h3 className="font-bold text-xl mb-8 flex items-center gap-3">
            <span className="text-accent text-2xl">
              <i className="fas fa-layer-group"></i>
            </span>
            <span className="text-gradient">Tech Stack</span>
          </h3>

          <div className="grid grid-cols-2 gap-y-10 gap-x-4 text-center flex-1 content-center px-2">
            {/* JavaScript */}
            <div className="tech-icon flex flex-col items-center gap-3">
              <i className="fab fa-js text-4xl text-yellow-400 drop-shadow-md"></i>
              <span className="text-xs font-semibold text-sub">JavaScript</span>
            </div>

            {/* TypeScript */}
            <div className="tech-icon flex flex-col items-center gap-3">
              <svg
                className="svg-icon drop-shadow-md"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="24" height="24" rx="4" fill="#3178C6" />
                <path d="M11.8 8H6.5V9.5H8.3V17H10V9.5H11.8V8Z" fill="white" />
                <path
                  d="M17.5 14.1C17.5 13 16.8 12.6 15.6 12.2L15 12C14.3 11.8 13.8 11.6 13.8 11.1C13.8 10.6 14.3 10.3 14.9 10.3C15.5 10.3 16 10.6 16.3 11.1L17.6 10.3C17.1 9.3 16.2 8.8 14.9 8.8C13.2 8.8 12.1 9.8 12.1 11.2C12.1 12.5 13 13.1 14 13.5L14.7 13.7C15.6 14 15.9 14.3 15.9 14.8C15.9 15.4 15.3 15.7 14.7 15.7C13.9 15.7 13.3 15.3 13 14.6L11.5 15.3C12 16.6 13.2 17.2 14.7 17.2C16.6 17.2 17.5 16.1 17.5 14.1Z"
                  fill="white"
                />
              </svg>
              <span className="text-xs font-semibold text-sub">TypeScript</span>
            </div>

            {/* React */}
            <div className="tech-icon flex flex-col items-center gap-3">
              <i className="fab fa-react text-4xl text-blue-400 drop-shadow-md animate-[spin_10s_linear_infinite]"></i>
              <span className="text-xs font-semibold text-sub">React</span>
            </div>

            {/* Node.js */}
            <div className="tech-icon flex flex-col items-center gap-3">
              <i className="fab fa-node text-4xl text-green-500 drop-shadow-md"></i>
              <span className="text-xs font-semibold text-sub">Node.js</span>
            </div>

            {/* Express */}
            <div className="tech-icon flex flex-col items-center gap-3">
              <svg
                className="svg-icon drop-shadow-md text-txt"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="12" fill="none" />
                <text
                  x="50%"
                  y="55%"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fontSize="14px"
                  fill="currentColor"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  ex
                </text>
              </svg>
              <span className="text-xs font-semibold text-sub">Express</span>
            </div>

            {/* MongoDB */}
            <div className="tech-icon flex flex-col items-center gap-3">
              <i className="fas fa-database text-3xl text-green-400 drop-shadow-md"></i>
              <span className="text-xs font-semibold text-sub">MongoDB</span>
            </div>
          </div>
        </div>

        {/* Email Card */}
        <a
          href={`mailto:${config.socials.email}`}
          className="bento-card rounded-[2rem] p-6 flex flex-col justify-center items-center gap-3 group animate-fade-in hover:bg-zinc-100 dark:hover:bg-zinc-800"
          style={{ animationDelay: "600ms" }}
        >
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
            <i className="fas fa-envelope"></i>
          </div>
          <div className="text-center">
            <span className="block font-bold text-sm text-txt">Email</span>
            <span className="text-xs text-sub group-hover:text-red-500 transition-colors">
              Message
            </span>
          </div>
        </a>

        {/* LinkedIn Card */}
        <a
          href={config.socials.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="bento-card rounded-[2rem] p-6 flex flex-col justify-center items-center gap-3 group animate-fade-in hover:bg-zinc-100 dark:hover:bg-zinc-800"
          style={{ animationDelay: "300ms" }}
        >
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            <i className="fab fa-linkedin-in"></i>
          </div>
          <div className="text-center">
            <span className="block font-bold text-sm text-txt">LinkedIn</span>
            <span className="text-xs text-sub group-hover:text-blue-600 transition-colors">
              Connect
            </span>
          </div>
        </a>

        {/* GitHub Card */}
        <a
          href={config.socials.github}
          target="_blank"
          rel="noopener noreferrer"
          className="bento-card rounded-[2rem] p-6 flex flex-col justify-center items-center gap-3 group animate-fade-in hover:bg-zinc-100 dark:hover:bg-zinc-800"
          style={{ animationDelay: "400ms" }}
        >
          <div className="w-12 h-12 rounded-xl bg-icon-bg text-icon-txt flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-black group-hover:text-white transition-all duration-300">
            <i className="fab fa-github"></i>
          </div>
          <div className="text-center">
            <span className="block font-bold text-sm text-txt">GitHub</span>
            <span className="text-xs text-sub group-hover:text-txt transition-colors">
              View Code
            </span>
          </div>
        </a>

        {/* Twitter Card */}
        <a
          href={config.socials.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="bento-card rounded-[2rem] p-6 flex flex-col justify-center items-center gap-3 group animate-fade-in hover:bg-zinc-100 dark:hover:bg-zinc-800"
          style={{ animationDelay: "500ms" }}
        >
          <div className="w-12 h-12 rounded-xl bg-icon-bg text-icon-txt flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-black group-hover:text-white transition-all duration-300">
            <i className="fa-brands fa-x-twitter"></i>
          </div>
          <div className="text-center">
            <span className="block font-bold text-sm text-txt">Twitter</span>
            <span className="text-xs text-sub group-hover:text-txt transition-colors">
              Follow
            </span>
          </div>
        </a>
      </div>
    </div>
  );
}

export default App;
