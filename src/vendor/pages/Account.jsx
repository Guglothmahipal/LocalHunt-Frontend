  // src/vendor/pages/Account.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { motion } from "framer-motion";
const BACKEND_BASE = "http://127.0.0.1:5000";

const Account = ({ onClose }) => {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [otpStep, setOtpStep] = useState("none"); // none | verifyOld | verifyNew
  const [otp, setOtp] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const shopId = localStorage.getItem("shopId");

  useEffect(() => {
    async function fetchVendor() {
      setLoading(true);
      const { data: shopData } = await supabase
        .from("shops")
        .select("vendor_id")
        .eq("id", shopId)
        .single();

      if (!shopData) {
        setLoading(false);
        return;
      }

      const { data: vendorData } = await supabase
        .from("vendors")
        .select("*")
        .eq("id", shopData.vendor_id)
        .single();

      if (vendorData) {
        setVendor(vendorData);
        setName(vendorData.full_name);
        setEmail(vendorData.email);
        setPhone(vendorData.phone);
      }
      setLoading(false);
    }
    if (shopId) fetchVendor();
  }, [shopId]);

  // format phone for display / backend call (same logic used earlier)
  const formatPhone = (num) => {
    if (!num) return "";
    if (num.startsWith("+")) return num;
    if (num.startsWith("91")) return `+${num}`;
    if (num.length === 10) return `+91${num}`;
    return num;
  };

  // Save name/email only (no phone alert)
  const handleProfileUpdate = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/profile/update_profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor.id,
          full_name: name,
          email: email,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // update local vendor copy
        setVendor((v) => ({ ...v, full_name: name, email }));
        setEditing(false);
        // show a subtle confirmation (no mobile alert)
        alert("Profile updated successfully.");
      } else {
        alert(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while updating profile");
    }
  };

  // OTP flows
  const sendOtpToCurrent = async () => {
    const formattedPhone = formatPhone(phone);
    try {
      const res = await fetch(`${BACKEND_BASE}/profile/send_otp_current`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpStep("verifyOld");
        setOtp("");
        // Subtle message
        alert(`OTP sent to ${formattedPhone}`);
      } else {
        alert(data.error || "Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      alert("Network error sending OTP");
    }
  };

  const verifyOldOtp = async () => {
    const formattedPhone = formatPhone(phone);
    try {
      const res = await fetch(`${BACKEND_BASE}/profile/verify_current_otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtp("");
        setOtpStep("verifyNew");
        alert("Old number verified. Enter new number below.");
      } else {
        alert(data.error || "OTP verify failed");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while verifying OTP");
    }
  };

  const sendOtpToNew = async () => {
    const formattedNew = formatPhone(newPhone);
    try {
      const res = await fetch(`${BACKEND_BASE}/profile/send_otp_new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_phone: formattedNew, vendor_id: vendor.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtp(""); // clear previous OTP
        alert(`OTP sent to ${formattedNew}`);
      } else {
        alert(data.error || "Failed to send OTP to new number");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while sending OTP");
    }
  };

  const verifyNewOtp = async () => {
    const formattedNew = formatPhone(newPhone);
    try {
      const res = await fetch(`${BACKEND_BASE}/profile/verify_new_phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_phone: formattedNew, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpStep("none");
        setOtp("");
        setNewPhone("");
        setPhone(formattedNew); // update displayed phone
        // update vendor locally
        setVendor((v) => ({ ...v, phone: formattedNew }));
        // subtle confirmation
        alert("Phone number updated successfully.");
      } else {
        alert(data.error || "Failed to verify new number");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while verifying new number");
    }
  };

  // Update Password (only shown when showPasswordForm true)
  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword) {
      alert("Enter both current and new password.");
      return;
    }
    setPasswordUpdating(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/profile/update_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor.id,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setShowPasswordForm(false);
      } else {
        alert(data.error || "Failed to update password");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while updating password");
    } finally {
      setPasswordUpdating(false);
    }
  };

  if (loading) return <p>Loading account...</p>;

  return (
 
        <motion.div
      key="accountBox"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{
        borderRadius: 16,
        width: 840,
        background: "#212121",
        border: "1.5px solid #444",
        boxShadow: "0 2px 28px 0 rgb(0 0 0 / 23%)",
        padding: "28px 38px 28px 38px",
        color: "#fff",
        position: "relative",
        maxHeight: "85vh",
        overflowY: "auto",
      }}
    >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: 16,
            top: 18,
            background: "transparent",
            border: "none",
            fontSize: 26,
            cursor: "pointer",
            color: "#ffc908",
          }}
        >
          ×
        </button>

        <h2 style={{ color: "#ffc908", marginBottom: 24, fontWeight: 700 }}>
          Account Details
        </h2>

        {!vendor && <div>No vendor profile found.</div>}

        {vendor && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3>Profile Info</h3>
              <button
                onClick={() => setEditing(!editing)}
                style={{
                  background: "#ffc908",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 12px",
                  cursor: "pointer",
                  color: "#000",
                  fontWeight: 600,
                }}
              >
                {editing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "#ffe066" }}>Name:</label>
              <input
                value={name}
                disabled={!editing}
                onChange={(e) => setName(e.target.value)}
                style={{
                  marginLeft: 10,
                  background: "transparent",
                  border: editing ? "1px solid #ffc908" : "none",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 4,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "#ffe066" }}>Email:</label>
              <input
                value={email}
                disabled={!editing}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  marginLeft: 10,
                  background: "transparent",
                  border: editing ? "1px solid #ffc908" : "none",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 4,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "#ffe066" }}>Phone:</label>
              <input
                value={phone}
                disabled
                style={{
                  marginLeft: 10,
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 4,
                }}
              />
              {editing && (
                <button
                  onClick={sendOtpToCurrent}
                  style={{
                    marginLeft: 12,
                    background: "#444",
                    color: "#ffc908",
                    border: "1px solid #ffc908",
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  Update Number
                </button>
              )}
            </div>

            {editing && otpStep === "verifyOld" && (
              <div>
                <p>Enter OTP sent to your current number:</p>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ padding: "5px", marginRight: 10, borderRadius: 4 }}
                />
                <button
                  onClick={verifyOldOtp}
                  style={{
                    background: "#ffc908",
                    border: "none",
                    borderRadius: 4,
                    padding: "5px 10px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Verify OTP
                </button>
              </div>
            )}

            {editing && otpStep === "verifyNew" && (
              <div style={{ marginTop: 10 }}>
                <p>Enter your new phone number (10 digits):</p>
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  style={{ padding: "5px", borderRadius: 4, marginRight: 10 }}
                />
                <button
                  onClick={sendOtpToNew}
                  style={{
                    background: "#444",
                    color: "#ffc908",
                    border: "1px solid #ffc908",
                    borderRadius: 4,
                    padding: "5px 10px",
                    cursor: "pointer",
                  }}
                >
                  Send OTP
                </button>

                <div style={{ marginTop: 10 }}>
                  <p>Verify OTP for new number:</p>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{ padding: "5px", marginRight: 10, borderRadius: 4 }}
                  />
                  <button
                    onClick={verifyNewOtp}
                    style={{
                      background: "#ffc908",
                      border: "none",
                      borderRadius: 4,
                      padding: "5px 10px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Verify New Number
                  </button>
                </div>
              </div>
            )}

            {editing && (
              <button
                onClick={handleProfileUpdate}
                style={{
                  background: "#ffc908",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: 16,
                }}
              >
                Save Changes
              </button>
            )}

            <hr style={{ margin: "20px 0", borderColor: "#555" }} />

            {/* Password: only show when user clicks toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Update Password</h3>
              <button
                onClick={() => setShowPasswordForm((s) => !s)}
                style={{
                  background: "#ffc908",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 12px",
                  cursor: "pointer",
                  color: "#000",
                  fontWeight: 600,
                }}
              >
                {showPasswordForm ? "Cancel" : "Change Password"}
              </button>
            </div>

            {showPasswordForm && (
              <div style={{ marginTop: 10 }}>
                <div style={{ marginBottom: 12 }}>
                  <label>Current Password:</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{ marginLeft: 10, padding: "4px 8px", borderRadius: 4 }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>New Password:</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ marginLeft: 26, padding: "4px 8px", borderRadius: 4 }}
                  />
                </div>
                <button
                  onClick={handlePasswordUpdate}
                  disabled={passwordUpdating}
                  style={{
                    background: "#ffc908",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {passwordUpdating ? "Updating..." : "Update Password"}
                </button>
              </div>
            )}
          </>
        )}
        </motion.div>
   
  );
};

export default Account;
