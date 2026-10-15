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
 * Centroids of key residential, tech hubs, and metro areas across India.
 */
export const INDIAN_LOCALITIES: LocalityCentroid[] = [
  // Bengaluru
  { id: "blr-hsr", name: "HSR Layout", city: "Bengaluru", state: "Karnataka", latitude: 12.9121, longitude: 77.6446 },
  { id: "blr-kor", name: "Koramangala", city: "Bengaluru", state: "Karnataka", latitude: 12.9352, longitude: 77.6245 },
  { id: "blr-bel", name: "Bellandur", city: "Bengaluru", state: "Karnataka", latitude: 12.9304, longitude: 77.6784 },
  { id: "blr-ind", name: "Indiranagar", city: "Bengaluru", state: "Karnataka", latitude: 12.9784, longitude: 77.6408 },
  { id: "blr-whi", name: "Whitefield", city: "Bengaluru", state: "Karnataka", latitude: 12.9698, longitude: 77.7500 },
  { id: "blr-ecity", name: "Electronic City", city: "Bengaluru", state: "Karnataka", latitude: 12.8399, longitude: 77.6770 },
  { id: "blr-jay", name: "Jayanagar", city: "Bengaluru", state: "Karnataka", latitude: 12.9308, longitude: 77.5838 },
  { id: "blr-cen", name: "Central Bengaluru", city: "Bengaluru", state: "Karnataka", latitude: 12.9716, longitude: 77.5946 },

  // Mumbai
  { id: "mum-pow", name: "Powai", city: "Mumbai", state: "Maharashtra", latitude: 19.1176, longitude: 72.9060 },
  { id: "mum-and", name: "Andheri West", city: "Mumbai", state: "Maharashtra", latitude: 19.1363, longitude: 72.8277 },
  { id: "mum-ban", name: "Bandra West", city: "Mumbai", state: "Maharashtra", latitude: 19.0596, longitude: 72.8295 },
  { id: "mum-par", name: "Lower Parel", city: "Mumbai", state: "Maharashtra", latitude: 18.9953, longitude: 72.8315 },
  { id: "mum-tha", name: "Thane West", city: "Mumbai", state: "Maharashtra", latitude: 19.2183, longitude: 72.9781 },
  { id: "mum-nav", name: "Vashi, Navi Mumbai", city: "Mumbai", state: "Maharashtra", latitude: 19.0771, longitude: 72.9986 },
  { id: "mum-cen", name: "Dadar / Central Mumbai", city: "Mumbai", state: "Maharashtra", latitude: 19.0178, longitude: 72.8478 },

  // Delhi NCR
  { id: "del-cyb", name: "DLF Cyber City, Gurugram", city: "Delhi NCR", state: "Haryana", latitude: 28.4950, longitude: 77.0895 },
  { id: "del-noi", name: "Sector 62, Noida", city: "Delhi NCR", state: "Uttar Pradesh", latitude: 28.6280, longitude: 77.3649 },
  { id: "del-sou", name: "South Extension / Saket", city: "Delhi NCR", state: "Delhi", latitude: 28.5244, longitude: 77.2066 },
  { id: "del-dwa", name: "Dwarka Sector 11", city: "Delhi NCR", state: "Delhi", latitude: 28.5823, longitude: 77.0500 },
  { id: "del-roh", name: "Rohini Sector 13", city: "Delhi NCR", state: "Delhi", latitude: 28.7180, longitude: 77.1215 },
  { id: "del-cen", name: "Connaught Place", city: "Delhi NCR", state: "Delhi", latitude: 28.6315, longitude: 77.2167 },

  // Hyderabad
  { id: "hyd-hit", name: "Hitec City / Madhapur", city: "Hyderabad", state: "Telangana", latitude: 17.4474, longitude: 78.3762 },
  { id: "hyd-gac", name: "Gachibowli", city: "Hyderabad", state: "Telangana", latitude: 17.4401, longitude: 78.3489 },
  { id: "hyd-ban", name: "Banjara Hills", city: "Hyderabad", state: "Telangana", latitude: 17.4156, longitude: 78.4357 },
  { id: "hyd-jub", name: "Jubilee Hills", city: "Hyderabad", state: "Telangana", latitude: 17.4319, longitude: 78.4073 },
  { id: "hyd-cen", name: "Begumpet / Central", city: "Hyderabad", state: "Telangana", latitude: 17.4447, longitude: 78.4664 },

  // Pune
  { id: "pun-hin", name: "Hinjewadi Phase 1", city: "Pune", state: "Maharashtra", latitude: 18.5913, longitude: 73.7389 },
  { id: "pun-vim", name: "Viman Nagar", city: "Pune", state: "Maharashtra", latitude: 18.5679, longitude: 73.9143 },
  { id: "pun-wak", name: "Wakad / Pimple Saudagar", city: "Pune", state: "Maharashtra", latitude: 18.5987, longitude: 73.7661 },
  { id: "pun-kot", name: "Kothrud", city: "Pune", state: "Maharashtra", latitude: 18.5074, longitude: 73.8077 },
  { id: "pun-cen", name: "Shivajinagar / Central", city: "Pune", state: "Maharashtra", latitude: 18.5314, longitude: 73.8446 },

  // Ranchi
  { id: "rnc-lal", name: "Lalpur", city: "Ranchi", state: "Jharkhand", latitude: 23.3747, longitude: 85.3349 },
  { id: "rnc-har", name: "Harmu", city: "Ranchi", state: "Jharkhand", latitude: 23.3534, longitude: 85.2990 },
  { id: "rnc-kan", name: "Kanke Road", city: "Ranchi", state: "Jharkhand", latitude: 23.4060, longitude: 85.3210 },
  { id: "rnc-dor", name: "Doranda", city: "Ranchi", state: "Jharkhand", latitude: 23.3247, longitude: 85.3256 },
  { id: "rnc-bar", name: "Bariatu", city: "Ranchi", state: "Jharkhand", latitude: 23.3880, longitude: 85.3500 },
  { id: "rnc-mor", name: "Morabadi", city: "Ranchi", state: "Jharkhand", latitude: 23.3940, longitude: 85.3360 },
  { id: "rnc-ash", name: "Ashok Nagar", city: "Ranchi", state: "Jharkhand", latitude: 23.3480, longitude: 85.3080 },
  { id: "rnc-cen", name: "Main Road / Central Ranchi", city: "Ranchi", state: "Jharkhand", latitude: 23.3602, longitude: 85.3250 },

  // Kolkata
  { id: "kol-sal", name: "Salt Lake Sector V", city: "Kolkata", state: "West Bengal", latitude: 22.5867, longitude: 88.4172 },
  { id: "kol-new", name: "New Town", city: "Kolkata", state: "West Bengal", latitude: 22.5898, longitude: 88.4744 },

  // Chennai
  { id: "che-omr", name: "OMR / Thoraipakkam", city: "Chennai", state: "Tamil Nadu", latitude: 12.9348, longitude: 80.2312 },
  { id: "che-ann", name: "Anna Nagar", city: "Chennai", state: "Tamil Nadu", latitude: 13.0850, longitude: 80.2101 },
];

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
export function resolveCoordinates(city: string, area: string): Coordinates {
  const normArea = area.toLowerCase().trim();
  const normCity = city.toLowerCase().trim();

  // 1. Try exact or partial area match
  for (const loc of INDIAN_LOCALITIES) {
    const locName = loc.name.toLowerCase();
    if (normArea.includes(locName) || locName.includes(normArea)) {
      return { latitude: loc.latitude, longitude: loc.longitude };
    }
  }

  // 2. Try city match
  for (const loc of INDIAN_LOCALITIES) {
    if (loc.city.toLowerCase() === normCity) {
      return { latitude: loc.latitude, longitude: loc.longitude };
    }
  }

  // Fallback: Default to central Bengaluru coordinates
  return { latitude: 12.9716, longitude: 77.5946 };
}

/**
 * Finds the nearest named Indian locality for given GPS coordinates.
 */
export function findNearestLocality(
  lat: number,
  lng: number
): { locality: LocalityCentroid; distanceKm: number } {
  let nearest = INDIAN_LOCALITIES[0]!;
  let minDistance = Infinity;

  for (const loc of INDIAN_LOCALITIES) {
    const d = haversineDistanceKm(lat, lng, loc.latitude, loc.longitude);
    if (d < minDistance) {
      minDistance = d;
      nearest = loc;
    }
  }

  return { locality: nearest, distanceKm: minDistance };
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
