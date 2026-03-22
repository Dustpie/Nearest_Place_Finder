namespace backend.Helpers;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/// <summary>
/// Haversine formula — great-circle distance between two points on a sphere.
///
/// Why Haversine?
///   The Earth is (roughly) a sphere. Simple Euclidean distance on lat/lon
///   coordinates is wrong because longitude degrees shrink as you move toward
///   the poles. Haversine accounts for the Earth's curvature.
///
/// The maths:
///   dLat / dLon  = difference in radians
///   a            = sin²(dLat/2) + cos(lat1)·cos(lat2)·sin²(dLon/2)
///   c            = 2·atan2(√a, √(1−a))   ← central angle in radians
///   distance     = R · c                  ← arc length on the sphere
/// </summary>
public static class HaversineHelper
{

    public static double GetHaversine(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Earth mean radius in km

        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2))
              * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return R * c;
    }
    static double ToRad(double degrees) => degrees * (Math.PI / 180);

}
