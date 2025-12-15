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
import Security from "./pages/Security";

// Auth Guard Wrapper
const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem("isAdmin");
  const sessionExpiry = localStorage.getItem("sessionExpiry");

  if (!isAuth) {
    return <Navigate to="/" />;
  }

  // Check if session has expired
  if (sessionExpiry && Date.now() > parseInt(sessionExpiry, 10)) {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("sessionExpiry");
    localStorage.removeItem("adminSession");
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
          <Route index element={<Summary />} />
          <Route path="visitors" element={<Visitors />} />
          <Route path="security" element={<Security />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
