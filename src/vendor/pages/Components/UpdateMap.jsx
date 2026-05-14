import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../../supabaseClient";

function UpdateMap() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);
  const selectedCoordsRef = useRef(null);

  // ✅ Google Geocoding API
  const reverseGeocode = async (lat, lng) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        console.warn("No address found for given coordinates.");
        return `${lat}, ${lng}`;
      }
    } catch (err) {
      console.error("Google Geocoding error:", err);
      return `${lat}, ${lng}`;
    }
  };

  const fetchShopCoords = async (shopId) => {
    const { data, error } = await supabase
      .from("shops")
      .select("coordinates")
      .eq("id", shopId)
      .single();

    if (error) {
      console.error("Error fetching shop coordinates:", error);
      return null;
    }

    try {
      const coords =
        typeof data.coordinates === "string"
          ? JSON.parse(data.coordinates)
          : data.coordinates;
      return coords.map(Number);
    } catch (err) {
      console.error("Error parsing coordinates:", err);
      return null;
    }
  };

  const updateShopCoords = async (shopId, coords) => {
    const [lat, lng] = coords.map(Number);
    const address = await reverseGeocode(lat, lng);

    const { error } = await supabase
      .from("shops")
      .update({ coordinates: coords, shoplocation: address })
      .eq("id", shopId);

    if (error) {
      alert("Failed to update coordinates");
      console.error("Supabase update error:", error);
    } else {
      alert("Coordinates and location updated!");
    }
  };

  useEffect(() => {
    const initMap = async () => {
      try {
        const shopId = localStorage.getItem("shopId");
        const shopCoords = await fetchShopCoords(shopId);

        if (!shopCoords) throw new Error("Shop coordinates not found");
        if (!mapContainerRef.current)
          throw new Error("Map container not mounted");

        mapRef.current = L.map(mapContainerRef.current, {
          center: shopCoords,
          zoom: 18,
        });

        // Google Satellite Map Layer
        L.tileLayer("https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
          maxZoom: 20,
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
        }).addTo(mapRef.current);

        const shopIcon = L.icon({
          iconUrl: "/girl1.png",
          iconSize: [64, 64],
          iconAnchor: [32, 64],
        });

        markerRef.current = L.marker(shopCoords, { icon: shopIcon }).addTo(mapRef.current);
        selectedCoordsRef.current = shopCoords;

        mapRef.current.on("click", (e) => {
          const { lat, lng } = e.latlng;
          selectedCoordsRef.current = [lat, lng];
          markerRef.current.setLatLng([lat, lng]);
        });

        const updateButton = L.control({ position: "topright" });
        updateButton.onAdd = function () {
          const btn = L.DomUtil.create("button", "update-btn");
          btn.innerHTML = "Update Coordinates";
          Object.assign(btn.style, {
            backgroundColor: "#ffc908",
            color: "#000",
            fontSize: "20px",
            border: "none",
            height: "40px",
            width: "250px",
            borderRadius: "10px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          });
          L.DomEvent.disableClickPropagation(btn);

          btn.onclick = async () => {
            if (!selectedCoordsRef.current)
              return alert("Select a location first!");
            await updateShopCoords(shopId, selectedCoordsRef.current);
          };
          return btn;
        };
        updateButton.addTo(mapRef.current);
      } catch (err) {
        console.error("Error initializing map:", err);
      }
    };

    initMap();
    return () => mapRef.current?.remove();
  }, []);

  return (
    <div
      className="map-wrapper-div"
      style={{
        width: "100%",
        height: "100%",
        border: "1px solid #ccc",
        borderRadius: "8px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }}></div>
    </div>
  );
}

export default UpdateMap;
