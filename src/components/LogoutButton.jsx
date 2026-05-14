import { supabase } from "../supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const onLogout = async () => {
    await supabase.auth.signOut();

    // If on vendor paths, go vendor-login; else user-login
    if (location.pathname.startsWith("/vendor")) {
      navigate("/vendor-login", { replace: true });
    } else {
      navigate("/user-login", { replace: true });
    }
  };

  return (
    <button
      onClick={onLogout}
      className="px-4 py-2 rounded bg-red-600 text-white"
    >
      Logout
    </button>
  );
}
