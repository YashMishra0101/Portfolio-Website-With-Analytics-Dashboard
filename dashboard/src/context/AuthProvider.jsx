import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext({
  user: null,
  role: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      // Session Expiry Check (12 days)
      const sessionStart = localStorage.getItem("sessionStart");
      const twelveDaysMs = 12 * 24 * 60 * 60 * 1000;

      if (
        currentUser &&
        sessionStart &&
        Date.now() - parseInt(sessionStart, 10) > twelveDaysMs
      ) {
        const { signOut } = await import("firebase/auth");
        await signOut(auth);
        localStorage.removeItem("sessionStart");
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      if (currentUser) {
        setUser(currentUser);
        // Fetch role from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.email));
          if (userDoc.exists()) {
            setRole(userDoc.data().role || "viewer");
          } else {
            setRole("viewer");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole("viewer");
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
