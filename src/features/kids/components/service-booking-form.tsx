"use client";

import { UiIcon } from "@/components/ui/app-icon";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { formatINR } from "@/core/money";
import { bookKidsServiceAction } from "../actions";
import { SlotCalendar, slotTimeFmt, type SlotDay } from "@/features/bookings/components/slot-calendar";

interface ChildOption {
  id: string;
  displayName: string;
  schoolClass: string | null;
  birthYear: number | null;
}

interface ServiceData {
  id: string;
  title: string;
  description: string | null;
  minAge: number;
  maxAge: number;
  suitableClasses: string[];
  durationMinutes: number;
  deliveryModes: string[];
  pricePaise: number;
  materialFeePolicy: string;
  materialFeePaise: number;
  vendor: {
    id: string;
    name: string;
    slug: string;
    area: string;
  };
  materials: Array<{
    id: string;
    name: string;
    description: string | null;
    pricePaise: number;
    policy: string;
  }>;
}

export function ServiceBookingForm({
  service,
  childProfiles,
  calendar,
}: {
  service: ServiceData;
  childProfiles: ChildOption[];
  calendar: SlotDay[];
}) {
  const [selectedChildId, setSelectedChildId] = useState<string>(childProfiles[0]?.id || "");
  const [deliveryMode, setDeliveryMode] = useState<"home" | "studio" | "online">(
    (service.deliveryModes[0] as "home" | "studio" | "online") || "studio"
  );
  const [sessionDate, setSessionDate] = useState<string>(
    () => calendar.find((d) => d.slots.length > 0)?.date ?? calendar[0]?.date ?? ""
  );
  const [slot, setSlot] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [includeMaterials, setIncludeMaterials] = useState(
    service.materialFeePolicy === "required"
  );
  const paymentMode = "pay_at_session";

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedNumber, setConfirmedNumber] = useState<string | null>(null);

  // Calculate pricing breakdown
  const materialFee =
    service.materialFeePolicy === "required"
      ? service.materialFeePaise
      : service.materialFeePolicy === "extra" && includeMaterials
      ? service.materialFeePaise
      : 0;
  const totalAmountPaise = service.pricePaise + materialFee;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) {
      setError("Please select or add a child profile first.");
      return;
    }
    if (!slot) {
      setError("Pick a time for the session.");
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const clientKey = `kbk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const res = await bookKidsServiceAction({
        serviceId: service.id,
        childId: selectedChildId,
        startsAt: slot,
        deliveryMode,
        address: deliveryMode === "home" ? address : undefined,
        includeMaterials,
        paymentMode,
        clientKey,
      });

      if (!res.ok) {
        setError(res.error);
        setIsPending(false);
        return;
      }

      setConfirmedNumber(res.number || "KBK-CONFIRMED");
      try {
        navigator.vibrate?.(40);
      } catch {}
    } catch {
      setError("Could not complete booking. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  if (confirmedNumber) {
    return (
      <div className="rounded-[20px] border border-kids-ink/10 bg-white p-6 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-kids-ink/10 bg-emerald-300 text-3xl shadow-sm">
          <CheckCircle2 className="h-8 w-8 text-kids-ink" />
        </div>
        <div>
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
            Request sent <UiIcon name="party" />
          </span>
          <h2 className="mt-2 text-xl font-semibold text-kids-ink">{service.title}</h2>
          <p className="mt-1 text-xs font-bold text-kids-ink/60">
            Booking Ref: <span className="font-mono text-kids-ink">{confirmedNumber}</span>
          </p>
          <p className="mt-2 text-xs font-semibold text-kids-ink/70">
            Requested for {new Date(slot!).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" })} at {slotTimeFmt.format(new Date(slot!)).toLowerCase()} with {service.vendor.name}. You will see it as confirmed once they accept.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/app/kids/bookings"
            className="rounded-full border border-kids-ink/10 bg-kids-sunny py-2.5 text-xs font-semibold text-kids-ink"
          >
            View My Bookings →
          </Link>
          <Link
            href="/app/kids"
            className="rounded-full border border-slate-300 py-2 text-xs font-bold text-kids-ink/80 hover:bg-slate-50"
          >
            Explore More Activities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleBooking} className="space-y-4">
      {error && (
        <div className="rounded-[20px] border border-red-500 bg-red-50 p-3 text-xs font-bold text-red-900 shadow-sm">
          {error}
        </div>
      )}

      {/* Select Child */}
      <div className="rounded-[20px] border border-kids-ink/10 bg-white p-3.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-kids-ink">
            Participating Child
          </label>
          <Link href="/app/kids/children" className="text-xs font-bold text-accent hover:underline">
            + Manage profiles
          </Link>
        </div>

        {childProfiles.length === 0 ? (
          <div className="mt-2 text-center">
            <p className="text-xs font-semibold text-kids-ink/70">No child profiles found.</p>
            <Link
              href="/app/kids/children"
              className="mt-2 inline-block rounded-full border border-kids-ink/10 bg-kids-sunny/80 px-3 py-1 text-xs font-semibold"
            >
              Add Child Profile First
            </Link>
          </div>
        ) : (
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-kids-ink/10 bg-amber-50 px-3 py-2 text-xs font-semibold text-kids-ink focus:outline-none"
          >
            {childProfiles.map((child) => (
              <option key={child.id} value={child.id}>
                {child.displayName} {child.schoolClass ? `(${child.schoolClass})` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Mode selection */}
      <div className="rounded-[20px] border border-kids-ink/10 bg-white p-3.5">
        <label className="block text-sm font-semibold text-kids-ink">
          Delivery Mode
        </label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {service.deliveryModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDeliveryMode(mode as "home" | "studio" | "online")}
              className={`rounded-xl border p-2 text-center text-xs font-semibold capitalize transition ${
                deliveryMode === mode
                  ? "border-kids-ink/20 bg-kids-sunny/80 text-kids-ink"
                  : "border-slate-200 bg-white text-kids-ink/70 hover:border-slate-300"
              }`}
            >
              {mode === "home" ? "Home Visit" : mode === "studio" ? "Studio" : "Online"}
            </button>
          ))}
        </div>

        {deliveryMode === "home" && (
          <div className="mt-3">
            <label className="block text-[11px] font-bold text-kids-ink/80">Home Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Society, Flat / House No., Landmark"
              className="mt-1 w-full rounded-xl border border-kids-ink/10 bg-white px-3 py-2 text-xs font-bold text-kids-ink focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Only times the teacher has free are offered */}
      <div className="space-y-4 rounded-[20px] border border-kids-ink/10 bg-white p-3.5">
        {calendar.every((d) => d.slots.length === 0) ? (
          <p className="text-sm text-kids-ink/70">No free times in the next two weeks. Check back soon.</p>
        ) : (
          <SlotCalendar
            calendar={calendar}
            date={sessionDate}
            slot={slot}
            onDate={(d) => {
              setSessionDate(d);
              setSlot(null);
            }}
            onSlot={setSlot}
          />
        )}
      </div>

      {/* Material Add-on if extra */}
      {service.materialFeePolicy === "extra" && service.materialFeePaise > 0 && (
        <div className="flex items-center justify-between rounded-[20px] border border-kids-ink/10 bg-sky-50 p-3.5">
          <div>
            <span className="block text-xs font-semibold text-kids-ink">Include Project Material Kit</span>
            <span className="block text-[11px] font-medium text-kids-ink/70">
              Take-home hardware parts & workbox (+{formatINR(service.materialFeePaise)})
            </span>
          </div>
          <input
            type="checkbox"
            checked={includeMaterials}
            onChange={(e) => setIncludeMaterials(e.target.checked)}
            className="h-5 w-5 rounded border border-kids-ink/10 text-amber-500"
          />
        </div>
      )}

      {/* Price Summary */}
      <div className="rounded-[20px] border border-kids-ink/10 bg-amber-50 p-3.5">
        <div className="flex items-center justify-between text-xs font-bold text-kids-ink/80">
          <span>Session Fee</span>
          <span>{formatINR(service.pricePaise)}</span>
        </div>
        {materialFee > 0 && (
          <div className="mt-1 flex items-center justify-between text-xs font-bold text-kids-ink/80">
            <span>Material Fee</span>
            <span>+{formatINR(materialFee)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-slate-300 pt-2 text-sm font-semibold text-kids-ink">
          <span>Total Payable</span>
          <span>{formatINR(totalAmountPaise)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || childProfiles.length === 0 || !slot}
        className="w-full rounded-full border border-kids-ink/10 bg-kids-sunny py-3 text-sm font-semibold text-kids-ink transition active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? "Sending request..." : `Request Session (${formatINR(totalAmountPaise)}) →`}
      </button>
    </form>
  );
}
