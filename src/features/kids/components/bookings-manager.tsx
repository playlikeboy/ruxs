"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { UiIcon } from "@/components/ui/app-icon";
import { cn } from "@/components/ui/cn";
import { canGuardianCancel, guardianStatusLabel, isReviewEligible } from "@/core/kids/booking-status";
import { formatINR } from "@/core/money";
import { todayIST } from "@/core/time";
import {
  cancelKidsBookingAction,
  cancelWorkshopEnrollmentAction,
  submitKidsReviewAction,
} from "../actions";
import { kidsPrimaryButton, kidsSecondaryButton } from "./kids-ui";

interface BookingRow {
  booking: {
    id: string;
    number: string;
    startsAt: Date;
    endsAt: Date;
    deliveryMode: string;
    address: string | null;
    priceSnapshotPaise: number;
    materialFeeSnapshotPaise: number;
    bookingStatus: string;
    paymentStatus: string;
  };
  service: {
    id: string;
    title: string;
  } | null;
  child: {
    id: string;
    displayName: string;
    schoolClass: string | null;
  };
  vendor: {
    id: string;
    name: string;
    slug: string;
  };
}

interface EnrollmentRow {
  enrollment: {
    id: string;
    status: string;
    priceSnapshotPaise: number;
    createdAt: Date;
  };
  workshop: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    venueOrMode: string;
  };
  child: {
    id: string;
    displayName: string;
    schoolClass: string | null;
  };
  vendor: {
    id: string;
    name: string;
    slug: string;
  };
}

// Fixed locale and zone so server and browser render the same text (no hydration mismatch).
const dateFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

const card = "rounded-[20px] border border-kids-ink/10 bg-white p-4";
const chip = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold";
const cancelButton =
  "inline-flex min-h-10 items-center rounded-full border border-bad/30 px-4 text-sm font-semibold text-bad hover:bg-bad/5 disabled:opacity-50";

function statusTone(status: string) {
  if (status === "confirmed" || status === "completed") return "border-good/30 bg-kids-mint/50 text-good";
  if (status === "cancelled") return "border-bad/25 bg-bad/5 text-bad";
  return "border-kids-ink/15 bg-kids-ink/[0.04] text-kids-ink/80";
}

