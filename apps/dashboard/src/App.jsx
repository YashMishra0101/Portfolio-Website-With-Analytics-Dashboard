import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Summary from "./pages/Summary";
import Visitors from "./pages/Visitors";
import ContentManager from "./pages/ContentManager";
import Security from "./pages/Security";
import OwnerActivity from "./pages/OwnerActivity";
import VisitorManagement from "./pages/VisitorManagement";
import { AuthProvider, useAuth } from "./context/AuthProvider";
import { clearStoredAdminSession } from "./utils/sessionIdentity";

// ─── Global Auth Loading Screen ───────────────────────────────────────────────
// Shown while Firebase resolves the auth state on app load.
// Prevents login page from flashing for authenticated users.
const AuthLoadingScreen = () => (
  <div
    className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center"
    style={{
      backgroundImage:
        "radial-gradient(circle at center, #18181b 0%, #09090b 100%)",
    }}
  >
    {/* Scanline overlay — matches Login page aesthetic */}
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
        backgroundSize: "100% 2px, 3px 100%",
      }}
    />

    <div className="relative z-10 flex flex-col items-center gap-6">
      {/* Animated logo mark */}
      <div className="relative w-14 h-14 flex items-center justify-center">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 border-2 border-emerald-600/30 rounded-full" />
        <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin" />
        {/* Inner pulsing dot */}
        <div className="w-3 h-3 bg-emerald-500 rounded-sm animate-pulse" />
      </div>

      {/* Status text */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-emerald-500 font-mono text-[11px] uppercase tracking-[0.3em] font-bold">
          Authenticating
        </p>
        {/* Animated dots */}
        <div className="flex gap-1 mt-1">
          <span
            className="w-1 h-1 bg-emerald-600 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1 h-1 bg-emerald-600 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1 h-1 bg-emerald-600 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>

      <p className="text-zinc-600 font-mono text-[9px] uppercase tracking-[0.2em]">
        Portfolio Monitor · Secure Gateway
      </p>
    </div>
  </div>
);

// ─── Admin-only Protected Route Guard ─────────────────────────────────────────
// Relies solely on Firebase auth state + securityKeyVerified flag.
// No time-based expiry — users stay logged in until manual logout or
// Firebase invalidates the token (e.g. password change, account deletion).
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Loading is handled globally by AppRoutes — this is a safety fallback only
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-emerald-500 font-mono text-xs tracking-widest">
        LOADING DASHBOARD...
      </div>
    );
  }

  // No Firebase session → back to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Firebase session exists but security key was never verified in this browser
  // (handles the case where cookies/storage were cleared for securityKeyVerified only)
  const securityVerified = localStorage.getItem("securityKeyVerified");

  if (securityVerified !== "true") {
    // Sign out cleanly so Firebase session is also cleared
    signOut(auth).then(() => {
      localStorage.removeItem("securityKeyVerified");
      clearStoredAdminSession();
    }).catch(console.error);

    return <Navigate to="/" replace />;
  }

  return children;
};

// ─── App Routes (inside AuthProvider) ─────────────────────────────────────────
// Separated from App so we can call useAuth() inside the AuthProvider tree.
// The global loading gate here ensures NOTHING renders — not login, not
// dashboard — until Firebase has resolved the auth state.
function AppRoutes() {
  const { loading } = useAuth();

  // Block ALL route rendering during the auth resolution window.
  // This is the key fix for the login page flash UX issue.
  if (loading) {
    return <AuthLoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="analytics" replace />} />
        <Route path="analytics" element={<Summary />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="content" element={<ContentManager />} />
        <Route path="security" element={<Security />} />
        <Route path="owner-activity" element={<OwnerActivity />} />
        <Route path="visitor-management" element={<VisitorManagement />} />
      </Route>
    </Routes>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
