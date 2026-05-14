import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // or a loader

  if (!session) {
    // Redirect unauthenticated users to the closest login page based on where they came from
    if (location.pathname.startsWith("/vendor")) {
      return <Navigate to="/vendor-login" replace />;
    }
    return <Navigate to="/user-login" replace />;
  }

  return children;
}