export function BookingsManager({
  initialBookings,
  initialEnrollments,
}: {
  initialBookings: BookingRow[];
  initialEnrollments: EnrollmentRow[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"classes" | "workshops">("classes");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<BookingRow | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const today = todayIST();

  // The native dialog gives focus trapping, Escape to close and an inert background.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (reviewingBooking && !dialog.open) dialog.showModal();
    if (!reviewingBooking && dialog.open) dialog.close();
  }, [reviewingBooking]);

  const openReview = (row: BookingRow) => {
    setRating(5);
    setReviewText("");
    setReviewError(null);
    setReviewingBooking(row);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Cancel this booking?")) return;
    setActionError(null);
    setCancellingId(bookingId);

    const res = await cancelKidsBookingAction({
      bookingId,
      reason: "Guardian requested cancellation via app",
    });

    setCancellingId(null);
    if (!res.ok) {
      setActionError(res.error);
    } else {
      router.refresh();
    }
  };

  const handleCancelEnrollment = async (enrollmentId: string) => {
    if (!confirm("Cancel this workshop seat?")) return;
    setActionError(null);
    setCancellingId(enrollmentId);

    const res = await cancelWorkshopEnrollmentAction({
      enrollmentId,
      reason: "Guardian requested cancellation via app",
    });

    setCancellingId(null);
    if (!res.ok) {
      setActionError(res.error);
    } else {
      router.refresh();
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingBooking) return;
    setIsSubmitting(true);
    setReviewError(null);

    const res = await submitKidsReviewAction({
      vendorId: reviewingBooking.vendor.id,
      bookingId: reviewingBooking.booking.id,
      rating,
      reviewText: reviewText.trim() || undefined,
    });

    setIsSubmitting(false);
    if (!res.ok) {
      setReviewError(res.error);
    } else {
      setReviewingBooking(null);
      toast.success("Thanks for your review. It helps other parents.");
      router.refresh();
    }
  };

  const tab = (key: "classes" | "workshops", label: string, count: number, icon: "sparkle" | "camp") => (
    <button
      type="button"
      onClick={() => setActiveTab(key)}
      aria-pressed={activeTab === key}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors",
        activeTab === key ? "border-kids-ink bg-kids-ink text-white" : "border-kids-ink/15 bg-white text-kids-ink hover:border-kids-ink/40"
      )}
    >
      <UiIcon name={icon} /> {label} ({count})
    </button>
  );

  return (
    <div className="space-y-4">
      {actionError && (
        <p role="alert" className="rounded-[16px] border border-bad/25 bg-bad/5 p-3 text-sm font-medium text-bad">
          {actionError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {tab("classes", "Classes", initialBookings.length, "sparkle")}
        {tab("workshops", "Workshops", initialEnrollments.length, "camp")}
      </div>

      {activeTab === "classes" && (
        <div className="space-y-3">
          {initialBookings.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-kids-ink/20 bg-white p-8 text-center">
              <UiIcon name="sparkle" className="h-6 w-6 text-accent" />
              <h3 className="mt-2 text-base font-semibold text-kids-ink">No class bookings yet</h3>
              <p className="mt-1 text-sm text-kids-ink/65">Find a class near you and request a time that suits your child.</p>
              <Link href="/app/kids/activities" className={cn(kidsPrimaryButton, "mt-4")}>
                Explore classes
              </Link>
            </div>
          ) : (
            initialBookings.map((row) => {
              const { booking, service, child, vendor } = row;
              const startDate = new Date(booking.startsAt);
              const isCompleted = isReviewEligible(booking.bookingStatus);
              const canCancel = canGuardianCancel(booking.bookingStatus, startDate);

              return (
                <article key={booking.id} className={card}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn(chip, "border-kids-ink/15 bg-kids-peach/50 text-kids-ink")}>
                          <UiIcon name="age" /> {child.displayName}
                        </span>
                        <span className={cn(chip, statusTone(booking.bookingStatus))}>
                          {guardianStatusLabel(booking.bookingStatus, startDate)}
                        </span>
                      </div>

                      <h3 className="mt-1.5 text-base font-semibold text-kids-ink">{service?.title ?? "Activity session"}</h3>
                      <Link
                        href={`/app/kids/providers/${vendor.slug}`}
                        className="text-sm font-medium text-kids-ink/70 underline-offset-4 hover:text-kids-ink hover:underline"
                      >
                        By {vendor.name}
                      </Link>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-base font-semibold tabular-nums text-kids-ink">
                        {formatINR(booking.priceSnapshotPaise + (booking.materialFeeSnapshotPaise || 0))}
                      </span>
                      <span className="block text-xs text-kids-ink/60">Ref {booking.number}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-kids-ink/10 pt-2.5 text-sm text-kids-ink/75">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      <span>{dateFmt.format(startDate)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      <span className="tabular-nums">{timeFmt.format(startDate)}</span>
                    </span>
                    <span className="capitalize">{booking.deliveryMode}</span>
                  </div>

                  {booking.address && (
                    <p className="mt-2 flex items-center gap-1 text-sm text-kids-ink/65">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{booking.address}</span>
                    </p>
                  )}

                  {(isCompleted || canCancel || booking.bookingStatus === "confirmed") && (
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-kids-ink/10 pt-2.5">
                      {isCompleted ? (
                        <button type="button" onClick={() => openReview(row)} className={cn(kidsSecondaryButton, "min-h-10 px-4")}>
                          <Star className="h-4 w-4 fill-kids-sunny text-warn" aria-hidden="true" />
                          Leave a review
                        </button>
                      ) : canCancel ? (
                        <button
                          type="button"
                          disabled={cancellingId === booking.id}
                          onClick={() => handleCancelBooking(booking.id)}
                          className={cancelButton}
                        >
                          {cancellingId === booking.id ? "Cancelling…" : booking.bookingStatus === "held" ? "Withdraw request" : "Cancel booking"}
                        </button>
                      ) : (
                        <span className="text-sm text-kids-ink/65">You can review once {vendor.name} marks this session done.</span>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

      {activeTab === "workshops" && (
        <div className="space-y-3">
          {initialEnrollments.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-kids-ink/20 bg-white p-8 text-center">
              <UiIcon name="camp" className="h-6 w-6 text-accent" />
              <h3 className="mt-2 text-base font-semibold text-kids-ink">No workshop seats yet</h3>
              <p className="mt-1 text-sm text-kids-ink/65">Holiday camps and weekend workshops from providers near you show up here once you reserve a seat.</p>
              <Link href="/app/kids/workshops" className={cn(kidsPrimaryButton, "mt-4")}>
                Browse workshops
              </Link>
            </div>
          ) : (
            initialEnrollments.map(({ enrollment, workshop, child, vendor }) => {
              const isConfirmed = enrollment.status === "confirmed";
              const canCancel = isConfirmed && workshop.startDate > today;

              return (
                <article key={enrollment.id} className={card}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn(chip, "border-kids-ink/15 bg-kids-peach/50 text-kids-ink")}>
                          <UiIcon name="age" /> {child.displayName}
                        </span>
                        <span className={cn(chip, "capitalize", statusTone(enrollment.status))}>{enrollment.status}</span>
                      </div>

                      <h3 className="mt-1.5 text-base font-semibold text-kids-ink">{workshop.title}</h3>
                      <Link
                        href={`/app/kids/providers/${vendor.slug}`}
                        className="text-sm font-medium text-kids-ink/70 underline-offset-4 hover:text-kids-ink hover:underline"
                      >
                        By {vendor.name}
                      </Link>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-base font-semibold tabular-nums text-kids-ink">{formatINR(enrollment.priceSnapshotPaise)}</span>
                      <span className="block text-xs text-kids-ink/60">ID {enrollment.id.slice(0, 8)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-kids-ink/10 pt-2.5 text-sm text-kids-ink/75">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      <span className="tabular-nums">{workshop.startDate} – {workshop.endDate}</span>
                    </span>
                    <span className="capitalize">{workshop.venueOrMode}</span>
                  </div>

                  {canCancel && (
                    <div className="mt-3 flex items-center justify-end border-t border-kids-ink/10 pt-2.5">
                      <button
                        type="button"
                        disabled={cancellingId === enrollment.id}
                        onClick={() => handleCancelEnrollment(enrollment.id)}
                        className={cancelButton}
                      >
                        {cancellingId === enrollment.id ? "Cancelling…" : "Cancel seat"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="kids-review-title"
        onClose={() => setReviewingBooking(null)}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-[20px] border border-kids-ink/10 bg-white p-0 text-kids-ink backdrop:bg-black/50"
      >
        {reviewingBooking && (
          <form onSubmit={handleSubmitReview} className="p-5">
            <h2 id="kids-review-title" className="text-lg font-semibold">Review this session</h2>
            <p className="mt-0.5 text-sm text-kids-ink/65">
              {reviewingBooking.service?.title ?? "Activity session"} with {reviewingBooking.vendor.name}
            </p>

            <fieldset className="mt-3">
              <legend className="text-sm font-semibold">Rating</legend>
              <div className="mt-1 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    aria-pressed={s === rating}
                    aria-label={`${s} ${s === 1 ? "star" : "stars"}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-kids-ink/5"
                  >
                    <Star className={cn("h-6 w-6", s <= rating ? "fill-kids-sunny text-warn" : "text-kids-ink/25")} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </fieldset>

            <label htmlFor="kids-review-text" className="mt-3 block text-sm font-semibold">
              Comments (optional)
            </label>
            <textarea
              id="kids-review-text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={1000}
              placeholder="How did your child find the session?"
              className="mt-1 w-full rounded-[12px] border border-kids-ink/15 p-2.5 text-base text-kids-ink placeholder:text-kids-ink/45"
              rows={3}
            />

            {reviewError && (
              <p role="alert" className="mt-3 rounded-[12px] bg-bad/5 p-2.5 text-sm font-medium text-bad">
                {reviewError}
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setReviewingBooking(null)} className={kidsSecondaryButton}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className={cn(kidsPrimaryButton, "disabled:opacity-50")}>
                {isSubmitting ? "Posting…" : "Submit review"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
