import { useState, useEffect } from "react";
import { logVisit, db } from "./utils/analytics";
import { doc, onSnapshot } from "firebase/firestore";

// GitHub username - change this to your GitHub username
const GITHUB_USERNAME = "YashMishra0101";

function App() {
  // GitHub Stats State
  const [githubStats, setGithubStats] = useState({
    totalStars: 0,
    totalCommits: 0,
    totalPRs: 0,
    totalIssues: 0,
    contributedTo: 0,
    publicRepos: 0,
    followers: 0,
    following: 0,
    loading: true,
    error: null
  });

  const [githubLanguages, setGithubLanguages] = useState([]);
  const [contributionStats, setContributionStats] = useState({
    totalContributions: 0,
    currentStreak: 0,
    longestStreak: 0,
    loading: true
  });

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [visitorType, setVisitorType] = useState("new");
  const [visitorCount, setVisitorCount] = useState(0);

  const [config, setConfig] = useState({
    name: "Yash.RK.Mishra",
    specialization: "Full Stack Developer",
    location: "Based in India",
    bio: "Full Stack Developer ready to build scalable web applications using the MERN Stack and TypeScript.",
    status: "Actively seeking new job opportunities",
    resumeUrl: "/resume.pdf",
    resumeAvailable: false, // Set to true when resume is uploaded
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
        link: null
      }
    ]
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

  // Log visit ONCE on mount (separate from theme logic)
  useEffect(() => {
    logVisit();
  }, []); // Empty dependency array = runs only once

  // Handle theme changes separately
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  // Scroll Animation Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: "0px 0px -50px 0px" // Offset slightly so it triggers before bottom
      }
    );

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => revealElements.forEach((el) => observer.unobserve(el));
  }, []);

  useEffect(() => {
    // Check if user is a returning visitor
    const isReturning = localStorage.getItem("isReturningVisitor");
    if (isReturning) {
      setVisitorType("returning");
    } else {
      localStorage.setItem("isReturningVisitor", "true");
    }
  }, []); // Empty dependency array to run once on mount

  // Fetch GitHub Stats
  useEffect(() => {
    const fetchGitHubStats = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`);
        if (!userResponse.ok) throw new Error('Failed to fetch user data');
        const userData = await userResponse.json();

        // Fetch all repos to calculate total stars and languages
        const reposResponse = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`);
        if (!reposResponse.ok) throw new Error('Failed to fetch repos');
        const reposData = await reposResponse.json();

        // Calculate total stars
        const totalStars = reposData.reduce((acc, repo) => acc + repo.stargazers_count, 0);

        // Calculate language statistics
        const languageCount = {};
        let totalBytes = 0;

        // Fetch languages for each repo
        const languagePromises = reposData.slice(0, 20).map(async (repo) => {
          try {
            const langResponse = await fetch(repo.languages_url);
            if (langResponse.ok) {
              const langData = await langResponse.json();
              Object.entries(langData).forEach(([lang, bytes]) => {
                languageCount[lang] = (languageCount[lang] || 0) + bytes;
                totalBytes += bytes;
              });
            }
          } catch (e) {
            console.log('Error fetching language for repo:', repo.name);
          }
        });

        await Promise.all(languagePromises);

        // Calculate percentages and sort
        const languagePercentages = Object.entries(languageCount)
          .map(([name, bytes]) => ({
            name,
            percentage: ((bytes / totalBytes) * 100).toFixed(2),
            bytes
          }))
          .sort((a, b) => b.bytes - a.bytes)
          .slice(0, 8); // Top 8 languages

        setGithubLanguages(languagePercentages);

        // Fetch events (for commits, PRs, issues estimation)
        const eventsResponse = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events?per_page=100`);
        const eventsData = eventsResponse.ok ? await eventsResponse.json() : [];

        // Count events by type
        let commitCount = 0;
        let prCount = 0;
        let issueCount = 0;

        eventsData.forEach(event => {
          if (event.type === 'PushEvent') {
            commitCount += event.payload.commits?.length || 0;
          } else if (event.type === 'PullRequestEvent') {
            prCount++;
          } else if (event.type === 'IssuesEvent') {
            issueCount++;
          }
        });

        setGithubStats({
          totalStars,
          totalCommits: commitCount || '1.1k+', // Fallback to display value if API limited
          totalPRs: prCount || 31,
          totalIssues: issueCount || 8,
          contributedTo: userData.public_repos,
          publicRepos: userData.public_repos,
          followers: userData.followers,
          following: userData.following,
          loading: false,
          error: null
        });

        // Estimate contribution stats (these would need GitHub GraphQL API for accurate data)
        setContributionStats({
          totalContributions: 514,
          currentStreak: 32,
          longestStreak: 48,
          loading: false
        });

      } catch (error) {
        console.error('Error fetching GitHub stats:', error);
        setGithubStats(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchGitHubStats();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    // Body replacement wrapper
    <div className="min-h-screen p-4 sm:p-8 flex items-center justify-center text-txt antialiased transition-colors duration-300">
      <div className="max-w-5xl w-full relative z-10">
        {/* Theme Toggle Button - Top Right Corner */}
        <button
          onClick={toggleTheme}
          className="absolute md:top-0.5 top-2 md:-right-14 right-2.5 w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 hover:border-accent dark:hover:border-accent text-txt hover:text-accent transition-all duration-300 z-10 hover-wiggle"
          aria-label="Toggle Dark Mode"
        >
          <i className={`fas ${theme === "dark" ? "fa-sun" : "fa-moon"} text-lg`}></i>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Card */}
          <div
            className="bento-card md:col-span-2 rounded-[2rem] p-4 flex flex-col sm:flex-row items-center sm:items-start md:gap-7 gap-2 reveal group"
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

              <h1 className="text-4xl sm:text-5xl font-poppins font-semibold tracking-tight mb-2 text-gradient">
                {config.name}
              </h1>

              <p className="text-sub text-sm leading-relaxed max-w-md mb-4">
                {config.bio.split(/(MERN Stack|TypeScript)/gi).map((part, index) =>
                  part.toLowerCase() === 'mern stack' || part.toLowerCase() === 'typescript'
                    ? <span key={index} className="text-accent font-semibold">{part}</span>
                    : part
                )}
              </p>

              {/* Location + Social Icons - Stacked on Mobile, Row on Desktop */}
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-medium text-sub/80">
                  <i className="fas fa-map-marker-alt text-accent"></i>
                  <span>{config.location}</span>
                </div>

                {/* Social Icons - Small with Brand Colors */}
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${config.socials.email}`}
                    className="w-7 h-7 rounded-lg bg-[#EA4335] flex items-center justify-center text-white hover:opacity-80 transition-all duration-300"
                    title="Email"
                  >
                    <i className="fas fa-envelope text-xs"></i>
                  </a>
                  <a
                    href={config.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white hover:opacity-80 transition-all duration-300"
                    title="LinkedIn"
                  >
                    <i className="fab fa-linkedin-in text-xs"></i>
                  </a>
                  <a
                    href={config.socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-800 dark:text-white hover:opacity-80 transition-all duration-300"
                    title="GitHub"
                  >
                    <i className="fab fa-github text-xs"></i>
                  </a>
                  <a
                    href={config.socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white hover:opacity-80 transition-all duration-300"
                    title="Twitter"
                  >
                    <i className="fa-brands fa-x-twitter text-xs"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Card */}
          <a
            href={config.resumeAvailable ? config.resumeUrl : "#"}
            target={config.resumeAvailable ? "_blank" : "_self"}
            rel="noopener noreferrer"
            className={`bento-card rounded-[2rem] p-6 flex flex-col justify-center items-center gap-4 group reveal relative overflow-hidden ${config.resumeAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-75"
              }`}
            onClick={(e) => {
              if (!config.resumeAvailable) {
                e.preventDefault();
              }
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-600/10 dark:from-zinc-500/10 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 text-white flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <i className="fas fa-file-arrow-down"></i>
              </div>
            </div>
            <div className="text-center relative z-10">
              <h2 className="text-xl font-display font-bold text-txt mb-1">Resume</h2>
              <p className="text-xs font-medium text-sub group-hover:text-accent transition-colors">
                Download CV
              </p>
              {!config.resumeAvailable && (
                <p className="text-xs font-medium text-amber-500 dark:text-zinc-400 mt-1">
                  (Not Available)
                </p>
              )}
            </div>
          </a>

          {/* Tech Stack Card */}
          <div
            className="bento-card md:col-span-3 rounded-[2rem] p-6 reveal flex flex-col"
          >
            <h3 className="font-bold text-xl mb-5 flex items-center gap-3">
              <span className="text-accent text-2xl">
                <i className="fas fa-layer-group"></i>
              </span>
              <span className="text-gradient">Tech Stack</span>
            </h3>

            <div className="flex flex-wrap gap-4 justify-center">
              {/* JavaScript */}
              <div className="tech-icon hover-bounce flex flex-col items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <i className="fab fa-js text-3xl text-yellow-400 drop-shadow-md"></i>
                </div>
                <span className="text-xs font-medium text-sub">JavaScript</span>
              </div>

              {/* TypeScript */}
              <div className="tech-icon flex flex-col items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 drop-shadow-md"
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
                </div>
                <span className="text-xs font-medium text-sub">TypeScript</span>
              </div>

              {/* React */}
              <div className="tech-icon flex flex-col items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <i className="fab fa-react text-3xl text-blue-400 drop-shadow-md animate-[spin_10s_linear_infinite]"></i>
                </div>
                <span className="text-xs font-medium text-sub">React</span>
              </div>

              {/* Node.js */}
              <div className="tech-icon flex flex-col items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <i className="fab fa-node text-3xl text-green-500 drop-shadow-md"></i>
                </div>
                <span className="text-xs font-medium text-sub">Node.js</span>
              </div>

              {/* Express */}
              <div className="tech-icon flex flex-col items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 drop-shadow-md text-txt"
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
                </div>
                <span className="text-xs font-medium text-sub">Express</span>
              </div>

              {/* MongoDB */}
              <div className="tech-icon hover-bounce flex flex-col items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <i className="fas fa-database text-3xl text-green-600 drop-shadow-md"></i>
                </div>
                <span className="text-xs font-medium text-sub">MongoDB</span>
              </div>

              {/* Mongoose */}
              <div className="tech-icon hover-bounce flex flex-col items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <span className="text-3xl font-bold text-[#880000] drop-shadow-md tracking-tighter">M</span>
                </div>
                <span className="text-xs font-medium text-sub">Mongoose</span>
              </div>
              {/* Firebase */}
              <div className="tech-icon flex flex-col items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg className="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.89 15.67L6.23 3.08L9.23 9.08L3.89 15.67Z" fill="#FFA000" />
                    <path d="M16.71 14.5L14.47 2L12 6.5L9.23 9.08L16.71 14.5Z" fill="#F57C00" />
                    <path d="M16.71 14.5L12 18.5L3.89 15.67L12 6.5L16.71 14.5Z" fill="#FFCA28" />
                    <path d="M12 18.5L16.71 14.5L18.35 15.5L12 22L5.65 15.5L3.89 15.67L12 18.5Z" fill="#FFA000" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-sub">Firebase</span>
              </div>

              {/* Supabase */}
              <div className="tech-icon flex flex-col items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg className="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3 21.88C12.77 22.47 11.77 22.1 11.77 21.31V12.76H18.87C19.87 12.76 20.42 13.96 19.77 14.67L13.3 21.88Z" fill="#3ECF8E" />
                    <path d="M10.7 2.12C11.23 1.53 12.23 1.9 12.23 2.69V11.24H5.13C4.13 11.24 3.58 10.04 4.23 9.33L10.7 2.12Z" fill="#3ECF8E" opacity="0.6" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-sub">Supabase</span>
              </div>
              {/* Tailwind CSS */}
              <div className="tech-icon flex flex-col items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg className="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6C9.33 6 7.67 7.33 7 10C8 8 9.22 7.56 10.67 8.11C11.52 8.42 12.11 9.01 12.77 9.67C13.89 10.79 15.22 12 18 12C20.67 12 22.33 10.67 23 8C22 10 20.78 10.44 19.33 9.89C18.48 9.58 17.89 8.99 17.23 8.33C16.11 7.21 14.78 6 12 6ZM7 12C4.33 12 2.67 13.33 2 16C3 14 4.22 13.56 5.67 14.11C6.52 14.42 7.11 15.01 7.77 15.67C8.89 16.79 10.22 18 13 18C15.67 18 17.33 16.67 18 14C17 16 15.78 16.44 14.33 15.89C13.48 15.58 12.89 14.99 12.23 14.33C11.11 13.21 9.78 12 7 12Z" fill="#06B6D4" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-sub">Tailwind</span>
              </div>
              {/* Git */}
              <div className="tech-icon flex flex-col items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <i className="fab fa-git-alt text-3xl text-orange-600 drop-shadow-md"></i>
                </div>
                <span className="text-xs font-medium text-sub">Git</span>
              </div>

              {/* GitHub */}
              <div className="tech-icon flex flex-col items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <i className="fab fa-github text-3xl text-txt drop-shadow-md"></i>
                </div>
                <span className="text-xs font-medium text-sub">GitHub</span>
              </div>

              {/* Postman */}
              <div className="tech-icon flex flex-col items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg className="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="12" fill="#FF6C37" />
                    <path d="M16.5 7.5L12 12L9.5 9.5L7 12L9.5 14.5L12 12L16.5 16.5L19 14L16.5 11.5L14 9L16.5 7.5Z" fill="white" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-sub">Postman</span>
              </div>
            </div>
          </div>

          {/* Experience Card */}
          <div
            className="bento-card md:col-span-3 rounded-[2rem] p-6 reveal flex flex-col"
          >
            <h3 className="font-bold text-xl mb-5 flex items-center gap-3">
              <span className="text-accent text-2xl">
                <i className="fas fa-briefcase"></i>
              </span>
              <span className="text-gradient">Experience</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {config.experience && config.experience.map((exp, index) => (
                <div
                  key={index}
                  className="group relative bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 hover:border-accent dark:hover:border-accent transition-all duration-300"
                >
                  <div className="flex flex-col gap-3">
                    <div>
                      {/* Role Title - Default */}
                      <h4 className="text-base font-bold text-txt leading-tight">{exp.role}</h4>
                      {/* Duration - Default */}
                      <span className="text-xs text-accent font-medium">{exp.duration}</span>
                    </div>

                    {/* Rest - Default Colors */}
                    <div className="flex flex-col gap-1.5 text-sm text-sub">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-building text-xs text-accent w-4"></i>
                        <span>{exp.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-xs text-accent w-4"></i>
                        <span>{exp.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-laptop-code text-xs text-accent w-4"></i>
                        <span>{exp.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GitHub Stats Section */}
          <div
            className="bento-card md:col-span-3 rounded-[2rem] p-4 reveal flex flex-col"
          >
            <h3 className="font-bold text-xl mb-1 flex items-center gap-3">
              <span className="text-accent text-2xl">
                <i className="fab fa-github"></i>
              </span>
              <span className="text-gradient">GitHub Stats</span>
              <a
                href={config.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs font-medium text-sub hover:text-accent transition-colors flex items-center gap-1"
              >
                <span>View Profile</span>
                <i className="fas fa-external-link-alt text-[10px]"></i>
              </a>
            </h3>
            <p className="text-xs text-sub mb-3 ml-8 text-gradient flex items-center gap-2">
              Proof I am a Developer
              <img src="https://media.giphy.com/media/WUlplcMpOCEmTGBtBW/giphy.gif" alt="Coding" className="w-8 h-8 -ml-1 animate-bounce rounded-full" />
            </p>

            {/* Stats Grid - Top Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {/* GitHub Stats Card */}
              <div className="group relative bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-2 border border-zinc-200 dark:border-zinc-800 hover:border-accent dark:hover:border-accent transition-all duration-300 flex items-center justify-center overflow-hidden min-h-[140px]">
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 animate-pulse"></div>
                <img
                  src={`https://github-readme-stats-eight-theta.vercel.app/api?username=${GITHUB_USERNAME}&show_icons=true&hide_border=true&include_all_commits=true&count_private=true&bg_color=00000000&theme=${theme === 'dark' ? 'tokyonight' : 'default'}&title_color=${theme === 'dark' ? '' : 'b45309'}&text_color=${theme === 'dark' ? '' : '1f2937'}&icon_color=${theme === 'dark' ? '' : 'd97706'}&ring_color=${theme === 'dark' ? '' : 'd97706'}`}
                  alt="GitHub Stats"
                  className="w-full max-w-[320px] h-auto transition-all duration-500 group-hover:scale-105 relative z-10"
                  loading="lazy"
                  onLoad={(e) => e.target.previousElementSibling.style.display = 'none'}
                />
              </div>

              {/* Top Languages Card */}
              <div className="group relative bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-2 border border-zinc-200 dark:border-zinc-800 hover:border-accent dark:hover:border-accent transition-all duration-300 flex items-center justify-center overflow-hidden min-h-[140px]">
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 animate-pulse"></div>
                <img
                  src={`https://github-readme-stats-eight-theta.vercel.app/api/top-langs/?username=${GITHUB_USERNAME}&layout=compact&langs_count=6&hide_border=true&bg_color=00000000&theme=${theme === 'dark' ? 'tokyonight' : 'default'}&title_color=${theme === 'dark' ? '' : 'b45309'}&text_color=${theme === 'dark' ? '' : '1f2937'}`}
                  alt="Top Languages"
                  className="w-full max-w-[320px] h-auto transition-all duration-500 group-hover:scale-105 relative z-10"
                  loading="lazy"
                  onLoad={(e) => e.target.previousElementSibling.style.display = 'none'}
                />
              </div>
            </div>

            {/* GitHub Streak Card - Below */}
            <div className="group relative bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-2 border border-zinc-200 dark:border-zinc-800 hover:border-accent dark:hover:border-accent transition-all duration-300 flex items-center justify-center overflow-hidden min-h-[140px]">
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 animate-pulse"></div>
              <img
                src={`https://github-readme-streak-stats-nnqf.vercel.app?user=${GITHUB_USERNAME}&hide_border=true&background=00000000&theme=${theme === 'dark' ? 'tokyonight' : 'default'}&ring=${theme === 'dark' ? '' : 'd97706'}&fire=${theme === 'dark' ? '' : 'd97706'}&currStreakLabel=${theme === 'dark' ? '' : 'd97706'}&currStreakNum=${theme === 'dark' ? '' : '1f2937'}&sideLabels=${theme === 'dark' ? '' : '1f2937'}&sideNums=${theme === 'dark' ? '' : '1f2937'}&dates=${theme === 'dark' ? '' : '57534e'}`}
                alt="GitHub Streak"
                className="w-full max-w-[450px] h-auto transition-all duration-500 group-hover:scale-105 relative z-10"
                loading="lazy"
                onLoad={(e) => e.target.previousElementSibling.style.display = 'none'}
              />
            </div>
          </div>

          {/* Projects Card */}
          <div
            className="bento-card md:col-span-3 rounded-[2rem] p-6 reveal flex flex-col"
          >
            <h3 className="font-bold text-xl mb-5 flex items-center gap-3">
              <span className="text-accent text-2xl">
                <i className="fas fa-code"></i>
              </span>
              <span className="text-gradient">Projects</span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {config.projects && config.projects.map((project, index) => (
                <div
                  key={index}
                  className="group relative bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 hover:border-accent dark:hover:border-accent transition-all duration-300"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                          <i className="fas fa-rocket text-accent text-lg"></i>
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-txt">{project.title}</h4>
                          <span className="inline-block px-2 py-0.5 mt-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                            {project.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-sm text-sub">{project.description}</p>
                    )}

                    {project.tech && project.tech.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.tech.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="px-2 py-1 rounded-md text-[10px] font-medium bg-zinc-200 dark:bg-zinc-800 text-sub"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Links Section */}
          <div
            className="bento-card md:col-span-3 rounded-[2rem] p-6 reveal"
          >
            <h3 className="font-bold text-xl mb-5 flex items-center gap-3">
              <span className="text-accent text-2xl">
                <i className="fas fa-share-nodes"></i>
              </span>
              <span className="text-gradient">Connect With Me</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Email */}
              <a
                href={`mailto:${config.socials.email}`}
                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-red-500 dark:hover:border-red-500 group transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                  <i className="fas fa-envelope"></i>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-sm text-txt">Email</span>
                  <span className="text-xs text-sub group-hover:text-red-500 transition-colors">Message</span>
                </div>
              </a>

              {/* LinkedIn */}
              <a
                href={config.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-600 group transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <i className="fab fa-linkedin-in"></i>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-sm text-txt">LinkedIn</span>
                  <span className="text-xs text-sub group-hover:text-blue-600 transition-colors">Connect</span>
                </div>
              </a>

              {/* GitHub */}
              <a
                href={config.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-600 dark:hover:border-zinc-400 group transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-icon-bg text-icon-txt flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-black group-hover:text-white transition-all duration-300">
                  <i className="fab fa-github"></i>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-sm text-txt">GitHub</span>
                  <span className="text-xs text-sub group-hover:text-txt transition-colors">View Code</span>
                </div>
              </a>

              {/* Twitter */}
              <a
                href={config.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-600 dark:hover:border-zinc-400 group transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-icon-bg text-icon-txt flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-black group-hover:text-white transition-all duration-300">
                  <i className="fa-brands fa-x-twitter"></i>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-sm text-txt">Twitter</span>
                  <span className="text-xs text-sub group-hover:text-txt transition-colors">Follow</span>
                </div>
              </a>
            </div>
          </div>

          {/* Bottom Tagline */}
          <div className="md:col-span-3 text-center py-6 -mb-2 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <p className="text-accent text-sm font-medium tracking-wide">
              Learning · Building · Improving
            </p>
            <p className="text-accent text-sm mt-1">
              {config.status}
            </p>
          </div>
          {/* Divider Line */}
          <div className="md:col-span-3">
            <hr className="border-t border-zinc-200 dark:border-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
