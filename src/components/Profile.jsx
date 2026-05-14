import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./profile.module.css";
import { FaCameraRetro, FaSync } from "react-icons/fa";
import { useAuth } from "../context/AuthProvider";
import { color } from "framer-motion";

const BACKEND_BASE = "https://localhunt.onrender.com";

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    avatar_url: "",
  });

  // OTP modal logic (same as for vendor)
  const [otpStep, setOtpStep] = useState("none"); // none | verifyOld | verifyNew
  const [otp, setOtp] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    if (user) initializeProfile();
  }, [user]);

  const initializeProfile = () => {
    setProfile({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      avatar_url: user.avatar_url || "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  function formatPhone(num) {
    if (!num) return "";
    if (num.startsWith("+")) return num;
    if (num.startsWith("91")) return `+${num}`;
    if (num.length === 10) return `+91${num}`;
    return num;
  }

  // --- Avatar upload (from your old code) ---
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file."); return; }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB."); return; }
    setLoading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("avatars")
        .getPublicUrl(fileName);
      const newAvatarUrl = `${publicData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: newAvatarUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (updateError) throw updateError;
      setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      updateUser({ ...user, avatar_url: newAvatarUrl });
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      toast.error("Failed to upload profile picture.");
    } finally {
      setLoading(false);
    }
  };

  // --- Email update (calls backend for email/name, NOT Supabase JS) ---
  async function updateEmailAndName() {
    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_BASE}/profile/update_user_profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          email: profile.email.trim(),
          full_name: profile.full_name.trim()
        }),
      }).then(res => res.json());
      if (resp.error) throw new Error(resp.error);
      toast.success("Profile updated successfully!");
      updateUser({ ...user, email: profile.email, full_name: profile.full_name });
      setEditing(false);
    } catch (error) {
      toast.error(error.message || "Failed to update profile.");
    }
    setLoading(false);
  }

  // --- OTP (user) logic, like vendor but different endpoints ---
  const sendOtpToCurrent = async () => {
    const formattedPhone = formatPhone(profile.phone);
    try {
      const res = await fetch(`${BACKEND_BASE}/profile/send_otp_current_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpStep("verifyOld");
        setOtp("");
        alert(`OTP sent to ${formattedPhone}`);
      } else {
        alert(data.error || "Failed to send OTP");
      }
    } catch (err) {
      alert("Network error sending OTP");
    }
  };

  const verifyOldOtp = async () => {
    const formattedPhone = formatPhone(profile.phone);
    try {
      const res = await fetch(`${BACKEND_BASE}/profile/verify_current_otp_user`, {
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
      alert("Network error while verifying OTP");
    }
  };

  const sendOtpToNew = async () => {
    const formattedNew = formatPhone(newPhone);
    try {
      const res = await fetch(`${BACKEND_BASE}/profile/send_otp_new_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_phone: formattedNew, user_id: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtp(""); // clear previous OTP
        alert(`OTP sent to ${formattedNew}`);
      } else {
        alert(data.error || "Failed to send OTP to new number");
      }
    } catch (err) {
      alert("Network error while sending OTP");
    }
  };

  const verifyNewOtp = async () => {
    const formattedNew = formatPhone(newPhone);
    try {
      const res = await fetch(`${BACKEND_BASE}/profile/verify_new_phone_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_phone: formattedNew, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpStep("none");
        setOtp("");
        setNewPhone("");
        setProfile(prev => ({ ...prev, phone: formattedNew }));
        updateUser({ ...user, phone: formattedNew });
        alert("Phone number updated successfully.");
      } else {
        alert(data.error || "Failed to verify new number");
      }
    } catch (err) {
      alert("Network error while verifying new number");
    }
  };

  const syncWithDatabase = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("full_name, email, phone, avatar_url")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      if (data) {
        const updatedProfile = {
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
        };
        setProfile(updatedProfile);
        updateUser(updatedProfile);
        toast.success("Profile synced with latest data!");
      }
    } catch (error) {
      toast.error("Failed to sync profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center mt-10">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles["profile-container"]}>
        <div className={styles["profile-card"]}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className={styles["profile-heading"]}>My Profile</h2>
            <button
              onClick={syncWithDatabase}
              className="btn btn-outline-primary btn-sm d-flex align-items-center mb-3 ms-2"
              disabled={loading}
            >
              <FaSync className={loading ? "spinning" : ""} style={{
                marginRight: '5px',
                animation: loading ? 'spin 1s linear infinite' : 'none'
              }} />
              {loading ? "Syncing..." : "Refresh"}
            </button>
          </div>
          <div className={styles["avatar-wrapper"]}>
            <img
              src={profile.avatar_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt="Avatar"
              className={styles.avatar}
            />
            {editing && (
              <label htmlFor="avatar-upload" className={styles["avatar-upload-label"]}>
                <FaCameraRetro />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className={styles["avatar-input"]}
                />
              </label>
            )}
          </div>
          <div>
            <div className={styles["form-group"]}>
              <label className={styles["form-label"]}>Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={profile.full_name}
                onChange={handleChange}
                disabled={!editing}
                className={styles["form-input"]}
                placeholder="Enter your full name"
              />
            </div>
            <div className={styles["form-group"]}>
              <label className={styles["form-label"]}>Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                disabled={!editing}
                className={styles["form-input"]}
              />
            </div>
            <div className={styles["form-group"]}>
              <label className={styles["form-label"]}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                disabled
                className={styles["form-input"]}
                placeholder="Your phone number"
              />
              {editing && (
                <button
                  onClick={sendOtpToCurrent}
                  style={{
                    marginTop: 8,
                    background: "#ffc908",
                    color: "white",
                    border: "1px solid #ffc908",
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}>
                  Update Number
                </button>
              )}
            </div>
          </div>
          <div className={styles["button-group"]}>
            {editing ? (
              <>
                <button
                  onClick={updateEmailAndName}
                  disabled={loading}
                  className={`${styles.button} ${styles["button-save"]}`}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    initializeProfile();
                  }}
                  disabled={loading}
                  className={`${styles.button} ${styles["button-cancel"]}`}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className={`${styles.button} ${styles["button-edit"]}`}
              >
                Edit Profile
              </button>
            )}
            <button
              className={`${styles.button} ${styles["button-logout"]}`}
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      {/* OTP Modal */}
      {otpStep === "verifyOld" && (
        <div style={{
          position: "fixed", zIndex: 1200, top: 0, left: 0, bottom: 0, right: 0,
          background: "rgba(30, 32, 34, 0.62)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            width: 360,
            boxShadow: "0 2px 28px 0 rgb(0 0 0 / 30%)",
            padding: "30px 30px 24px 30px",
            color: "#222",
            position: "relative",
            minHeight: 180
          }}>
            <button
              onClick={() => setOtpStep("none")}
              style={{
                position: "absolute", right: 12, top: 8,
                background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#f93"
              }}
            >×</button>
            <h4 style={{ marginBottom: 10 }}>Verify Current Number</h4>
            <input
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="Enter OTP sent to current number"
              style={{ padding: 8, borderRadius: 8, border: "1px solid #f93", width: "100%" }}
            />
            <button
              onClick={verifyOldOtp}
              style={{
                marginTop: 14,
                background: "#ffc908",
                border: "none",
                borderRadius: 8,
                padding: "8px 24px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Verify OTP
            </button>
          </div>
        </div>
      )}
      {otpStep === "verifyNew" && (
        <div style={{
          position: "fixed", zIndex: 1200, top: 0, left: 0, bottom: 0, right: 0,
          background: "rgba(30, 32, 34, 0.62)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            width: 360,
            boxShadow: "0 2px 28px 0 rgb(0 0 0 / 30%)",
            padding: "30px 30px 24px 30px",
            color: "#222",
            position: "relative",
            minHeight: 210
          }}>
            <button
              onClick={() => setOtpStep("none")}
              style={{
                position: "absolute", right: 12, top: 8,
                background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#f93"
              }}
            >×</button>
            <h4 style={{ marginBottom: 10 }}>Enter & verify New Number</h4>
            <input
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              placeholder="Enter new phone"
              style={{ padding: 8, borderRadius: 8, border: "1px solid #f93 ", width: "100%" }}
            />
            <button
              onClick={sendOtpToNew}
              style={{
                marginTop: 10,
                background: "#ffc908",
                border: "1px solid #ffc908",
                borderRadius: 8,
                padding: "7px 18px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Send OTP to New Number
            </button>
            <input
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="OTP sent to new"
              style={{ padding: 8, borderRadius: 8, border: "1px solid #f93", width: "100%", marginTop: 15 }}
            />
            <button
              onClick={verifyNewOtp}
              style={{
                marginTop: 14,
                background: "#ffc908",
                border: "none",
                borderRadius: 8,
                padding: "8px 24px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Verify New Number
            </button>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  );
}
