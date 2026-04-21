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

// Admin-only Auth Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-emerald-500 font-mono text-xs tracking-widest">
        LOADING DASHBOARD...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  // Validate security key + session expiry
  const securityVerified = localStorage.getItem("securityKeyVerified");
  const sessionExpiry = localStorage.getItem("sessionExpiry");
  const now = Date.now();

  const isSessionExpired = !sessionExpiry || now > parseInt(sessionExpiry);

  if (securityVerified !== "true" || isSessionExpired) {
    signOut(auth).then(() => {
      localStorage.removeItem("securityKeyVerified");
      localStorage.removeItem("sessionExpiry");
      clearStoredAdminSession();
    }).catch(console.error);

    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  );
}

export default App;
