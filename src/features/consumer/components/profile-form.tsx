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
  "mt-1 h-12 w-full rounded-xl border border-black/10 bg-white px-3.5 text-[15px] text-ink placeholder:text-neutral-400 focus:border-ink focus:outline-none";

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
          <span className="text-[13px] font-medium text-neutral-600">Full name</span>
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
          <span className="text-[13px] font-medium text-neutral-600">Mobile number (for delivery coordination)</span>
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
          <span className="text-[13px] font-medium text-neutral-600">House / Flat / Street address</span>
          <input
            required
            value={form.flat}
            onChange={(e) => setForm({ ...form, flat: e.target.value })}
            placeholder="e.g. Flat 302, Green Valley Apartments"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-[13px] font-medium text-neutral-600">Apartment / Society / Landmark</span>
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
            <span className="text-[13px] font-medium text-neutral-600">Area / Locality</span>
            <input
              required
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              placeholder="e.g. Lalpur"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-medium text-neutral-600">City</span>
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
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline py-1"
          >
            {showOptionalFields ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showOptionalFields ? "Hide extra details" : "+ Add Tower, Floor or Landmark (optional)"}
          </button>

          {showOptionalFields && (
            <div className="mt-2.5 grid grid-cols-3 gap-2.5 rounded-2xl border border-black/5 bg-neutral-50/70 p-3 animate-in fade-in">
              <label className="block">
                <span className="text-[11px] font-medium text-neutral-500">Tower / Block</span>
                <input
                  value={form.tower}
                  onChange={(e) => setForm({ ...form, tower: e.target.value })}
                  placeholder="e.g. B"
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-white px-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-medium text-neutral-500">Floor</span>
                <input
                  inputMode="numeric"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  placeholder="e.g. 3"
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-white px-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-medium text-neutral-500">Landmark</span>
                <input
                  value={form.landmark}
                  onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                  placeholder="e.g. Gate 2"
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-white px-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* 3. Google Maps GPS Location */}
      <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-sky/30 via-white to-mint/20 p-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <MapPin className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-[14px] font-bold text-ink">Google Maps Pin for Delivery</h3>
            <p className="text-[11px] text-neutral-500">Vendors and delivery boys use this to navigate straight to your gate</p>
          </div>
        </div>

        {form.latitude != null && form.longitude != null ? (
          <div className="mt-3 rounded-xl border border-good/20 bg-good/5 p-3 text-xs text-good flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-good shrink-0" />
              <span className="font-semibold tabular-nums">
                Pinned: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
              </span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${form.latitude},${form.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 font-bold text-accent hover:underline text-[11px]"
            >
              Test on Maps <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <p className="mt-2.5 text-xs text-neutral-500">No exact pin set yet.</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={locating}
            onClick={handleDetectLocation}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-white border border-black/10 px-3.5 text-xs font-semibold text-ink shadow-2xs transition active:scale-95 disabled:opacity-60"
          >
            <Crosshair className={`h-3.5 w-3.5 text-accent ${locating ? "animate-spin" : ""}`} />
            {locating ? "Pinning GPS…" : "Use My Current GPS Pin"}
          </button>
        </div>

        <div className="mt-3">
          <label className="block">
            <span className="text-[11px] font-medium text-neutral-500">Or paste Google Maps link / coordinates:</span>
            <input
              type="text"
              value={mapsInput}
              onChange={(e) => handleMapsLinkChange(e.target.value)}
              placeholder="e.g. https://maps.app.goo.gl/... or 23.3739, 85.3342"
              className="mt-1 h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-xs text-ink placeholder:text-neutral-400 focus:border-ink focus:outline-none"
            />
          </label>
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        Stores only see your name, flat, phone and map pin after you order or subscribe so they can deliver on time.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="h-13 flex w-full items-center justify-center rounded-xl bg-accent py-3.5 text-[15px] font-bold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save address & pin"}
      </button>
    </form>
  );
}
