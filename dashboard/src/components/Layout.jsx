import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Audit Log
    try {
      await addDoc(collection(db, "admin_logs"), {
        action: "LOGOUT",
        status: "SUCCESS",
        userId: "admin",
        timestamp: serverTimestamp(),
      });
    } catch (err) {}

    localStorage.removeItem("isAdmin");
    navigate("/");
  };

  return (
    <div className="min-h-screen font-sans flex bg-zinc-950">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
