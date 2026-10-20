"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { formatINR } from "@/core/money";
import { bookKidsServiceAction } from "../actions";

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
}: {
  service: ServiceData;
  childProfiles: ChildOption[];
}) {
  const [selectedChildId, setSelectedChildId] = useState<string>(childProfiles[0]?.id || "");
  const [deliveryMode, setDeliveryMode] = useState<"home" | "studio" | "online">(
    (service.deliveryModes[0] as "home" | "studio" | "online") || "studio"
  );
  const [sessionDate, setSessionDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [sessionTime, setSessionTime] = useState<string>("16:00");
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

    setError(null);
    setIsPending(true);

    try {
      const startsAt = new Date(`${sessionDate}T${sessionTime}:00`);
      const clientKey = `kbk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const res = await bookKidsServiceAction({
        serviceId: service.id,
        childId: selectedChildId,
        startsAt: startsAt.toISOString(),
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
      <div className="rounded-3xl border-2 border-slate-900 bg-white p-6 text-center shadow-[4px_4px_0_0_#0f172a] space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-900 bg-emerald-300 text-3xl shadow-sm">
          <CheckCircle2 className="h-8 w-8 text-slate-950" />
        </div>
        <div>
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">
            Booking Confirmed! 🎉
          </span>
          <h2 className="mt-2 text-xl font-black text-slate-950">{service.title}</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Booking Ref: <span className="font-mono text-slate-900">{confirmedNumber}</span>
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-600">
            Scheduled for {sessionDate} at {sessionTime} ({deliveryMode.toUpperCase()}) with {service.vendor.name}.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/app/kids/bookings"
            className="rounded-full border-2 border-slate-900 bg-amber-400 py-2.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_0_#0f172a]"
          >
            View My Bookings →
          </Link>
          <Link
            href="/app/kids"
            className="rounded-full border border-slate-300 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
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
        <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-3 text-xs font-bold text-red-900 shadow-sm">
          {error}
        </div>
      )}

      {/* Select Child */}
      <div className="rounded-2xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_0_#0f172a]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500">
            Participating Child
          </label>
          <Link href="/app/kids/children" className="text-xs font-bold text-accent hover:underline">
            + Manage profiles
          </Link>
        </div>

        {childProfiles.length === 0 ? (
          <div className="mt-2 text-center">
            <p className="text-xs font-semibold text-slate-600">No child profiles found.</p>
            <Link
              href="/app/kids/children"
              className="mt-2 inline-block rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black"
            >
              Add Child Profile First
            </Link>
          </div>
        ) : (
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="mt-2 w-full rounded-xl border-2 border-slate-900 bg-amber-50 px-3 py-2 text-xs font-black text-slate-900 focus:outline-none"
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
      <div className="rounded-2xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_0_#0f172a]">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
          Delivery Mode
        </label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {service.deliveryModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDeliveryMode(mode as "home" | "studio" | "online")}
              className={`rounded-xl border-2 p-2 text-center text-xs font-black capitalize transition ${
                deliveryMode === mode
                  ? "border-slate-900 bg-amber-300 text-slate-950 shadow-[2px_2px_0_0_#0f172a]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {mode === "home" ? "🏡 Home Visit" : mode === "studio" ? "🏫 Studio" : "💻 Online"}
            </button>
          ))}
        </div>

        {deliveryMode === "home" && (
          <div className="mt-3">
            <label className="block text-[11px] font-bold text-slate-700">Home Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Society, Flat / House No., Landmark"
              className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Date & Time selection */}
      <div className="rounded-2xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_0_#0f172a]">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
          Session Slot
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700">Date</label>
            <input
              type="date"
              required
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700">Time</label>
            <select
              value={sessionTime}
              onChange={(e) => setSessionTime(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
            >
              {["10:00", "11:30", "14:00", "15:30", "17:00", "18:30"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Material Add-on if extra */}
      {service.materialFeePolicy === "extra" && service.materialFeePaise > 0 && (
        <div className="flex items-center justify-between rounded-2xl border-2 border-slate-900 bg-sky-50 p-3.5 shadow-[2px_2px_0_0_#0f172a]">
          <div>
            <span className="block text-xs font-black text-slate-900">Include Project Material Kit</span>
            <span className="block text-[11px] font-medium text-slate-600">
              Take-home hardware parts & workbox (+{formatINR(service.materialFeePaise)})
            </span>
          </div>
          <input
            type="checkbox"
            checked={includeMaterials}
            onChange={(e) => setIncludeMaterials(e.target.checked)}
            className="h-5 w-5 rounded border-2 border-slate-900 text-amber-500"
          />
        </div>
      )}

      {/* Price Summary */}
      <div className="rounded-2xl border-2 border-slate-900 bg-amber-50 p-3.5 shadow-[2px_2px_0_0_#0f172a]">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Session Fee</span>
          <span>{formatINR(service.pricePaise)}</span>
        </div>
        {materialFee > 0 && (
          <div className="mt-1 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Material Fee</span>
            <span>+{formatINR(materialFee)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-slate-300 pt-2 text-sm font-black text-slate-950">
          <span>Total Payable</span>
          <span>{formatINR(totalAmountPaise)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || childProfiles.length === 0}
        className="w-full rounded-full border-2 border-slate-900 bg-amber-400 py-3 text-sm font-black text-slate-950 shadow-[3px_3px_0_0_#0f172a] transition active:translate-y-0.5 active:shadow-none disabled:opacity-50"
      >
        {isPending ? "Confirming Session..." : `Book Session (${formatINR(totalAmountPaise)}) →`}
      </button>
    </form>
  );
}
