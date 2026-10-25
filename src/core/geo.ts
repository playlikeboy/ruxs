/**
 * Pure Geofencing & Spatial helpers for Pan-India discovery.
 * Pure functions: no external dependencies, no database access.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocalityCentroid extends Coordinates {
  id: string;
  name: string;
  city: string;
  state: string;
}

/**
 * Haversine formula to compute geodesic distance in kilometers between two lat/lng coordinates.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Math.round(dist * 10) / 10;
}

/**
 * Resolves coordinate centroids for a vendor based on area and city text.
 */
export function resolveCoordinates(
  city: string,
  area: string,
  localities: LocalityCentroid[]
): Coordinates | null {
  const normArea = area.toLowerCase().trim();
  const normCity = city.toLowerCase().trim();

  // 1. Try exact or partial area match
  for (const loc of localities) {
    const locName = loc.name.toLowerCase();
    if (normArea.includes(locName) || locName.includes(normArea)) {
      return { latitude: loc.latitude, longitude: loc.longitude };
    }
  }

  // 2. Try city match
  for (const loc of localities) {
    if (loc.city.toLowerCase() === normCity) {
      return { latitude: loc.latitude, longitude: loc.longitude };
    }
  }

  return null;
}

/**
 * Finds the nearest named Indian locality for given GPS coordinates.
 */
export function findNearestLocality(
  lat: number,
  lng: number,
  localities: LocalityCentroid[]
): { locality: LocalityCentroid; distanceKm: number } | null {
  let nearest: LocalityCentroid | null = null;
  let minDistance = Infinity;

  for (const loc of localities) {
    const d = haversineDistanceKm(lat, lng, loc.latitude, loc.longitude);
    if (d < minDistance) {
      minDistance = d;
      nearest = loc;
    }
  }

  return nearest ? { locality: nearest, distanceKm: minDistance } : null;
}

/**
 * Checks if a vendor is within the consumer's delivery geofence radius.
 * Standard tiffin and water suppliers service within 10-15 km radius.
 */
export function isWithinGeofence(
  consumerLat: number,
  consumerLng: number,
  vendorLat: number,
  vendorLng: number,
  maxRadiusKm = 12
): { isNearby: boolean; distanceKm: number } {
  const distanceKm = haversineDistanceKm(
    consumerLat,
    consumerLng,
    vendorLat,
    vendorLng
  );
  return {
    isNearby: distanceKm <= maxRadiusKm,
    distanceKm,
  };
}

/** Search radius choices a household can pick in the app (km). */
export const SEARCH_RADIUS_OPTIONS_KM = [2, 5, 10, 15, 25, 50] as const;
export const MAX_SEARCH_RADIUS_KM = 50;

function validRadius(km: number | null | undefined): km is number {
  return km != null && Number.isInteger(km) && km >= 1 && km <= MAX_SEARCH_RADIUS_KM;
}

/** The household's own radius when it is valid, else the platform default (clamped to 1-50 km). */
export function searchRadiusKm(chosenKm: number | null | undefined, platformDefaultKm: number): number {
  if (validRadius(chosenKm)) return chosenKm;
  return Math.min(MAX_SEARCH_RADIUS_KM, Math.max(1, Math.round(platformDefaultKm)));
}

/** The picker's options: the fixed steps plus the current value, sorted. */
export function searchRadiusOptions(currentKm: number): number[] {
  return Array.from(new Set<number>([...SEARCH_RADIUS_OPTIONS_KM, currentKm])).sort((a, b) => a - b);
}

/**
 * Geofence: a household only sees stores within its search radius. It can
 * order from a store whose own delivery radius covers it, whether or not the
 * store is inside the search radius (a shared link still works).
 */
export function storeReach(
  distanceKm: number | null,
  vendorRadiusKm: number,
  searchRadiusKm: number
): { visible: boolean; deliverable: boolean } {
  if (distanceKm == null) return { visible: false, deliverable: false };
  return { visible: distanceKm <= searchRadiusKm, deliverable: distanceKm <= vendorRadiusKm };
}
