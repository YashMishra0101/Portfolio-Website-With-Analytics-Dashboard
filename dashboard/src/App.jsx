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
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useEffect, useState } from "react";

// Auth Guard Wrapper
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Session Expiry Check (12 days)
      const sessionStart = localStorage.getItem("sessionStart");
      const twelveDaysMs = 12 * 24 * 60 * 60 * 1000;

      if (
        currentUser &&
        sessionStart &&
        Date.now() - parseInt(sessionStart, 10) > twelveDaysMs
      ) {
        await signOut(auth);
        localStorage.removeItem("sessionStart");
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-emerald-500 font-mono">
        INITIALIZING SECURITY LINK...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
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
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
