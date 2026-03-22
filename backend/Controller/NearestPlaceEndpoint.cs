using backend.Helpers;
using backend.Models;

namespace backend.Controller;

public static class NearestPlaceEndpoint
{
    public static void MapNearestPlaceEndpoint(this WebApplication app, List<Places> places)
    {
        const double BboxDeg = 0.15;

        app.MapGet("nearest", (double lat, double lon, int count = 5) =>
    {
        // Step 1 — Bounding box pre-filter (cheap, no trig)
        // 0.05° ≈ ~3.5 km at Swiss latitudes. Throws away obviously far points fast. 

        var candidates = places.Where(p =>
            Math.Abs(p.Lat - lat) <= BboxDeg &&
            Math.Abs(p.Lon - lon) <= BboxDeg);

        // Step 2 — Haversine on the remaining candidates (accurate curved-earth distance)
        var results = candidates
            .Select(p => new
            {
                p.Name,
                p.Category,
                p.Lat,
                p.Lon,
                DistanceKm = HaversineHelper.GetHaversine(lat, lon, p.Lat, p.Lon)
            })
            .OrderBy(r => r.DistanceKm)
            .Take(count);

        return Results.Ok(results);
    });
    }
}
