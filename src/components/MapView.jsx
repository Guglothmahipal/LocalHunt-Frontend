import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ Fix default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ✅ Click handler for reverse geocoding
function LocationMarker({ setLocation }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();
        setLocation({
          lat,
          lng,
          name: data.display_name || "Unknown place",
        });
      } catch (err) {
        console.error("Geocoding error:", err);
      }
    },
  });
  return null;
}

// ✅ Button to fly back to a default location
function DefaultLocationButton({ coords }) {
  const map = useMap();
  const handleClick = () => map.flyTo(coords, 5);
  return (
    <button
      onClick={handleClick}
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 1000,
        padding: "6px 10px",
        background: "white",
        border: "1px solid #ccc",
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      📍 Go to Default
    </button>
  );
}

export default function App() {
  const [location, setLocation] = useState(null);

  // ✅ Set your default coordinates here
  const defaultCoords = [17.4065,78.4772]; // Hyderabad 18.9582,72.8321

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer
        center={defaultCoords}
        zoom={5}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: 10,
          overflow: "hidden",
        }}
        zoomControl={false}
        maxZoom={5}
      >
        <LayersControl position="topright">
          {/* ✅ Base 1: OpenStreetMap */}
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={5}
            />
          </LayersControl.BaseLayer>

          {/* ✅ Base 2: Satellite (Esri World Imagery) */}
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={5}
            />
          </LayersControl.BaseLayer>

          {/* ✅ Transparent labels-only overlay */}
          <LayersControl.Overlay checked name="Street Names">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
              subdomains={["a", "b", "c", "d"]}
              maxZoom={5}
              zIndex={600}
            />
          </LayersControl.Overlay>
        </LayersControl>

        {/* ✅ Default location button */}
        <DefaultLocationButton coords={defaultCoords} />

        {/* ✅ Click handler */}
        <LocationMarker setLocation={setLocation} />

        {/* ✅ Marker for default location */}
        <Marker position={defaultCoords}>
          <Popup>
            📍 <b>Default Location</b>
            <br />
            Lat: {defaultCoords[0].toFixed(4)}, Lng: {defaultCoords[1].toFixed(4)}
          </Popup>
        </Marker>

        {/* ✅ Marker for clicked place */}
        {location && (
          <Marker position={[location.lat, location.lng]}>
            <Popup>
              📍 <b>{location.name}</b>
              <br />
              Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
