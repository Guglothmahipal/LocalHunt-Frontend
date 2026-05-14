// src/Components/Login.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Lottie from "lottie-react";
import Loginanim from "../assets/Loginanim.json";
import { MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";
import "../style.css";
import { useAuth } from "../context/AuthProvider";

const API_BASE = "https://localhunt.onrender.com";
// const API_BASE = "https://localhunt-api-129045603061.asia-south1.run.app";

export default function Login() {
  const [activeTab, setActiveTab] = useState("email");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    let interval = null;
    if (otpSent && timer > 0 && !isVerified) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && otpSent && !isVerified) {
      setOtpSent(false);
      setMsg("OTP expired. Please resend.");
      setShowOtpModal(false);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer, isVerified]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const destinationAfterLogin = (redirectFromBackend) =>
    location.state?.from?.pathname || redirectFromBackend || "/user-dashboard";

  // --- Email + Password
  async function handleEmailLogin(e) {
    e.preventDefault();
    setMsg("");
    if (!email || !password) return setMsg("Enter email and password.");
    const sendEmail = email.trim().toLowerCase();
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/login/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sendEmail, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const token = data.token || null;
        const userObj = data.data || data; // tolerate different shapes
        await login(userObj, token);
        navigate(destinationAfterLogin(), { replace: true });
      } else {
        setMsg(data.message || "Login failed.");
      }
    } catch (err) {
      console.error(err);
      setMsg("Server unreachable.");
    } finally {
      setBusy(false);
    }
  }

  // --- Mobile + Password
  async function handlePhoneLogin(e) {
    e.preventDefault();
    setMsg("");
    if (mobile.length !== 10 || !password) return setMsg("Enter valid mobile & password.");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/login/phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "+91" + mobile, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const token = data.token || null;
        // ✅ Extract user data from the same structure as email login
        const userObj = data.data || data; // This will now work consistently
        await login(userObj, token);
        navigate(destinationAfterLogin(), { replace: true });
      } else {
        setMsg(data.message || "Login failed.");
      }
    } catch (err) {
      console.error(err);
      setMsg("Server unreachable.");
    } finally {
      setBusy(false);
    }
  }

  // --- Send OTP (mobile login)
  async function handleSendOtp() {
    setMsg("");
    if (mobile.length !== 10) return setMsg("Enter valid 10-digit mobile number.");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/login/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "+91" + mobile }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setTimer(data.expires_in || 120);
        setShowOtpModal(true);
        setMsg(data.message || "OTP sent.");
      } else {
        setMsg(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      console.error(err);
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  // --- Verify OTP (mobile login)
  async function handleVerifyOtp(e) {
    e && e.preventDefault();
    if (!otpSent) return setMsg("Send OTP first.");
    if (!otp) return setMsg("Enter OTP.");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/login/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "+91" + mobile, otp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsVerified(true);
        const token = data.token || null;
        // ✅ Ensure we extract user data consistently
        const userObj = data.data || data;
        await login(userObj, token);
        setMsg("✅ Mobile verified — redirecting...");
        setShowOtpModal(false);
        setTimeout(() => navigate(destinationAfterLogin(), { replace: true }), 800);
      } else {
        setMsg(data.message || "Invalid OTP.");
      }
    } catch (err) {
      console.error(err);
      setMsg("Server unreachable.");
    } finally {
      setBusy(false);
    }
  }

  // inline styles for small modal overlay (no CSS changes required)
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
  };
  const modalStyle = {
    width: "320px",
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
    textAlign: "center",
  };
  const inputStyle = { width: "100%", padding: "8px 10px", marginTop: 8, marginBottom: 12 };

  return (
    <section className="login-main">
      <div className="login-card-left">
        <div className="login-card">
          <div className="login-form-container">
            <h2>Login</h2>

            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button className={`nav-link ${activeTab === "email" ? "active" : ""}`} onClick={() => setActiveTab("email")}>
                  Email + Password
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === "mobilePass" ? "active" : ""}`} onClick={() => setActiveTab("mobilePass")}>
                  Mobile + Password
                </button>
              </li>
            </ul>

            <div className="tab-content p-2" style={{ width: "100%" }}>
              {activeTab === "email" && (
                <form className="login-form" onSubmit={handleEmailLogin}>
                  <label>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <label>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: "100%" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{
                        position: "absolute",
                        right: 8,
                        top: "35%",
                        transform: "translateY(-50%)",
                        // border: "1px solid rgba(0,0,0,0.08)",
                        backgroundColor: "transparent",

                        cursor: "pointer",
                        padding: 6,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {showPassword ? (
                        <MdOutlineVisibilityOff size={20} color="#111" />
                      ) : (
                        <MdOutlineVisibility size={20} color="#111" />
                      )}
                    </button>
                  </div>
                  {/* Forgot password link (email form) */}
                  <div className="mb-3" style={{ marginTop: 6 }}>
                    <Link to="/forgot-password" className="text-warning">Forgot your password?</Link>
                  </div>
                  <button type="submit" className="create-account-btn" disabled={busy}>{busy ? "Please wait..." : "Login"}</button>
                </form>
              )}

              {activeTab === "mobilePass" && (
                <form className="login-form" onSubmit={handlePhoneLogin}>
                  <label>Mobile Number</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="Enter 10-digit mobile number"
                  />
                  <label>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: "100%" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{
                        position: "absolute",
                        right: 8,
                        top: "35%",
                        transform: "translateY(-50%)",
                        // border: "1px solid rgba(0,0,0,0.08)",
                        backgroundColor: "transparent",
                        color: "black",
                        cursor: "pointer",
                        padding: 6,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize:"20px",
                      }}
                    >
                      {showPassword ? <MdOutlineVisibilityOff /> : <MdOutlineVisibility />}
                    </button>
                  </div>
                  {/* Forgot password link (mobile form) */}
                  <div className="mb-3" style={{ marginTop: 6 }}>
                    <Link to="/forgot-password" className="text-warning">Forgot your password?</Link>
                  </div>
                  <button type="submit" className="create-account-btn" disabled={busy}>{busy ? "Please wait..." : "Login"}</button>

                  {/* Optionally: quick link to "Login with OTP" - keep commented out unless implemented
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="create-account-btn" onClick={handleSendOtp} disabled={busy}>
                      {busy ? "Sending..." : "Login with OTP"}
                    </button>
                  </div>
                  */}
                </form>
              )}
            </div>

            {msg && <div style={{ marginTop: 12 }}>{msg}</div>}
            <div className="signup-link mt-3">Don't have an Account? <Link to="/signupchoice">Signup</Link></div>
          </div>
        </div>
      </div>

      <div className="login-card-right">
        <span className="loginanim"><Lottie animationData={Loginanim} loop autoplay /></span>
      </div>

      {/* OTP modal */}
      {showOtpModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h4>Enter OTP</h4>
            <input style={inputStyle} type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter OTP" />
            {timer > 0 ? <p style={{ margin: 0 }}>⏳ Expires in {formatTime(timer)}</p> : <p style={{ margin: 0 }}>OTP expired.</p>}
            <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "center" }}>
              <button style={{ padding: "8px 12px" }} className="create-account-btn" onClick={handleVerifyOtp} disabled={busy || isVerified}>
                {busy ? "Verifying..." : "Verify"}
              </button>
              <button style={{ padding: "8px 12px", background: "#eee", color: "#333", borderRadius: 8 }} onClick={() => { setShowOtpModal(false); }}>
                Cancel
              </button>
            </div>
            {!otpSent && <div style={{ marginTop: 8 }}><button className="create-account-btn" onClick={handleSendOtp}>Resend OTP</button></div>}
          </div>
        </div>
      )}
    </section>
  );
}
