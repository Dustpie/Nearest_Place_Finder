using System.Text.Json;
using backend.Controller;
using backend.Helpers;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors();

var app = builder.Build();

app.UseCors(policy => policy
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader());

// ─── Load all places from GeoJSON once at startup ────────────────────────────
var geoJsonPath = Path.Combine(AppContext.BaseDirectory, "Data", "places.geojson");
var places = LoadPlacesHelper.LoadPlaces(geoJsonPath);

app.MapNearestPlaceEndpoint(places);
app.Run();
