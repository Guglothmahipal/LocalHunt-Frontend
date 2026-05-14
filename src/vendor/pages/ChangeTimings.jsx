import React, { useState } from "react";
import {supabase} from "../../supabaseClient"
import CloseIcon from "@mui/icons-material/Close";
import styles from "./ChangeTimings.module.css";

const ChangeTimings = ({ shopId, onClose, onUpdated }) => {
  const [opening, setOpening] = useState("");
  const [closing, setClosing] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);

    const { error } = await supabase
      .from("shops")
      .update({
        shoptimings: {
          openingTime: opening,
          closingTime: closing,
        },
      })
      .eq("id", shopId);

    setSaving(false);

    if (error) {
      console.error("Error updating timings:", error);
      alert("Failed to update timings!");
    } else {
      alert("Timings updated!");
      onUpdated(); // re-fetch timings in Home.jsx
      onClose();   // close popup
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          <CloseIcon />
        </button>

        <h3>Change Shop Timings</h3>

        <div className={styles.form}>
          <label>
            Opening:
            <input
              type="time"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
            />
          </label>
          <label>
            Closing:
            <input
              type="time"
              value={closing}
              onChange={(e) => setClosing(e.target.value)}
            />
          </label>
        </div>

        <button
          className={styles.confirmBtn}
          onClick={handleConfirm}
          disabled={saving}
        >
          {saving ? "Saving..." : "Confirm"}
        </button>
      </div>
    </div>
  );
};

export default ChangeTimings;
