using System.Text.Json;
using backend.Models;

namespace backend.Helpers;

public static class LoadPlacesHelper
{
    /// <summary>
    /// Parses the GeoJSON FeatureCollection into a flat list of Place records.
    /// GeoJSON coordinates are [longitude, latitude] — note the order!
    /// </summary>
    public static List<Places> LoadPlaces(string path)
    {
        using var stream = File.OpenRead(path);
        using var doc = JsonDocument.Parse(stream);

        return doc.RootElement
            .GetProperty("features")
            .EnumerateArray()
            .Select(f =>
            {
                var props = f.GetProperty("properties");
                var coords = f.GetProperty("geometry").GetProperty("coordinates");

                return new Places(
                    Name: props.GetProperty("name").GetString()!,
                    Category: props.GetProperty("category").GetString()!,
                    Lon: coords[0].GetDouble(),  // GeoJSON = [lon, lat]
                    Lat: coords[1].GetDouble()
                );
            })
            .ToList();
    }
}
