import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../../supabaseClient";

function MapComp() {
  // Fetch specific shop coordinates from Supabase using shopId
  const fetchShopCoords = async (shopId) => {
    if (!shopId) {
      console.error("No shopId found in localStorage");
      return null;
    }

    const { data, error } = await supabase
      .from("shops") // 👈 your table name
      .select("coordinates")
      .eq("id", shopId) // 👈 match the column name in Supabase
      .single(); // expect only one record

    if (error) {
      console.error("Error fetching shop coordinates:", error);
      return null;
    }

    if (data && data.coordinates) {
      try {
        // Handle both stringified and array JSON formats
        const coords =
          typeof data.coordinates === "string"
            ? JSON.parse(data.coordinates)
            : data.coordinates;

        const [lat, lng] = coords.map(Number);
        return [lat, lng];
      } catch (err) {
        console.error("Error parsing coordinates:", err);
        return null;
      }
    }

    console.warn("No coordinates found for this shop");
    return null;
  };

  useEffect(() => {
    const initMap = async () => {
      const existingMap = L.DomUtil.get("map");
      if (existingMap !== null) {
        existingMap._leaflet_id = null;
      }

      // ✅ Fetch shopId from localStorage
      const shopId = localStorage.getItem("shopId");
      const shopCoords = await fetchShopCoords(shopId);

      if (!shopCoords) {
        console.error("Shop coordinates not found");
        return;
      }

      // ✅ Initialize map centered at shop coordinates
      const map = L.map("map", {
        center: shopCoords,
        zoom: 20,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        touchZoom: false,
      });

      // ✅ Add tiles
      // L.tileLayer(
      //   "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      //   {
      //     attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      //     subdomains: "abcd",
      //     maxZoom: 20,
      //   }
      // ).addTo(map);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri'
}).addTo(map);

      // ✅ Custom shop icon
      const shopIcon = L.icon({
        iconUrl: "/girl1.png",
        iconSize: [92, 92],
        iconAnchor: [46, 92],
      });

      // ✅ Add shop marker
      L.marker(shopCoords, { icon: shopIcon })
        .addTo(map)
        .bindPopup("Shop Location");

      setTimeout(() => map.invalidateSize(), 100);
    };

    initMap();
  }, []);

  return (
    <div
      className="map-wrapper-div"
      style={{
        width: "450px",
        height: "250px",
        border: "solid 1px #ccc",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div id="map" style={{ width: "100%", height: "100%" }}></div>
    </div>
  );
}

export default MapComp;
