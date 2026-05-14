import React from "react";

export default function DirectNavigationButton({ shop }) {
  const handleDirectNavigation = () => {
    if (!shop || !shop.coordinates) {
      alert("Shop coordinates not found!");
      return;
    }

    // 🧭 Parse destination coordinates safely
    let destLat, destLng;

    if (typeof shop.coordinates === "object" && shop.coordinates.lat && shop.coordinates.lng) {
      destLat = shop.coordinates.lat;
      destLng = shop.coordinates.lng;
    } else if (Array.isArray(shop.coordinates) && shop.coordinates.length === 2) {
      [destLat, destLng] = shop.coordinates;
    } else if (typeof shop.coordinates === "string") {
      const [lat, lng] = shop.coordinates.split(",").map(c => parseFloat(c.trim()));
      destLat = lat;
      destLng = lng;
    } else {
      alert("Invalid coordinates format for this shop.");
      return;
    }

    // 🌍 Get user’s live location and start navigation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;

          // 🧭 Open Google Maps directly into navigation mode
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=driving`;
          window.location.href = mapsUrl; // 🔥 Opens immediately in same tab
        },
        (error) => {
          console.error("Location error:", error);
          alert("Please enable GPS to start navigation.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <button
      onClick={handleDirectNavigation}
      style={{
        display: "block",
        margin: "20px auto",
        padding: "10px 20px",
        backgroundColor: "#0B8043",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "16px",
      }}
    >
      🚗 Start Navigation
    </button>
  );
}
