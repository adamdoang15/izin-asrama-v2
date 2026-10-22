import { logGagalValidasiLokasi } from "@/services/izin.service";

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
    process.env.NEXT_PUBLIC_ASRAMA_RADIUS_METERS || process.env.ASRAMA_RADIUS_METERS || "40"
  );
  const maxAccuracy = parseFloat(
    process.env.NEXT_PUBLIC_ASRAMA_MAX_ACCURACY_METERS || process.env.ASRAMA_MAX_ACCURACY_METERS || "200"
  );

  return {
    lat: isNaN(lat) ? -6.200000 : lat,
    lng: isNaN(lng) ? 106.816666 : lng,
    radiusMeters: isNaN(radius) ? 40 : radius,
    maxAccuracyMeters: isNaN(maxAccuracy) ? 200 : maxAccuracy,
  };
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeofenceLocationInfo {
  latitude: number;
  longitude: number;
  distance: number;
  accuracy?: number;
}

export type GeofenceResult =
  | { success: true; locationInfo: GeofenceLocationInfo }
  | { success: false; error: string; locationInfo: GeofenceLocationInfo };

/**
 * Deep geofence verification seam.
 * Validates GPS accuracy, distance to asrama radius, writes failure audit logs,
 * and formats user-friendly error messages.
 */
export async function verifyReturnLocation(
  izinId: number,
  userId: number,
  coords: Coordinates
): Promise<GeofenceResult> {
  const asrama = getAsramaConfig();
  const distance = getDistanceInMeters(coords.latitude, coords.longitude, asrama.lat, asrama.lng);
  const locationInfo: GeofenceLocationInfo = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    distance,
    accuracy: coords.accuracy,
  };

  // Validasi akurasi sinyal GPS
  if (coords.accuracy !== undefined && coords.accuracy > asrama.maxAccuracyMeters) {
    const error = `Sinyal GPS kurang akurat (akurasi ±${Math.round(coords.accuracy)} meter, batas maksimal ${asrama.maxAccuracyMeters} meter). Coba dekati jendela atau area terbuka di asrama, lalu coba lagi.`;
    await logGagalValidasiLokasi(izinId, userId, "Sinyal GPS kurang akurat", locationInfo);
    return { success: false, error, locationInfo };
  }

  // Validasi batas radius asrama
  if (distance > asrama.radiusMeters) {
    const error = `Gagal mencatat kepulangan. Anda berada di luar radius asrama (jarak terdeteksi: ${distance} meter, batas radius: ${asrama.radiusMeters} meter). Pastikan Anda sudah berada di area asrama.`;
    await logGagalValidasiLokasi(izinId, userId, "Di luar radius asrama", locationInfo);
    return { success: false, error, locationInfo };
  }

  return { success: true, locationInfo };
}

