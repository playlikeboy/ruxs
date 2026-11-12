"use client";

import { UiIcon } from "@/components/ui/app-icon";

import { useState } from "react";
import { cn } from "@/components/ui/cn";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { formatINR } from "@/core/money";
import { bookKidsServiceAction } from "../actions";
import { kidsPrimaryButton, kidsSecondaryButton } from "./kids-ui";
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
  // One key per form: a retried submit (double tap, flaky network) returns the same booking.
  const [clientKey] = useState(() => `kbk-${crypto.randomUUID()}`);

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
        return;
      }

      setConfirmedNumber(res.number);
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
      <div role="status" className="space-y-4 rounded-[20px] border border-kids-ink/10 bg-white p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kids-mint">
          <CheckCircle2 className="h-8 w-8 text-good" aria-hidden="true" />
        </div>
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-kids-mint/60 px-3 py-1 text-xs font-semibold text-good">
            Request sent <UiIcon name="party" />
          </span>
          <h2 className="mt-2 text-xl font-semibold text-kids-ink">{service.title}</h2>
          <p className="mt-1 text-sm text-kids-ink/65">
            Booking ref <span className="font-mono text-kids-ink">{confirmedNumber}</span>
          </p>
          <p className="mt-2 text-sm text-kids-ink/75">
            Requested for {new Date(slot!).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" })} at {slotTimeFmt.format(new Date(slot!)).toLowerCase()} with {service.vendor.name}. You will see it as confirmed once they accept.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link href="/app/kids/bookings" className={kidsPrimaryButton}>
            View my bookings
          </Link>
          <Link href="/app/kids" className={kidsSecondaryButton}>
            Explore more activities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleBooking} className="space-y-4">
      {error && (
        <p role="alert" className="rounded-[16px] border border-bad/25 bg-bad/5 p-3 text-sm font-medium text-bad">
          {error}
        </p>
      )}

      {/* Select Child */}
      <div className="rounded-[20px] border border-kids-ink/10 bg-white p-3.5">
        <div className="flex items-center justify-between">
          <label htmlFor="kids-booking-child" className="text-sm font-semibold text-kids-ink">
            Child
          </label>
          <Link href="/app/kids/children" className="inline-flex min-h-10 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">
            Manage children
          </Link>
        </div>

        {childProfiles.length === 0 ? (
          <div className="mt-2 text-center">
            <p className="text-sm text-kids-ink/70">Add your child before requesting a session.</p>
            <Link href="/app/kids/children" className={cn(kidsSecondaryButton, "mt-2")}>
              Add a child
            </Link>
          </div>
        ) : (
          <select
            id="kids-booking-child"
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="mt-2 w-full rounded-[12px] border border-kids-ink/15 bg-white px-3 py-2 text-base text-kids-ink placeholder:text-kids-ink/45"
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
      <fieldset className="rounded-[20px] border border-kids-ink/10 bg-white p-3.5">
        <legend className="sr-only">Where the session happens</legend>
        <p aria-hidden="true" className="text-sm font-semibold text-kids-ink">
          Where
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {service.deliveryModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDeliveryMode(mode as "home" | "studio" | "online")}
              aria-pressed={deliveryMode === mode}
              className={cn(
                "min-h-11 rounded-[12px] border px-2 text-center text-sm font-semibold transition-colors",
                deliveryMode === mode
                  ? "border-kids-ink bg-kids-ink text-white"
                  : "border-kids-ink/15 bg-white text-kids-ink hover:border-kids-ink/40"
              )}
            >
              {mode === "home" ? "Home Visit" : mode === "studio" ? "Studio" : "Online"}
            </button>
          ))}
        </div>

        {deliveryMode === "home" && (
          <div className="mt-3">
            <label htmlFor="kids-booking-address" className="block text-sm font-semibold text-kids-ink">Home address</label>
            <input
              id="kids-booking-address"
              type="text"
              required
              maxLength={255}
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Society, flat / house no., landmark"
              className="mt-1 w-full rounded-[12px] border border-kids-ink/15 bg-white px-3 py-2 text-base text-kids-ink placeholder:text-kids-ink/45"
            />
          </div>
        )}
      </fieldset>

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
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[20px] border border-kids-ink/10 bg-white p-3.5">
          <span>
            <span className="block text-sm font-semibold text-kids-ink">Add the materials kit</span>
            <span className="block text-sm text-kids-ink/70">
              +{formatINR(service.materialFeePaise)}, set by the provider
            </span>
          </span>
          <input
            type="checkbox"
            checked={includeMaterials}
            onChange={(e) => setIncludeMaterials(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-kids-ink"
          />
        </label>
      )}

      {/* Price Summary */}
      <div className="rounded-[20px] border border-kids-ink/10 bg-kids-sunny/25 p-3.5">
        <div className="flex items-center justify-between text-sm text-kids-ink/80">
          <span>Session fee</span>
          <span className="tabular-nums">{formatINR(service.pricePaise)}</span>
        </div>
        {materialFee > 0 && (
          <div className="mt-1 flex items-center justify-between text-sm text-kids-ink/80">
            <span>Materials</span>
            <span className="tabular-nums">+{formatINR(materialFee)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-kids-ink/15 pt-2 text-base font-semibold text-kids-ink">
          <span>Pay at the session</span>
          <span className="tabular-nums">{formatINR(totalAmountPaise)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || childProfiles.length === 0 || !slot}
        className={cn(kidsPrimaryButton, "min-h-12 w-full disabled:opacity-50")}
      >
        {isPending ? "Sending request…" : `Request session · ${formatINR(totalAmountPaise)}`}
      </button>
    </form>
  );
}
