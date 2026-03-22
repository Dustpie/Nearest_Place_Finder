import { useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "./App.css";

// ─── Fix Leaflet's default marker icons (they break with Vite's asset pipeline) ─
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Category → colour map ────────────────────────────────────────────────────
const COLORS = {
  gym: "#f38ba8",
  restaurant: "#fab387",
  cafe: "#e6b88a",
  supermarket: "#a6e3a1",
  pharmacy: "#89b4fa",
  park: "#94e2d5",
  bank: "#cba6f7",
  hotel: "#f9e2af",
  sport: "#74c7ec",
};

const ICONS = {
  gym: "🏋️",
  restaurant: "🍽️",
  cafe: "☕",
  supermarket: "🛒",
  pharmacy: "💊",
  park: "🌳",
  bank: "🏦",
  hotel: "🏨",
  sport: "🎾",
};

// Small coloured circle icon for result markers
function dotIcon(category) {
  const color = COLORS[category] ?? "#89dceb";
  return L.divIcon({
    className: "",
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

// ─── Map click handler component ──────────────────────────────────────────────
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [clickedPos, setClickedPos] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMapClick = useCallback(async (latlng) => {
    setClickedPos(latlng);
    setResults([]);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        `/nearest?lat=${latlng.lat}&lon=${latlng.lng}&count=5`,
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="layout">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Nearest Place Finder</h1>
          <p className="subtitle">Wallisellen, Switzerland</p>
          <p className="hint">
            Click anywhere on the map to find the 5 nearest places.
          </p>
        </div>

        {clickedPos && (
          <div className="coords-badge">
            <span className="coords-label">Clicked</span>
            <span>
              {clickedPos.lat.toFixed(5)}, {clickedPos.lng.toFixed(5)}
            </span>
          </div>
        )}

        {loading && <p className="status loading">Computing distances…</p>}
        {error && <p className="status error">{error}</p>}

        {results.length > 0 && (
          <div className="results">
            {results.map((place, i) => (
              <div
                key={i}
                className="result-card"
                style={{ "--accent": COLORS[place.category] ?? "#89dceb" }}
              >
                <div className="result-rank">{i + 1}</div>
                <div className="result-body">
                  <div className="result-name">
                    <span className="result-icon">
                      {ICONS[place.category] ?? "📍"}
                    </span>
                    {place.name}
                  </div>
                  <div className="result-meta">
                    <span className="result-category">{place.category}</span>
                    <span className="result-distance">
                      {(place.distanceKm * 1000).toFixed(0)} m
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && results.length === 0 && clickedPos && (
          <p className="status empty">No places found within range.</p>
        )}

        {/* ── GIS concept explainer ──────────────────────────────────── */}
        <div className="explainer">
          <h2>How it works</h2>
          <ol>
            <li>
              <strong>Bounding box</strong> — eliminates obviously far points
              with simple ± arithmetic (no trig)
            </li>
            <li>
              <strong>Haversine</strong> — computes curved-earth distance on
              remaining candidates
            </li>
            <li>
              <strong>GeoJSON</strong> — all points stored as standard
              geographic features
            </li>
            <li>
              <strong>Web Mercator</strong> — what Leaflet uses to display the
              map tiles
            </li>
          </ol>
        </div>
      </aside>

      {/* ── Map ──────────────────────────────────────────────────────── */}
      <MapContainer center={[47.4167, 8.5917]} zoom={14} className="map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapClickHandler onMapClick={handleMapClick} />

        {/* Clicked position marker */}
        {clickedPos && (
          <Marker position={clickedPos}>
            <Popup>
              You clicked here
              <br />
              {clickedPos.lat.toFixed(5)}, {clickedPos.lng.toFixed(5)}
            </Popup>
          </Marker>
        )}

        {/* Result markers + dashed lines back to clicked point */}
        {results.map((place, i) => (
          <span key={i}>
            <Marker
              position={[place.lat, place.lon]}
              icon={dotIcon(place.category)}
            >
              <Popup>
                <strong>{place.name}</strong>
                <br />
                {place.category}
                <br />
                {(place.distanceKm * 1000).toFixed(0)} m away
              </Popup>
            </Marker>
            <Polyline
              positions={[
                [clickedPos.lat, clickedPos.lng],
                [place.lat, place.lon],
              ]}
              color={COLORS[place.category] ?? "#89dceb"}
              weight={2}
              dashArray="6 4"
              opacity={0.8}
            />
          </span>
        ))}
        {/* Border Markers */}
        {clickedPos && (
          <Polyline
            positions={[
              [clickedPos.lat + 0.15, clickedPos.lng - 0.15],
              [clickedPos.lat + 0.15, clickedPos.lng + 0.15],
              [clickedPos.lat - 0.15, clickedPos.lng + 0.15],
              [clickedPos.lat - 0.15, clickedPos.lng - 0.15],
            ]}
            color="#8f0a0a"
            weight={5}
            dashArray="8 8"
            opacity={0.8}
          />
        )}
      </MapContainer>
    </div>
  );
}
