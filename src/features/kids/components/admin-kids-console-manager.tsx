"use client";

import { UiIcon } from "@/components/ui/app-icon";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Star,
} from "lucide-react";
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
  const [status, setStatus] = useState<"approved" | "rejected" | "suspended">("approved");
  const [safetyReviewStatus, setSafetyReviewStatus] = useState<"passed" | "failed" | "pending_inspection">("passed");
  const [safetyNotes, setSafetyNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openEditModal = (p: ProviderRow) => {
    setEditingProvider(p);
    setStatus(
      (p.profile?.verificationStatus as "approved" | "rejected" | "suspended") || "approved"
    );
    setSafetyReviewStatus(
      (p.profile?.safetyReviewStatus as "passed" | "failed" | "pending_inspection") || "passed"
    );
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
          <h1 className="text-xl font-black text-ink">Kids Zone Safety & Verification Console</h1>
          <p className="mt-0.5 text-xs text-muted">
            Audit partner mentor credentials, child safety compliance, holiday passes, and reviews.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("providers")}
          className={`rounded-full px-4 py-1.5 text-xs font-black transition ${
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
          className={`rounded-full px-4 py-1.5 text-xs font-black transition ${
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
          className={`rounded-full px-4 py-1.5 text-xs font-black transition ${
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
                  className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          isApproved
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {isApproved ? (
                          <ShieldCheck className="h-3 w-3 text-emerald-700" />
                        ) : (
                          <ShieldAlert className="h-3 w-3 text-amber-700" />
                        )}
                        <span>{p.profile?.verificationStatus ?? "Not Setup"}</span>
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          safetyCleared ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        Safety: {p.profile?.safetyReviewStatus ?? "Pending"}
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-black text-ink">{p.vendor.name}</h3>
                    <p className="mt-0.5 text-xs font-medium text-muted">Area: {p.vendor.area}</p>

                    <div className="mt-3 rounded-xl bg-bg p-2.5 text-[11px] font-medium text-muted space-y-1">
                      <div>
                        <span className="font-bold text-ink">Qualifications: </span>
                        {p.profile?.qualifications || "Not specified"}
                      </div>
                      <div>
                        <span className="font-bold text-ink">Experience: </span>
                        {p.profile?.experienceYears ? `${p.profile.experienceYears} Years` : "—"}
                      </div>
                      {p.profile?.safetyNotes && (
                        <div>
                          <span className="font-bold text-ink">Audit Note: </span>
                          {p.profile.safetyNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-line/60 pt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold text-ink hover:bg-bg shadow-2xs"
                    >
                      Audit & Verify →
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
                className="rounded-2xl border border-line bg-surface p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-peach/80 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                    {pass.creditsTotal} Credits
                  </span>
                  <span className="text-sm font-black text-ink">
                    {formatINR(pass.pricePaise)}
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-black text-ink">{pass.name}</h3>
                <p className="mt-1 text-xs text-muted">{pass.description}</p>

                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-muted">
                  <span>Validity: {pass.validityDays} Days</span>
                  <span className={pass.isActive ? "text-emerald-700" : "text-slate-400"}>
                    {pass.isActive ? "● Active" : "○ Inactive"}
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
            <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-xs text-muted">
              No parent reviews posted yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {reviews.map(({ review, vendor }) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">
                      Vendor: {vendor.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${
                            s <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {review.reviewText && (
                    <p className="mt-2 text-xs font-medium text-slate-700">
                      &ldquo;{review.reviewText}&rdquo;
                    </p>
                  )}

                  <div className="mt-2 text-[10px] text-muted">
                    Posted on {new Date(review.createdAt).toLocaleDateString()} · Status: {review.moderationStatus}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit & Verification Modal */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleUpdateVerification}
            className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-ink">
                  Verify Mentor: {editingProvider.vendor.name}
                </h3>
                <p className="text-xs text-muted">Set platform verification status & safety review</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProvider(null)}
                className="text-xs font-bold text-muted hover:text-ink"
              >
                <UiIcon name="close" /> Close
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-xs font-bold text-rose-800">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-ink">Verification Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
              >
                <option value="approved">Approved (Verified Provider Badge)</option>
                <option value="rejected">Rejected (Requirements Not Met)</option>
                <option value="suspended">Suspended (Temporarily Paused)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink">Child Safety Review</label>
              <select
                value={safetyReviewStatus}
                onChange={(e) => setSafetyReviewStatus(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
              >
                <option value="passed">Passed (Background check & premises clear)</option>
                <option value="pending_inspection">Pending Inspection</option>
                <option value="failed">Failed Safety Compliance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink">Safety & Verification Notes</label>
              <textarea
                value={safetyNotes}
                onChange={(e) => setSafetyNotes(e.target.value)}
                placeholder="e.g. Identity verified via government ID, child-safe studio check passed on 2026-10-15..."
                rows={3}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProvider(null)}
                className="w-1/2 rounded-xl border border-line py-2 text-xs font-bold text-ink hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-1/2 rounded-xl bg-ink py-2 text-xs font-bold text-white shadow-2xs disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Audit Decision"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
