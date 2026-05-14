import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import "./Toggle.css";

const Toggle = () => {
  const shopId = localStorage.getItem("shopId");
  const [isOn, setIsOn] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch shopstatus directly from Supabase
  useEffect(() => {
    const fetchStatus = async () => {
      if (!shopId) {
        console.error("No shopId found in localStorage");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("shops")
        .select("shopstatus")
        .eq("id", shopId)
        .single();

      if (error) {
        console.error("Error fetching shopstatus:", error);
      } else {
        const isShopOpen = data?.shopstatus?.toLowerCase() === "open";
        setIsOn(isShopOpen);
      }

      setLoading(false);
    };

    fetchStatus();
  }, [shopId]);

  // ✅ Toggle handler (updates Supabase)
  const handleToggle = async () => {
    if (!shopId) {
      alert("Shop ID not found. Please log in again.");
      return;
    }

    const newState = !isOn;
    setIsOn(newState);

    const newStatus = newState ? "Open" : "Closed";

    const { error } = await supabase
      .from("shops")
      .update({ shopstatus: newStatus })
      .eq("id", shopId);

    if (error) {
      console.error("Error updating shopstatus:", error);
      alert("Failed to update shop status!");
      // revert toggle if update failed
      setIsOn(!newState);
    }
  };

  if (loading) return <p>Loading status...</p>;

  return (
    <div className="toggle-container">
      <div
        className={`toggle-switch ${isOn ? "on" : "off"}`}
        onClick={handleToggle}
      >
        <div className="switch-handle"></div>
      </div>
      <span className="status">{isOn ? "Open" : "Closed"}</span>
    </div>
  );
};

export default Toggle;
