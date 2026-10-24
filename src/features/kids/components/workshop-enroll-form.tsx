"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Users } from "lucide-react";
import { formatINR } from "@/core/money";
import { enrollWorkshopAction } from "../actions";

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
      const clientKey = `kwe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const res = await enrollWorkshopAction({
        workshopId,
        childId: selectedChildId,
        clientKey,
      });

      if (!res.ok) {
        setError(res.error);
        setIsPending(false);
        return;
      }

      setConfirmed(true);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed to reserve workshop seat.");
      setIsPending(false);
    }
  };

  if (confirmed) {
    return (
      <div className="rounded-[26px] border-2 border-kids-grape/15 bg-emerald-50 p-6 text-center shadow-[0_5px_0_rgba(155,92,246,0.14),0_12px_24px_-14px_rgba(59,31,92,0.35)]">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h3 className="mt-2 text-lg font-black text-kids-ink">
          Enrollment Confirmed! 🎉
        </h3>
        <p className="mt-1 text-xs font-semibold text-kids-ink/70">
          Your child&apos;s seat has been reserved. Pay {formatINR(pricePaise)} at the venue on the first day. Schedule details are in your Bookings dashboard.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link
            href="/app/kids/bookings"
            className="rounded-full border-2 border-kids-grape/15 bg-kids-sunny px-5 py-2 text-xs font-black text-kids-ink shadow-[0_3px_0_rgba(155,92,246,0.18)] hover:bg-kids-sunny/80"
          >
            Go to My Bookings →
          </Link>
        </div>
      </div>
    );
  }

  if (isFull) {
    return (
      <div className="rounded-[26px] border-2 border-kids-grape/15 bg-rose-50 p-5 text-center shadow-[0_5px_0_rgba(155,92,246,0.14),0_12px_24px_-14px_rgba(59,31,92,0.35)]">
        <Users className="mx-auto h-8 w-8 text-rose-500" />
        <h3 className="mt-1 text-sm font-black text-rose-950">Workshop is Full</h3>
        <p className="mt-1 text-xs font-semibold text-rose-700">
          All {capacity} seats have been reserved. Keep an eye out for upcoming batches!
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleEnroll}
      className="space-y-4 rounded-[26px] border-2 border-kids-grape/15 bg-white p-5 shadow-[0_5px_0_rgba(155,92,246,0.14),0_12px_24px_-14px_rgba(59,31,92,0.35)]"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-base font-black text-kids-ink">Reserve Child&apos;s Spot</h2>
        <span className="text-base font-black text-emerald-600">
          {formatINR(pricePaise)}
        </span>
      </div>

      {error && (
        <div className="rounded-[20px] border-2 border-rose-500 bg-rose-50 p-3 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* Select Child */}
      <div>
        <label className="block text-xs font-black text-kids-ink">
          Which child will attend?
        </label>
        {childProfiles.length === 0 ? (
          <div className="mt-2 rounded-[20px] border-2 border-dashed border-slate-300 p-3 text-center">
            <p className="text-xs font-semibold text-kids-ink/70">
              No child profiles found yet.
            </p>
            <Link
              href="/app/kids/children"
              className="mt-2 inline-block rounded-full border-2 border-kids-grape/15 bg-kids-sunny px-4 py-1.5 text-xs font-black text-kids-ink shadow-[0_2px_0_rgba(155,92,246,0.18)]"
            >
              + Add Child Profile
            </Link>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {childProfiles.map((child) => {
              const isSelected = selectedChildId === child.id;
              return (
                <label
                  key={child.id}
                  className={`flex cursor-pointer items-center justify-between rounded-[20px] border-2 p-3 transition ${
                    isSelected
                      ? "border-kids-grape/20 bg-amber-100/70 shadow-[0_3px_0_rgba(155,92,246,0.18)]"
                      : "border-slate-200 bg-slate-50 hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="childId"
                      value={child.id}
                      checked={isSelected}
                      onChange={() => setSelectedChildId(child.id)}
                      className="h-4 w-4 text-kids-ink focus:ring-amber-400"
                    />
                    <div>
                      <span className="block text-xs font-black text-kids-ink">
                        {child.displayName}
                      </span>
                      <span className="block text-[10px] font-semibold text-kids-ink/60">
                        {child.schoolClass ? `Class: ${child.schoolClass}` : "Child"}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Guardian Safety Consent */}
      <div className="rounded-[20px] border-2 border-kids-grape/15 bg-amber-50/70 p-3.5">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={consentAccepted}
            onChange={(e) => setConsentAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-kids-grape/20 text-kids-ink focus:ring-amber-400"
          />
          <div className="text-[11px] font-medium leading-tight text-kids-ink/80">
            <span className="font-bold text-kids-ink">
              Guardian Authorization & Safety Consent:
            </span>{" "}
            I confirm I am the parent/guardian of the child and authorize participation in all scheduled sessions.
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || childProfiles.length === 0}
        className="w-full rounded-[20px] border-2 border-kids-grape/15 bg-emerald-400 py-3 text-xs font-black text-kids-ink shadow-[0_3px_0_rgba(155,92,246,0.18)] transition active:translate-y-0.5 disabled:opacity-50"
      >
        {isPending ? "Confirming Spot..." : `Reserve seat · pay ${formatINR(pricePaise)} at venue`}
      </button>
    </form>
  );
}
