"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Crosshair, ExternalLink, MapPin, Navigation } from "lucide-react";
import { saveProfile } from "@/features/consumer/actions";
import { parseMapsCoordinates } from "@/core/maps";

export interface ProfileDefaults {
  name: string;
  phone: string;
  society: string;
  tower: string;
  floor: string;
  flat: string;
  landmark: string;
  area: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

const inputClass =
  "mt-1 h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";
const smallInputClass =
  "mt-1 h-11 w-full rounded-lg border border-line bg-surface px-2.5 text-ink placeholder:text-muted focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";
const labelClass = "text-[13px] font-medium text-muted";
const smallLabelClass = "text-xs font-medium text-muted";

export function ProfileForm({ defaults, next }: { defaults: ProfileDefaults; next?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(defaults);
  const [pending, startTransition] = useTransition();
  const [showOptionalFields, setShowOptionalFields] = useState(
    Boolean(defaults.tower || defaults.floor || defaults.landmark)
  );
  const [mapsInput, setMapsInput] = useState("");
  const [locating, setLocating] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.vibrate?.([15]);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = Math.round(pos.coords.latitude * 1e6) / 1e6;
        const lng = Math.round(pos.coords.longitude * 1e6) / 1e6;
        setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        toast.success(`Location pinned: ${lat}, ${lng}`);
      },
      (err) => {
        setLocating(false);
        toast.error(err.message || "Could not detect location. Please allow GPS access or paste a Google Maps link.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapsLinkChange = (val: string) => {
    setMapsInput(val);
    if (!val.trim()) return;
    const parsed = parseMapsCoordinates(val);
    if (parsed) {
      setForm((prev) => ({ ...prev, latitude: parsed.latitude, longitude: parsed.longitude }));
      toast.success(`Google Maps location updated (${parsed.latitude}, ${parsed.longitude})`);
    }
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        // Fallback for society/building if user typed house address
        const payload = {
          ...form,
          society: form.society || form.area || "Neighbourhood",
          flat: form.flat || "House",
          area: form.area || form.society || "Local Area",
          city: form.city || "Ranchi",
        };
        startTransition(async () => {
          const res = await saveProfile(payload);
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          toast.success("Address & location saved");
          if (next && next.startsWith("/app")) router.push(next);
          else router.refresh();
        });
      }}
    >
      {/* 1. Basic Info */}
      <div className="space-y-3.5">
        <label className="block">
          <span className={labelClass}>Full name</span>
          <input
            autoComplete="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Shaswat Raj"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Mobile number (for delivery coordination)</span>
          <input
            autoComplete="tel"
            inputMode="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="98xxxxxx10"
            className={inputClass}
          />
        </label>
      </div>

      {/* 2. Simplified Minimal Address */}
      <div className="space-y-3.5 pt-1">
        <label className="block">
          <span className={labelClass}>House / Flat / Street address</span>
          <input
            required
            value={form.flat}
            onChange={(e) => setForm({ ...form, flat: e.target.value })}
            placeholder="e.g. Flat 302, Green Valley Apartments"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Apartment / Society / Landmark</span>
          <input
            required
            value={form.society}
            onChange={(e) => setForm({ ...form, society: e.target.value })}
            placeholder="e.g. Near Lalpur Chowk, Circular Road"
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelClass}>Area / Locality</span>
            <input
              required
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              placeholder="e.g. Lalpur"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>City</span>
            <input
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="e.g. Ranchi"
              className={inputClass}
            />
          </label>
        </div>

        {/* Optional Collapsible Extra Fields */}
        <div>
          <button
            type="button"
            onClick={() => setShowOptionalFields((v) => !v)}
            aria-expanded={showOptionalFields}
            aria-controls="profile-optional-fields"
            className="flex min-h-10 items-center gap-1.5 py-1 text-xs font-semibold text-accent hover:underline"
          >
            {showOptionalFields ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
            {showOptionalFields ? "Hide extra details" : "Add tower, floor or landmark (optional)"}
          </button>

          {showOptionalFields && (
            <div id="profile-optional-fields" className="mt-2 grid grid-cols-3 gap-2 rounded-xl bg-app-canvas p-3">
              <label className="block">
                <span className={smallLabelClass}>Tower / Block</span>
                <input
                  value={form.tower}
                  onChange={(e) => setForm({ ...form, tower: e.target.value })}
                  placeholder="e.g. B"
                  className={smallInputClass}
                />
              </label>
              <label className="block">
                <span className={smallLabelClass}>Floor</span>
                <input
                  inputMode="numeric"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  placeholder="e.g. 3"
                  className={smallInputClass}
                />
              </label>
              <label className="block">
                <span className={smallLabelClass}>Landmark</span>
                <input
                  value={form.landmark}
                  onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                  placeholder="e.g. Gate 2"
                  className={smallInputClass}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* 3. Google Maps GPS Location */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-ink">Map pin for delivery</h3>
            <p className="text-xs text-muted">Stores and delivery partners use this to reach your gate</p>
          </div>
        </div>

        {form.latitude != null && form.longitude != null ? (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-good/20 bg-good/5 p-3 text-xs text-good">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 shrink-0 text-good" aria-hidden="true" />
              <span className="font-semibold tabular-nums">
                Pinned: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
              </span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${form.latitude},${form.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 shrink-0 items-center gap-1 text-xs font-bold text-accent hover:underline"
            >
              Check on Maps <ExternalLink className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted">No exact pin set yet.</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={locating}
            onClick={handleDetectLocation}
            className="flex h-11 items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 text-[13px] font-semibold text-ink transition hover:bg-app-canvas active:scale-95 disabled:opacity-60"
          >
            <Crosshair className={`h-3.5 w-3.5 text-accent ${locating ? "animate-spin" : ""}`} aria-hidden="true" />
            {locating ? "Finding you…" : "Use my current location"}
          </button>
        </div>

        <div className="mt-3">
          <label className="block">
            <span className={smallLabelClass}>Or paste a Google Maps link or coordinates</span>
            <input
              type="text"
              value={mapsInput}
              onChange={(e) => handleMapsLinkChange(e.target.value)}
              placeholder="e.g. https://maps.app.goo.gl/... or 23.3739, 85.3342"
              className={smallInputClass}
            />
          </label>
        </div>
      </div>

      <p className="text-xs text-muted">
        Stores only see your name, flat, phone and map pin after you order or subscribe so they can deliver on time.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="flex h-13 w-full items-center justify-center rounded-xl bg-accent py-3.5 text-[15px] font-bold text-white shadow-sm transition hover:bg-accent/90 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save address & pin"}
      </button>
    </form>
  );
}
