# Nearest Place Finder

A GIS learning project. Click anywhere on an interactive map to find the nearest points of interest — the app returns the 5 closest places using a two-stage geographic search algorithm.

Built with a .NET 10 backend and a React + Leaflet frontend. Place data covers 26 locations in Wallisellen, Switzerland.

---

## Running the project

**Backend** (from `backend/`):
```bash
dotnet run
# Starts on http://localhost:5000
```

**Frontend** (from `frontend/`):
```bash
npm install
npm run dev
# Starts on http://localhost:5173, proxies /nearest to backend
```

**API** (manual testing):
```
GET /nearest?lat=47.4167&lon=8.5917&count=5
```

---

## How the search works

Finding the nearest place sounds simple — compute the distance to every point, sort, return the top N. The challenge is doing it correctly on a sphere, and doing it efficiently when the dataset is large.

### Stage 1 — Bounding Box Pre-filter

Before any expensive math, the backend throws away obviously-far points using simple arithmetic:

```
|placeLat - clickedLat| <= BboxDeg  AND  |placeLon - clickedLon| <= BboxDeg
```

This creates a square region in **degree space** around the clicked point. Any place outside that square is discarded immediately — no trigonometry, no square roots, just subtraction and comparison.

**Why not just use this for the final answer?** Because degree-space distance is not the same as real-world distance. A degree of longitude covers less physical ground than a degree of latitude, and that gap grows as you move toward the poles. At 47°N (Switzerland):
- 1° latitude ≈ 111 km
- 1° longitude ≈ 76 km

So the bounding box is a square in degrees but a **rectangle on the ground** — taller than it is wide. Using raw degree differences to rank places would give wrong results near the edges.

### Stage 2 — Haversine Distance

The Haversine formula computes the true great-circle distance between two points on a sphere. It accounts for the Earth's curvature and the shrinking of longitude degrees at higher latitudes.

```
dLat = lat2 - lat1  (converted to radians)
dLon = lon2 - lon1  (converted to radians)

a = sin²(dLat/2) + cos(lat1) · cos(lat2) · sin²(dLon/2)
c = 2 · atan2(√a, √(1−a))
distance = R · c
```

Where `R = 6371 km` (Earth's mean radius).

Breaking it down:

- **`a`** is a value between 0 and 1 representing the square of half the chord length between the two points on the unit sphere. The `sin²(dLat/2)` term captures the north-south difference; the `cos(lat1) · cos(lat2) · sin²(dLon/2)` term captures the east-west difference, scaled down by the cosines of the latitudes (which is exactly what accounts for longitude shrinking near the poles).
- **`c`** converts that chord-length value into a central angle in radians using `atan2`. The central angle is the angle at the center of the Earth between the two surface points.
- **`R · c`** converts the central angle to an arc length — the actual distance along the Earth's surface.

This runs only on the candidates that survived the bounding box filter, not the full dataset.

### Why two stages?

Trigonometric functions (`sin`, `cos`, `atan2`) and square roots are significantly slower than simple comparisons. For a small dataset like this one the difference is negligible, but at scale — millions of points — running Haversine on everything would be expensive. The bounding box does a cheap first pass to reduce the candidate set, then Haversine runs on what remains.

### Visualisation on the map

The app draws two overlapping shapes after each click:

- **Red dashed polygon** — the bounding box. A square in degree space; appears as a rectangle on the map because of the longitude scaling described above.
- **Blue circle** — the conservative Haversine search area. Uses the latitude-based radius (1° lat ≈ 111 km) to draw a circle that fits fully *inside* the bounding box. Every point inside the circle is guaranteed to have passed the bounding box filter.

---

## Coordinate system notes

- **GeoJSON** stores coordinates as `[longitude, latitude]` — the reverse of what you might expect.
- **Leaflet** and this application use `[latitude, longitude]` order throughout.
- The `LoadPlaces` helper swaps the GeoJSON order on load.

---

## Tech stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Backend  | .NET 10, ASP.NET Core (C#)        |
| Frontend | React 19, Vite, Leaflet / React-Leaflet |
| Data     | GeoJSON                           |
