"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { isMapsHost, isShortMapsLink, parseMapsCoordinates } from "@/core/maps";

/**
 * Turns a Google Maps link into coordinates. Short links (maps.app.goo.gl)
 * are expanded by following redirects, but only between Google hosts.
 */
export async function resolveMapsLink(input: unknown) {
  const parsed = z.object({ url: z.string().trim().min(3).max(2000) }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Paste a Google Maps link" };
  await requireUser();

  let url = parsed.data.url;
  const direct = parseMapsCoordinates(url);
  if (direct) return { ok: true as const, ...direct, url };

  if (!isShortMapsLink(url)) return { ok: false as const, error: "No location found in this link. Open the place in Google Maps and copy its link." };

  for (let hop = 0; hop < 5; hop++) {
    let host: string;
    try {
      host = new URL(url).hostname;
    } catch {
      break;
    }
    if (!isMapsHost(host)) break;
    const res = await fetch(url, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0 RUXs" } }).catch(() => null);
    const next = res?.headers.get("location");
    if (!next) break;
    url = new URL(next, url).toString();
    const coords = parseMapsCoordinates(url);
    if (coords) return { ok: true as const, ...coords, url: parsed.data.url };
  }
  return { ok: false as const, error: "Couldn't read a location from that link. Try “Use my location” or type coordinates." };
}
