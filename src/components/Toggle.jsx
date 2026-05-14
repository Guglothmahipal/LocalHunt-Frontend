import React, { useState, useEffect } from "react";
import "./Toggle.css";

const Toggle = () => {
  // Initialize state directly from localStorage
  const [isOn, setIsOn] = useState(() => {
    const savedState = localStorage.getItem("toggleState");
    return savedState ? savedState === "true" : false;
  });

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("toggleState", isOn);
  }, [isOn]);

  return (
    <div className="toggle-container">
      <div
        className={`toggle-switch ${isOn ? "on" : "off"}`}
        onClick={() => setIsOn(!isOn)}
      >
        <div className="switch-handle"></div>
      </div>
      <span className="status">{isOn ? "Open" : "Closed"}</span>
    </div>
  );
};

export default Toggle;
