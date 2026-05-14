// src/Components/ForgetPassword.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import ResetAnimation from "../assets/LottieAnimations/LoginAnimation.json";
import "../style.css";

const API_BASE = "https://localhunt.onrender.com";

export default function ForgetPassword() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let it = null;
    if (otpSent && timer > 0) it = setInterval(() => setTimer((t) => t - 1), 1000);
    else if (timer === 0 && otpSent) setOtpSent(false);
    return () => clearInterval(it);
  }, [otpSent, timer]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handlePhoneChange = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(v);
  };

  // Helper: normalize phone format
  const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;

  const handleSendOtp = async () => {
    setMsg("");
    if (phone.length !== 10 && !phone.startsWith("+91")) return setMsg("Enter a valid 10-digit mobile number.");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setTimer(data.expires_in || 120);
        setShowOtpModal(true);
        setMsg(data.message || "OTP sent successfully");
      } else {
        setMsg(data.message || data.error || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setMsg("");
    if (!otpSent) return setMsg("Send OTP first.");
    if (!otp) return setMsg("Enter OTP.");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/password-reset/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone, otp }),
      });
      const data = await res.json();
      console.log("Verify response:", data);

      if (res.ok && data.success && data.token) {
        navigate("/reset-password", { state: { phone: formattedPhone, token: data.token } });
      } else {
        setMsg(data.message || "OTP verify failed");
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
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
            <h2>Forgot Password</h2>

            <form className="login-form" onSubmit={(e) => e.preventDefault()}>
              <label>Mobile Number</label>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Enter 10-digit mobile number"
              />

              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="create-account-btn"
                  onClick={handleSendOtp}
                  disabled={busy}
                >
                  {busy ? "Sending..." : "Send OTP"}
                </button>
              </div>

              <div style={{ marginTop: 14 }}>{msg && <div>{msg}</div>}</div>

              <div className="signup-link mt-3">
                Remembered? <Link to="/login">Login</Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="login-card-right">
        <Lottie animationData={ResetAnimation} loop autoplay />
      </div>

      {showOtpModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal">
            <h4>Enter OTP</h4>
            <input
              className="otp-input"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter OTP"
            />
            {timer > 0 ? (
              <p className="otp-timer">⏳ Expires in {formatTime(timer)}</p>
            ) : (
              <p className="otp-expired-text">OTP expired</p>
            )}
            <div className="otp-actions">
              <button className="verify-btn" onClick={handleVerifyOtp} disabled={busy}>
                {busy ? "Verifying..." : "Verify OTP"}
              </button>
              <button className="cancel-btn" onClick={() => setShowOtpModal(false)}>
                Cancel
              </button>
            </div>
            {msg && <p className="otp-msg">{msg}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
