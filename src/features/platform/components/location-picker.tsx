"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Link2, LocateFixed } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { resolveMapsLink } from "@/features/platform/actions";

export interface LocationValue {
  latitude: string;
  longitude: string;
  mapsUrl: string;
}

const input = "w-full rounded-[12px] border border-line bg-surface px-3 py-2.5 text-[15px] text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15";

/** Three ways to set a place: this device's GPS, a Google Maps link, or typed coordinates. */
export function LocationPicker({ value, onChange }: { value: LocationValue; onChange: (v: LocationValue) => void }) {
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const hasPoint = value.latitude.trim() !== "" && value.longitude.trim() !== "";

  function detect() {
    if (!("geolocation" in navigator)) return toast.error("Location isn't available on this device");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onChange({ ...value, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) });
        toast.success("Location captured");
      },
      () => {
        setLocating(false);
        toast.error("Allow location access, or paste a Google Maps link");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function readLink(url: string) {
    if (!url.trim()) return;
    startTransition(async () => {
      const res = await resolveMapsLink({ url });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onChange({ mapsUrl: url.trim(), latitude: String(res.latitude), longitude: String(res.longitude) });
      toast.success("Location read from the Maps link");
    });
  }

  return (
    <div className="space-y-3 rounded-[12px] bg-bg p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Location</p>
        <button type="button" onClick={detect} disabled={locating} className={buttonClass("secondary", "sm", "text-xs")}>
          <LocateFixed className={"h-4 w-4 " + (locating ? "animate-spin motion-reduce:animate-none" : "")} aria-hidden="true" /> {locating ? "Detecting…" : "Use my current location"}
        </button>
      </div>
      <label className="block text-xs font-medium text-ink">
        Google Maps link
        <span className="mt-1 flex gap-2">
          <span className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="url"
              value={value.mapsUrl}
              onChange={(e) => onChange({ ...value, mapsUrl: e.target.value })}
              onBlur={(e) => !hasPoint && readLink(e.target.value)}
              placeholder="https://maps.app.goo.gl/…"
              className={input + " pl-9"}
            />
          </span>
          <button type="button" disabled={pending || !value.mapsUrl.trim()} onClick={() => readLink(value.mapsUrl)} className={buttonClass("dark", "sm", "shrink-0 text-xs")}>
            {pending ? "Reading…" : "Read pin"}
          </button>
        </span>
        <span className="mt-1 block text-[11px] text-muted">In Google Maps: open the place → Share → Copy link, then paste it here.</span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-ink">
          Latitude
          <input inputMode="decimal" value={value.latitude} onChange={(e) => onChange({ ...value, latitude: e.target.value })} placeholder="23.3747" className={input + " mt-1 font-mono"} />
        </label>
        <label className="text-xs font-medium text-ink">
          Longitude
          <input inputMode="decimal" value={value.longitude} onChange={(e) => onChange({ ...value, longitude: e.target.value })} placeholder="85.3349" className={input + " mt-1 font-mono"} />
        </label>
      </div>
      {hasPoint && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${value.latitude.trim()},${value.longitude.trim()}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-[4px] text-xs font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Check this pin on Google Maps <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
