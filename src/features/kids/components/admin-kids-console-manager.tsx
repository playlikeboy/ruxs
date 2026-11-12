"use client";

import { UiIcon } from "@/components/ui/app-icon";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Star,
} from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { formatINR } from "@/core/money";
import { adminVerifyProviderAction } from "../actions";

interface ProviderRow {
  vendor: {
    id: string;
    name: string;
    slug: string;
    area: string;
    status: string;
  };
  profile: {
    verificationStatus: string;
    safetyReviewStatus: string;
    safetyNotes: string | null;
    qualifications: string | null;
    experienceYears: number | null;
    specialties: string[] | null;
  } | null;
}

interface PassRow {
  id: string;
  name: string;
  description: string | null;
  creditsTotal: number;
  pricePaise: number;
  validityDays: number;
  isActive: boolean;
}

interface ReviewRow {
  review: {
    id: string;
    rating: number;
    reviewText: string | null;
    moderationStatus: string;
    createdAt: Date;
  };
  vendor: {
    name: string;
    slug: string;
  };
}

type VerificationStatus = "pending" | "approved" | "rejected" | "suspended";
type SafetyStatus = "pending" | "passed" | "flagged";

const VERIFICATION: VerificationStatus[] = ["pending", "approved", "rejected", "suspended"];
const SAFETY: SafetyStatus[] = ["pending", "passed", "flagged"];
// Fail closed: an unknown or missing status is shown as pending, never as approved/passed.
const asVerification = (v: string | undefined): VerificationStatus => (VERIFICATION as string[]).includes(v ?? "") ? (v as VerificationStatus) : "pending";
const asSafety = (v: string | undefined): SafetyStatus => (SAFETY as string[]).includes(v ?? "") ? (v as SafetyStatus) : "pending";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export function AdminKidsConsoleManager({
  providers,
  passes,
  reviews,
}: {
  providers: ProviderRow[];
  passes: PassRow[];
  reviews: ReviewRow[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"providers" | "passes" | "reviews">("providers");
  const [editingProvider, setEditingProvider] = useState<ProviderRow | null>(null);
  const [status, setStatus] = useState<VerificationStatus>("pending");
  const [safetyReviewStatus, setSafetyReviewStatus] = useState<SafetyStatus>("pending");
  const [safetyNotes, setSafetyNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Native dialog: focus trap, Escape to close, inert page behind it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (editingProvider && !dialog.open) dialog.showModal();
    if (!editingProvider && dialog.open) dialog.close();
  }, [editingProvider]);

  const openEditModal = (p: ProviderRow) => {
    setEditingProvider(p);
    setStatus(asVerification(p.profile?.verificationStatus));
    setSafetyReviewStatus(asSafety(p.profile?.safetyReviewStatus));
    setSafetyNotes(p.profile?.safetyNotes || "");
    setErrorMsg(null);
  };

  const handleUpdateVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await adminVerifyProviderAction({
      vendorId: editingProvider.vendor.id,
      status,
      safetyReviewStatus,
      safetyNotes: safetyNotes.trim() || undefined,
    });

    setIsSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error);
    } else {
      setEditingProvider(null);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Kids safety and verification</h1>
          <p className="mt-0.5 text-sm text-muted">
            Audit partner mentor credentials, child safety compliance, holiday passes, and reviews.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("providers")}
          aria-pressed={activeTab === "providers"}
          className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
            activeTab === "providers"
              ? "bg-ink text-white"
              : "bg-surface text-muted hover:text-ink border border-line"
          }`}
        >
          Mentors & Academies ({providers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("passes")}
          aria-pressed={activeTab === "passes"}
          className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
            activeTab === "passes"
              ? "bg-ink text-white"
              : "bg-surface text-muted hover:text-ink border border-line"
          }`}
        >
          Holiday Passes ({passes.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          aria-pressed={activeTab === "reviews"}
          className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
            activeTab === "reviews"
              ? "bg-ink text-white"
              : "bg-surface text-muted hover:text-ink border border-line"
          }`}
        >
          Moderated Reviews ({reviews.length})
        </button>
      </div>

      {/* TAB 1: Providers Audit */}
      {activeTab === "providers" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => {
              const isApproved = p.profile?.verificationStatus === "approved";
              const safetyCleared = p.profile?.safetyReviewStatus === "passed";

              return (
                <div
                  key={p.vendor.id}
                  className="flex flex-col justify-between rounded-[16px] border border-line bg-surface p-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                          isApproved ? "bg-brand-leaf text-good" : "bg-brand-butter text-warn"
                        }`}
                      >
                        {isApproved ? (
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>{p.profile?.verificationStatus ?? "Not set up"}</span>
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          safetyCleared ? "bg-brand-leaf text-good" : "bg-app-canvas text-muted"
                        }`}
                      >
                        Safety: {p.profile?.safetyReviewStatus ?? "Pending"}
                      </span>
                    </div>

                    <h3 className="mt-2 text-base font-semibold text-ink">{p.vendor.name}</h3>
                    <p className="mt-0.5 text-sm text-muted">Area: {p.vendor.area}</p>

                    <div className="mt-3 space-y-1 rounded-[12px] bg-app-canvas p-2.5 text-xs text-muted">
                      <div>
                        <span className="font-semibold text-ink">Qualifications: </span>
                        {p.profile?.qualifications || "Not specified"}
                      </div>
                      <div>
                        <span className="font-semibold text-ink">Experience: </span>
                        {p.profile?.experienceYears ? `${p.profile.experienceYears} Years` : "—"}
                      </div>
                      {p.profile?.safetyNotes && (
                        <div>
                          <span className="font-semibold text-ink">Audit note: </span>
                          {p.profile.safetyNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-line/60 pt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      className="inline-flex min-h-10 items-center rounded-[12px] border border-line bg-surface px-3 text-sm font-semibold text-ink hover:bg-app-canvas"
                    >
                      Review provider
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Passes */}
      {activeTab === "passes" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {passes.map((pass) => (
              <div
                key={pass.id}
                className="rounded-[16px] border border-line bg-surface p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-brand-peach px-2.5 py-0.5 text-xs font-semibold text-accent">
                    {pass.creditsTotal} Credits
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    {formatINR(pass.pricePaise)}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-semibold text-ink">{pass.name}</h3>
                {pass.description && <p className="mt-1 text-sm text-muted">{pass.description}</p>}

                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>Valid for {pass.validityDays} days</span>
                  <span className={pass.isActive ? "font-semibold text-good" : "font-semibold text-muted"}>
                    {pass.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Reviews */}
      {activeTab === "reviews" && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
              No parent reviews yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {reviews.map(({ review, vendor }) => (
                <div
                  key={review.id}
                  className="rounded-[16px] border border-line bg-surface p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">
                      {vendor.name}
                    </span>
                    <div className="flex items-center gap-1" role="img" aria-label={`${review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          aria-hidden="true"
                          className={`h-3.5 w-3.5 ${
                            s <= review.rating ? "fill-warn text-warn" : "text-line"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {review.reviewText && (
                    <p className="mt-2 text-sm text-ink">
                      &ldquo;{review.reviewText}&rdquo;
                    </p>
                  )}

                  <div className="mt-2 text-xs text-muted">
                    Posted {dateFmt.format(new Date(review.createdAt))} · <span className="capitalize">{review.moderationStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit & verification dialog */}
      <dialog
        ref={dialogRef}
        aria-labelledby="kids-verify-title"
        onClose={() => setEditingProvider(null)}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[16px] border border-line bg-surface p-0 text-ink backdrop:bg-black/50"
      >
        {editingProvider && (
          <form onSubmit={handleUpdateVerification} className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="kids-verify-title" className="text-lg font-semibold text-ink">
                  Review {editingProvider.vendor.name}
                </h2>
                <p className="text-sm text-muted">Parents only see providers that are approved with a passed safety review.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProvider(null)}
                aria-label="Close"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-app-canvas hover:text-ink"
              >
                <UiIcon name="close" />
              </button>
            </div>

            {errorMsg && (
              <p role="alert" className="rounded-[12px] bg-bad/5 p-2.5 text-sm font-medium text-bad">
                {errorMsg}
              </p>
            )}

            <div>
              <label htmlFor="kids-verify-status" className="block text-sm font-semibold text-ink">Verification</label>
              <select
                id="kids-verify-status"
                value={status}
                onChange={(e) => setStatus(asVerification(e.target.value))}
                className="mt-1 min-h-11 w-full rounded-[12px] border border-line bg-surface px-3 text-base text-ink"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected (requirements not met)</option>
                <option value="suspended">Suspended (temporarily paused)</option>
              </select>
            </div>

            <div>
              <label htmlFor="kids-verify-safety" className="block text-sm font-semibold text-ink">Child safety review</label>
              <select
                id="kids-verify-safety"
                value={safetyReviewStatus}
                onChange={(e) => setSafetyReviewStatus(asSafety(e.target.value))}
                className="mt-1 min-h-11 w-full rounded-[12px] border border-line bg-surface px-3 text-base text-ink"
              >
                <option value="pending">Pending</option>
                <option value="passed">Passed (background check and premises clear)</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>

            <div>
              <label htmlFor="kids-verify-notes" className="block text-sm font-semibold text-ink">Notes (internal)</label>
              <textarea
                id="kids-verify-notes"
                value={safetyNotes}
                onChange={(e) => setSafetyNotes(e.target.value)}
                maxLength={1000}
                placeholder="e.g. ID checked, studio visited on 15 Oct"
                rows={3}
                className="mt-1 w-full rounded-[12px] border border-line bg-surface px-3 py-2 text-base text-ink placeholder:text-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button type="button" onClick={() => setEditingProvider(null)} className={buttonClass("secondary", "md")}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className={buttonClass("primary", "md")}>
                {isSubmitting ? "Saving…" : "Save decision"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
