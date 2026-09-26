/**
 * Utility functions for Geofencing & Distance Calculations using Haversine formula.
 */

// Radius bumi dalam meter
const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the distance between two geographical coordinates in meters.
 */
export function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

export function getAsramaConfig() {
  const lat = parseFloat(process.env.NEXT_PUBLIC_ASRAMA_LAT || process.env.ASRAMA_LAT || "-6.200000");
  const lng = parseFloat(process.env.NEXT_PUBLIC_ASRAMA_LNG || process.env.ASRAMA_LNG || "106.816666");
  const radius = parseFloat(
    process.env.NEXT_PUBLIC_ASRAMA_RADIUS_METERS || process.env.ASRAMA_RADIUS_METERS || "100"
  );
  const maxAccuracy = parseFloat(
    process.env.NEXT_PUBLIC_ASRAMA_MAX_ACCURACY_METERS || process.env.ASRAMA_MAX_ACCURACY_METERS || "200"
  );

  return {
    lat: isNaN(lat) ? -6.200000 : lat,
    lng: isNaN(lng) ? 106.816666 : lng,
    radiusMeters: isNaN(radius) ? 100 : radius,
    maxAccuracyMeters: isNaN(maxAccuracy) ? 200 : maxAccuracy,
  };
}
