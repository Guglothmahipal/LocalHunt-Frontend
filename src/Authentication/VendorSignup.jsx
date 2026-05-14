import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { normalizePhoneClient } from "../api";
import "bootstrap/dist/css/bootstrap.min.css";
import Lottie from "lottie-react";
import { MdVerified, MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";
import VendorAnimation from "../assets/LottieAnimations/vendorsignup.json";
import "../style.css";

export default function VendorSignup() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let interval = null;
    if (otpSent && timer > 0 && !isVerified) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && otpSent && !isVerified) {
      setOtpSent(false);
      setMsg("OTP expired. Please resend.");
    }
    return () => clearInterval(interval);
  }, [otpSent, timer, isVerified]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    setPhone(value);
  };

  const handleSendOtp = async () => {
    setMsg("");
    setIsVerified(false);
    if (!phone || phone.length !== 10)
      return setMsg("Enter a valid 10-digit phone number.");
    const normalized = normalizePhoneClient(phone);
    setBusy(true);
    try {
      const res = await fetch("https://localhunt.onrender.com/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setTimer(120);
        setMsg("OTP sent to " + normalized);
        setShowOtpModal(true);
      } else {
        setMsg(data.error || data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      setMsg("Network error while sending OTP");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setMsg("");
    if (!otpSent) return setMsg("Please send OTP first.");
    if (!otp) return setMsg("Please enter the OTP you received.");
    const normalized = normalizePhoneClient(phone);
    setBusy(true);
    try {
      const res = await fetch("https://localhunt.onrender.com/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized, otp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsVerified(true);
        setTimer(0);
        setShowOtpModal(false);
      } else {
        setIsVerified(false);
        setMsg(data.message || data.error || "OTP verification failed");
      }
    } catch (err) {
      console.error(err);
      setMsg("Network error while verifying OTP");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!isVerified)
      return setMsg("Please verify your phone before creating account.");
    if (!name || !phone || !password || !confirm)
      return setMsg("Please fill required fields.");
    if (password !== confirm) return setMsg("Passwords do not match.");

    const normalized = normalizePhoneClient(phone);
    const sendEmail = email && email.trim() ? email.trim().toLowerCase() : null;
    setBusy(true);
    try {
      const sres = await fetch("https://localhunt.onrender.com/signup/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          phone: normalized,
          email: sendEmail,
          password,
        }),
      });
      const sdata = await sres.json();
      if (sres.ok && sdata.success) {
        setMsg("Vendor account created successfully! Redirecting...");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setMsg(`Signup failed: ${sdata.message || sdata.error}`);
      }
    } catch (err) {
      console.error(err);
      setMsg("Network error during signup");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="vendorsignup-main">
      <section className="vendorsignup-content left">
        <Lottie
          animationData={VendorAnimation}
          loop={true}
          autoplay={true}
          style={{
            position: "absolute",
            height: "60%",
            width: "60%",
            marginTop: "140px",
            marginLeft: "-100px",
          }}
          className="signupanim"
        />
      </section>

      <section className="vendorsignup-content-right">
        <div className="vendor-form-main">
          <div className="vendor-form-container">
            <h2>Vendor Signup</h2>
            <form className="vendor-form" onSubmit={handleSubmit}>
              <label>Full Name / Business Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name / business name"
                required
              />

              <label>Mobile Number</label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Enter 10-digit number"
                maxLength={10}
                required
                disabled={isVerified}
              />

              {/* ✅ Show "Send OTP" only if not verified */}
              {!isVerified ? (
                <button
                  type="button"
                  className="create-account-btn mt-2"
                  onClick={handleSendOtp}
                  disabled={busy}
                >
                  {busy ? "Sending..." : "Send OTP"}
                </button>
              ) : (
                <div style={{ color: "green", fontWeight: "500" }}>
                  <MdVerified /> Mobile number verified
                </div>
              )}

              <label>Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email (optional)"
              />

              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
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
                  className="eyeicon"
                >
                  {showPassword ? (
                    <MdOutlineVisibilityOff size={20} color="#111" />
                  ) : (
                    <MdOutlineVisibility size={20} color="#111" />
                  )}
                </button>
              </div>

              <label>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  required
                  style={{ width: "100%" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
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
                  className="eyeicon"
                >
                  {showConfirmPassword ? (
                    <MdOutlineVisibilityOff size={20} color="#111" />
                  ) : (
                    <MdOutlineVisibility size={20} color="#111" />
                  )}
                </button>
              </div>

              <button
                type="submit"
                className="create-account-btn mt-3"
                disabled={busy || !isVerified}
              >
                {busy ? "Creating..." : "Create Account"}
              </button>

              {msg && <div style={{ marginTop: 12 }}>{msg}</div>}

              <div className="signup-link" style={{ marginTop: 12 }}>
                Already registered? <Link to="/login">Login</Link>
              </div>
            </form>
          </div>
        </div>
      </section>
      {/* 🟡 OTP Modal */}
      {showOtpModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal">
            <h4>Enter OTP</h4>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="otp-input"
            />

            {/* ⏳ Timer or Expired Message */}
            {!isVerified && timer > 0 ? (
              <p className="otp-timer">⏳ Expires in {formatTime(timer)}</p>
            ) : (
              <p className="otp-expired-text" style={{ color: "red" }}>
                OTP expired. Please resend.
              </p>
            )}

            {msg && <p className="otp-msg">{msg}</p>}

            <div className="otp-actions">
              <button
                className="verify-btn"
                onClick={handleVerifyOtp}
                disabled={busy || isVerified || timer === 0}
              >
                {busy ? "Verifying..." : "Verify OTP"}
              </button>

              {/* 🆕 Show this only when timer expired */}
              {timer === 0 && !isVerified && (
                <button
                  className="resend-btn"
                  onClick={handleSendOtp}
                  disabled={busy}
                >
                  {busy ? "Resending..." : "Resend OTP"}
                </button>
              )}

              <button className="cancel-btn" onClick={() => setShowOtpModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}