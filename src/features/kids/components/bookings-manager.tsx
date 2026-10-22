"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
} from "lucide-react";
import { formatINR } from "@/core/money";
import {
  cancelKidsBookingAction,
  cancelWorkshopEnrollmentAction,
  submitKidsReviewAction,
} from "../actions";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
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
    if (!confirm("Are you sure you want to cancel this workshop enrollment?")) return;
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
    setActionError(null);

    const res = await submitKidsReviewAction({
      vendorId: reviewingBooking.vendor.id,
      bookingId: reviewingBooking.booking.id,
      rating,
      reviewText: reviewText.trim() || undefined,
    });

    setIsSubmitting(false);
    if (!res.ok) {
      setActionError(res.error);
    } else {
      setReviewingBooking(null);
      setReviewText("");
      alert("Thank you for reviewing! Your feedback helps other parents.");
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="rounded-[20px] border-2 border-rose-500 bg-rose-50 p-3 text-xs font-bold text-rose-800">
          {actionError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("classes")}
          className={`rounded-full border-2 border-kids-grape/15 px-4 py-1.5 text-xs font-black transition ${
            activeTab === "classes"
              ? "bg-kids-sunny/80 text-kids-ink shadow-[0_3px_0_rgba(155,92,246,0.18)]"
              : "bg-white text-kids-ink/80 hover:bg-slate-50"
          }`}
        >
          🚀 Classes & Sessions ({initialBookings.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("workshops")}
          className={`rounded-full border-2 border-kids-grape/15 px-4 py-1.5 text-xs font-black transition ${
            activeTab === "workshops"
              ? "bg-emerald-300 text-kids-ink shadow-[0_3px_0_rgba(155,92,246,0.18)]"
              : "bg-white text-kids-ink/80 hover:bg-slate-50"
          }`}
        >
          🏕️ Camps & Workshops ({initialEnrollments.length})
        </button>
      </div>

      {/* Classes List */}
      {activeTab === "classes" && (
        <div className="space-y-3">
          {initialBookings.length === 0 ? (
            <div className="rounded-[26px] border-2 border-dashed border-slate-300 bg-white p-8 text-center">
              <span className="text-3xl">🚀</span>
              <h3 className="mt-2 text-sm font-black text-kids-ink">
                No class bookings yet
              </h3>
              <p className="mt-1 text-xs font-semibold text-kids-ink/60">
                Book small-batch robotics, pottery, or chess sessions for your child.
              </p>
              <Link
                href="/app/kids/activities"
                className="mt-4 inline-block rounded-full border-2 border-kids-grape/15 bg-kids-sunny px-5 py-2 text-xs font-black text-kids-ink shadow-[0_3px_0_rgba(155,92,246,0.18)]"
              >
                Explore Classes →
              </Link>
            </div>
          ) : (
            initialBookings.map(({ booking, service, child, vendor }) => {
              const startDate = new Date(booking.startsAt);
              const isPast = startDate < new Date();
              const isConfirmed = booking.bookingStatus === "confirmed";
              const isCompleted = booking.bookingStatus === "completed" || (isConfirmed && isPast);

              return (
                <div
                  key={booking.id}
                  className="rounded-[26px] border-2 border-kids-grape/15 bg-white p-4 shadow-[0_3px_0_rgba(155,92,246,0.18)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-kids-grape/20 bg-pink-100 px-2 py-0.5 text-[10px] font-black text-kids-ink">
                          👶 {child.displayName}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${
                            booking.bookingStatus === "confirmed"
                              ? "border-emerald-600 bg-emerald-100 text-emerald-900"
                              : booking.bookingStatus === "cancelled"
                              ? "border-rose-400 bg-rose-100 text-rose-900"
                              : "border-slate-300 bg-slate-100 text-kids-ink/80"
                          }`}
                        >
                          {booking.bookingStatus.toUpperCase()}
                        </span>
                      </div>

                      <h3 className="mt-1.5 text-base font-black text-kids-ink">
                        {service?.title ?? "Activity Session"}
                      </h3>
                      <Link
                        href={`/app/kids/providers/${vendor.slug}`}
                        className="text-xs font-bold text-kids-ink/70 hover:text-kids-bubblegum"
                      >
                        By {vendor.name}
                      </Link>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-kids-ink">
                        {formatINR(booking.priceSnapshotPaise + (booking.materialFeeSnapshotPaise || 0))}
                      </span>
                      <span className="block text-[10px] font-bold text-slate-400">
                        Ref: {booking.number}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2.5 text-xs font-semibold text-kids-ink/70">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-amber-600" />
                      <span>{startDate.toLocaleDateString()}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-kids-ink/60" />
                      <span>
                        {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </span>
                    <span className="capitalize">{booking.deliveryMode}</span>
                  </div>

                  {booking.address && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-kids-ink/60">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{booking.address}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-dashed border-slate-200 pt-2.5">
                    {isCompleted ? (
                      <button
                        type="button"
                        onClick={() => setReviewingBooking({ booking, service, child, vendor })}
                        className="inline-flex items-center gap-1 rounded-full border border-kids-grape/20 bg-amber-100 px-3 py-1 text-xs font-black text-kids-ink hover:bg-amber-200"
                      >
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>Leave Review</span>
                      </button>
                    ) : booking.bookingStatus === "confirmed" ? (
                      <button
                        type="button"
                        disabled={cancellingId === booking.id}
                        onClick={() => handleCancelBooking(booking.id)}
                        className="rounded-full border border-rose-300 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Workshops List */}
      {activeTab === "workshops" && (
        <div className="space-y-3">
          {initialEnrollments.length === 0 ? (
            <div className="rounded-[26px] border-2 border-dashed border-slate-300 bg-white p-8 text-center">
              <span className="text-3xl">🏕️</span>
              <h3 className="mt-2 text-sm font-black text-kids-ink">
                No workshop enrollments yet
              </h3>
              <p className="mt-1 text-xs font-semibold text-kids-ink/60">
                Enroll in holiday camps and weekend robotics, pottery or chess bootcamps.
              </p>
              <Link
                href="/app/kids/workshops"
                className="mt-4 inline-block rounded-full border-2 border-kids-grape/15 bg-emerald-400 px-5 py-2 text-xs font-black text-kids-ink shadow-[0_3px_0_rgba(155,92,246,0.18)]"
              >
                Browse Workshops →
              </Link>
            </div>
          ) : (
            initialEnrollments.map(({ enrollment, workshop, child, vendor }) => {
              const isConfirmed = enrollment.status === "confirmed";

              return (
                <div
                  key={enrollment.id}
                  className="rounded-[26px] border-2 border-kids-grape/15 bg-white p-4 shadow-[0_3px_0_rgba(155,92,246,0.18)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-kids-grape/20 bg-pink-100 px-2 py-0.5 text-[10px] font-black text-kids-ink">
                          👶 {child.displayName}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${
                            isConfirmed
                              ? "border-emerald-600 bg-emerald-100 text-emerald-900"
                              : enrollment.status === "cancelled"
                              ? "border-rose-400 bg-rose-100 text-rose-900"
                              : "border-slate-300 bg-slate-100 text-kids-ink/80"
                          }`}
                        >
                          {enrollment.status.toUpperCase()}
                        </span>
                      </div>

                      <h3 className="mt-1.5 text-base font-black text-kids-ink">
                        {workshop.title}
                      </h3>
                      <Link
                        href={`/app/kids/providers/${vendor.slug}`}
                        className="text-xs font-bold text-kids-ink/70 hover:text-kids-bubblegum"
                      >
                        By {vendor.name}
                      </Link>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-kids-ink">
                        {formatINR(enrollment.priceSnapshotPaise)}
                      </span>
                      <span className="block text-[10px] font-bold text-slate-400">
                        ID: {enrollment.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2.5 text-xs font-semibold text-kids-ink/70">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-amber-600" />
                      <span>{workshop.startDate} – {workshop.endDate}</span>
                    </span>
                    <span>{workshop.venueOrMode}</span>
                  </div>

                  {isConfirmed && (
                    <div className="mt-3 flex items-center justify-end border-t border-dashed border-slate-200 pt-2.5">
                      <button
                        type="button"
                        disabled={cancellingId === enrollment.id}
                        onClick={() => handleCancelEnrollment(enrollment.id)}
                        className="rounded-full border border-rose-300 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        {cancellingId === enrollment.id ? "Cancelling..." : "Cancel Enrollment"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Review Modal Dialog */}
      {reviewingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmitReview}
            className="w-full max-w-sm rounded-[26px] border-2 border-kids-grape/15 bg-white p-5 shadow-[0_7px_0_rgba(155,92,246,0.16),0_16px_28px_-14px_rgba(59,31,92,0.4)]"
          >
            <h3 className="text-base font-black text-kids-ink">
              Review Session Experience
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-kids-ink/60">
              For {reviewingBooking.service?.title} with {reviewingBooking.vendor.name}
            </p>

            {/* Rating Stars */}
            <div className="mt-3 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1 transition hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 ${
                      s <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            <div className="mt-3">
              <label className="block text-[11px] font-bold text-kids-ink/80">
                Comments (Optional)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share how your child enjoyed the session, mentor pacing, project outcome..."
                className="mt-1 w-full rounded-[20px] border-2 border-kids-grape/15 p-2.5 text-xs font-medium text-kids-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                rows={3}
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setReviewingBooking(null)}
                className="w-1/2 rounded-[20px] border-2 border-slate-200 py-2 text-xs font-black text-kids-ink/80 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-1/2 rounded-[20px] border-2 border-kids-grape/15 bg-kids-sunny py-2 text-xs font-black text-kids-ink shadow-[0_3px_0_rgba(155,92,246,0.18)] hover:bg-kids-sunny/80 disabled:opacity-50"
              >
                {isSubmitting ? "Posting..." : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
