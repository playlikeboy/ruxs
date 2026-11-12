"use client";

import { UiIcon } from "@/components/ui/app-icon";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Users } from "lucide-react";
import { formatINR } from "@/core/money";
import { cn } from "@/components/ui/cn";
import { enrollWorkshopAction } from "../actions";
import { kidsPrimaryButton, kidsSecondaryButton } from "./kids-ui";

interface ChildOption {
  id: string;
  displayName: string;
  schoolClass: string | null;
  birthYear: number | null;
}

export function WorkshopEnrollForm({
  workshopId,
  pricePaise,
  capacity,
  enrolledCount: _enrolledCount,
  isFull,
  childProfiles,
}: {
  workshopId: string;
  pricePaise: number;
  capacity: number;
  enrolledCount: number;
  isFull: boolean;
  childProfiles: ChildOption[];
}) {
  const router = useRouter();
  const [selectedChildId, setSelectedChildId] = useState<string>(childProfiles[0]?.id || "");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  // One key per form so a retried submit is recognisable server-side.
  const [clientKey] = useState(() => `kwe-${crypto.randomUUID()}`);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) {
      setError("Please select or add a child profile.");
      return;
    }
    if (!consentAccepted) {
      setError("Please confirm guardian consent to proceed.");
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const res = await enrollWorkshopAction({
        workshopId,
        childId: selectedChildId,
        clientKey,
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      setConfirmed(true);
      router.refresh();
    } catch {
      setError("Could not reserve the seat. Check your connection and try again.");
    } finally {
      setIsPending(false);
    }
  };

  if (confirmed) {
    return (
      <div role="status" className="rounded-[20px] border border-kids-ink/10 bg-white p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-good" aria-hidden="true" />
        <h3 className="mt-2 text-lg font-semibold text-kids-ink">
          Seat reserved <UiIcon name="party" />
        </h3>
        <p className="mt-1 text-sm text-kids-ink/75">
          Your child&apos;s seat has been reserved. Pay {formatINR(pricePaise)} at the venue on the first day. Schedule details are in your Bookings dashboard.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/app/kids/bookings" className={kidsPrimaryButton}>
            Go to my bookings
          </Link>
        </div>
      </div>
    );
  }

  if (isFull) {
    return (
      <div role="status" className="rounded-[20px] border border-kids-ink/10 bg-white p-5 text-center">
        <Users className="mx-auto h-8 w-8 text-kids-ink/60" aria-hidden="true" />
        <h3 className="mt-1 text-base font-semibold text-kids-ink">Workshop is full</h3>
        <p className="mt-1 text-sm text-kids-ink/70">
          All {capacity} seats are taken. Check this provider for other dates.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleEnroll}
      className="space-y-4 rounded-[20px] border border-kids-ink/10 bg-white p-5"
    >
      <div className="flex items-center justify-between border-b border-kids-ink/10 pb-3">
        <h2 className="text-base font-semibold text-kids-ink">Reserve a seat</h2>
        <span className="text-base font-semibold tabular-nums text-kids-ink">
          {formatINR(pricePaise)}
        </span>
      </div>

      {error && (
        <p role="alert" className="rounded-[16px] border border-bad/25 bg-bad/5 p-3 text-sm font-medium text-bad">
          {error}
        </p>
      )}

      {/* Select Child */}
      <fieldset>
        <legend className="block text-sm font-semibold text-kids-ink">
          Which child will attend?
        </legend>
        {childProfiles.length === 0 ? (
          <div className="mt-2 rounded-[16px] border border-dashed border-kids-ink/20 p-3 text-center">
            <p className="text-sm text-kids-ink/70">
              Add your child before reserving a seat.
            </p>
            <Link href="/app/kids/children" className={cn(kidsSecondaryButton, "mt-2")}>
              Add a child
            </Link>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {childProfiles.map((child) => {
              const isSelected = selectedChildId === child.id;
              return (
                <label
                  key={child.id}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center justify-between rounded-[16px] border p-3 transition-colors",
                    isSelected ? "border-kids-ink bg-kids-sunny/30" : "border-kids-ink/15 bg-white hover:border-kids-ink/40"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="childId"
                      value={child.id}
                      checked={isSelected}
                      onChange={() => setSelectedChildId(child.id)}
                      className="h-4 w-4 accent-kids-ink"
                    />
                    <div>
                      <span className="block text-sm font-semibold text-kids-ink">
                        {child.displayName}
                      </span>
                      <span className="block text-xs text-kids-ink/65">
                        {child.schoolClass ? `Class: ${child.schoolClass}` : "Child"}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      {/* Guardian Safety Consent */}
      <div className="rounded-[16px] border border-kids-ink/10 bg-kids-ink/[0.03] p-3.5">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={consentAccepted}
            onChange={(e) => setConsentAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-kids-ink"
          />
          <div className="text-sm leading-snug text-kids-ink/80">
            <span className="font-semibold text-kids-ink">
              Guardian consent:
            </span>{" "}
            I confirm I am the parent/guardian of the child and authorize participation in all scheduled sessions.
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || childProfiles.length === 0}
        className={cn(kidsPrimaryButton, "min-h-12 w-full disabled:opacity-50")}
      >
        {isPending ? "Reserving…" : `Reserve seat · pay ${formatINR(pricePaise)} at venue`}
      </button>
    </form>
  );
}
