import "server-only";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Cookie holding the household's last GPS point ("lat,lng") before they save an address. */
export const LOCATION_COOKIE = "ruxs-loc";

/** Cookie holding the household's chosen search radius in km. */
export const SEARCH_RADIUS_COOKIE = "ruxs-radius";

export interface Point {
  latitude: number;
  longitude: number;
}

function valid(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export async function readGpsCookie(): Promise<Point | null> {
  const raw = (await cookies()).get(LOCATION_COOKIE)?.value;
  if (!raw) return null;
  const [lat, lng] = raw.split(",").map(Number);
  return lat !== undefined && lng !== undefined && valid(lat, lng) ? { latitude: lat, longitude: lng } : null;
}

/** The household's chosen search radius, or null when unset or unreadable. */
export async function readSearchRadiusCookie(): Promise<number | null> {
  const raw = (await cookies()).get(SEARCH_RADIUS_COOKIE)?.value;
  const km = Number(raw);
  return raw && Number.isInteger(km) ? km : null;
}

/**
 * Cloudflare's IP-based location for this request. Free and needs no prompt, but
 * Indian mobile IPs are often a city off, so it is only a first guess.
 */
export function readApproxPoint(): (Point & { city: string | null }) | null {
  try {
    const cf = getCloudflareContext().cf as { latitude?: string; longitude?: string; city?: string } | undefined;
    const lat = Number(cf?.latitude);
    const lng = Number(cf?.longitude);
    if (!cf?.latitude || !cf?.longitude || !valid(lat, lng)) return null;
    return { latitude: lat, longitude: lng, city: cf.city ?? null };
  } catch {
    return null; // not running on Workers (local dev)
  }
}
