// src/Components/ResetPassword.jsx
import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Lottie from "lottie-react";
import ResetAnimation from "../assets/LottieAnimations/LoginAnimation.json";
import "../style.css";

const API_BASE = "https://localhunt.onrender.com";

export default function ResetPassword() {
  const loc = useLocation();
  const navigate = useNavigate();
  // token & phone can be passed via state or query param
  const passed = (loc.state && (loc.state.token && loc.state.phone)) ? loc.state : {};
  const [token] = useState(passed.token || new URLSearchParams(loc.search).get("token") || "");
  const [phone] = useState(passed.phone || new URLSearchParams(loc.search).get("phone") || "");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!password || !confirm) return setMsg("Enter and confirm password.");
    if (password !== confirm) return setMsg("Passwords do not match.");
    if (!token || !phone) return setMsg("Missing reset token; please request a new OTP.");

    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/password-reset/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, token, new_password: password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg("Password updated. Redirecting to Login...");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setMsg(data.message || "Reset failed");
      }
    } catch (err) {
      console.error(err);
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="login-main">
      <div className="login-card-left">
        <div className="login-card">
          <div className="login-form-container">
            <h2>Reset Password</h2>

            <form className="login-form" onSubmit={handleReset}>
              <label>New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

              <label>Confirm Password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

              <button type="submit" className="create-account-btn" disabled={busy}>
                {busy ? "Saving..." : "Reset Password"}
              </button>

              {msg && <div style={{ marginTop: 12 }}>{msg}</div>}
              <div className="signup-link mt-3">Back to <Link to="/login">Login</Link></div>
            </form>
          </div>
        </div>
      </div>

      <div className="login-card-right">
        <Lottie animationData={ResetAnimation} loop autoplay />
      </div>
    </section>
  );
}
