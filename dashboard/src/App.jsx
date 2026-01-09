import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Summary from "./pages/Summary";
import Visitors from "./pages/Visitors";
import ContentManager from "./pages/ContentManager";
import Security from "./pages/Security";
import OwnerActivity from "./pages/OwnerActivity";
import { AuthProvider, useAuth } from "./context/AuthProvider";

// Auth Guard Wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, role, loading } = useAuth();

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

  if (adminOnly && role !== "admin") {
    return <Navigate to="/dashboard/analytics" />;
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
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
