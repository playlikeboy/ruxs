"use client";

import { UiIcon } from "@/components/ui/app-icon";

import { providerStatusLabel, toCalendarStatus } from "@/core/kids/booking-status";
import { KidsBookingActions } from "./provider-booking-actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Archive,
} from "lucide-react";
import { formatINR } from "@/core/money";
import { saveKidsServiceAction, archiveKidsServiceAction, saveKidsWorkshopAction } from "../actions";

interface ServiceItem {
  service: {
    id: string;
    title: string;
    description: string | null;
    minAge: number;
    maxAge: number;
    durationMinutes: number;
    pricePaise: number;
    materialFeePolicy: string;
    materialFeePaise: number;
    deliveryModes: string[];
    isActive: boolean;
  };
  category: {
    id: string;
    name: string;
  };
}

interface WorkshopItem {
  workshop: {
    id: string;
    title: string;
    description: string | null;
    minAge: number;
    maxAge: number;
    startDate: string;
    endDate: string;
    capacity: number;
    pricePaise: number;
    publicationState: string;
    venueOrMode: string;
  };
  category: {
    id: string;
    name: string;
  };
}

interface BookingItem {
  booking: {
    id: string;
    number: string;
    startsAt: Date;
    deliveryMode: string;
    address: string | null;
    bookingStatus: string;
  };
  service: {
    title: string;
  } | null;
  child: {
    displayName: string;
    schoolClass: string | null;
    activityNotes: string | null;
  };
}

interface EnrollmentItem {
  enrollment: {
    id: string;
    status: string;
    createdAt: Date;
  };
  workshop: {
    title: string;
    startDate: string;
  };
  child: {
    displayName: string;
    schoolClass: string | null;
    activityNotes: string | null;
  };
}

interface ProviderProfile {
  verificationStatus: string;
  safetyReviewStatus: string;
  safetyNotes: string | null;
  qualifications: string | null;
  experienceYears: number | null;
}

export function ProviderKidsManager({
  slug,
  profile,
  services,
  workshops,
  bookings,
  enrollments,
  categories,
}: {
  slug: string;
  profile: ProviderProfile | null;
  services: ServiceItem[];
  workshops: WorkshopItem[];
  bookings: BookingItem[];
  enrollments: EnrollmentItem[];
  categories: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"classes" | "workshops" | "runsheet">("classes");
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Service Form State
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceCategoryId, setServiceCategoryId] = useState(categories[0]?.id || "stem");
  const [serviceDesc, setServiceDesc] = useState("");
  const [minAge, setMinAge] = useState(4);
  const [maxAge, setMaxAge] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const deliveryModes = ["studio", "home"];
  const [priceRupees, setPriceRupees] = useState(499);
  const [materialPolicy, setMaterialPolicy] = useState<"none" | "included" | "optional" | "required">("included");
  const [materialFeeRupees, setMaterialFeeRupees] = useState(0);

  // New Workshop Form State
  const [wsTitle, setWsTitle] = useState("");
  const [wsCategoryId, setWsCategoryId] = useState(categories[0]?.id || "stem");
  const [wsDesc, setWsDesc] = useState("");
  const [wsMinAge, setWsMinAge] = useState(5);
  const [wsMaxAge, setWsMaxAge] = useState(12);
  const [wsStartDate, setWsStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [wsEndDate, setWsEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [wsDeadline, setWsDeadline] = useState(new Date().toISOString().slice(0, 16));
  const [wsCapacity, setWsCapacity] = useState(8);
  const [wsPriceRupees, setWsPriceRupees] = useState(999);
  const [wsVenue, setWsVenue] = useState<"studio" | "online" | "outdoor">("studio");
  const [wsAddress, setWsAddress] = useState("");

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await saveKidsServiceAction({
      slug,
      categoryId: serviceCategoryId,
      title: serviceTitle,
      description: serviceDesc || undefined,
      minAge,
      maxAge,
      suitableClasses: ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"],
      durationMinutes,
      deliveryModes,
      priceRupees,
      materialFeePolicy: materialPolicy,
      materialFeeRupees,
    });

    setIsSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error);
    } else {
      setShowServiceModal(false);
      setServiceTitle("");
      setServiceDesc("");
      router.refresh();
    }
  };

  const handleArchiveService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to archive this service?")) return;
    try {
      await archiveKidsServiceAction({ slug, serviceId });
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "Failed to archive service");
    }
  };

  const handleSaveWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await saveKidsWorkshopAction({
      slug,
      categoryId: wsCategoryId,
      title: wsTitle,
      description: wsDesc || undefined,
      minAge: wsMinAge,
      maxAge: wsMaxAge,
      eligibleClasses: ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"],
      startDate: wsStartDate,
      endDate: wsEndDate,
      enrollmentDeadline: new Date(wsDeadline).toISOString(),
      venueOrMode: wsVenue,
      address: wsAddress || undefined,
      capacity: wsCapacity,
      priceRupees: wsPriceRupees,
      publicationState: "published",
    });

    setIsSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error);
    } else {
      setShowWorkshopModal(false);
      setWsTitle("");
      setWsDesc("");
      router.refresh();
    }
  };

  const isApproved = profile?.verificationStatus === "approved";
  const safetyCleared = profile?.safetyReviewStatus === "passed";

  return (
    <div className="space-y-6 px-4 py-5 sm:px-6">
      {/* Verification Status Banner */}
      <div
        className={`rounded-3xl border-2 p-4 shadow-sm ${
          isApproved
            ? "border-emerald-600 bg-emerald-50/70 text-emerald-950"
            : "border-amber-400 bg-amber-50/70 text-amber-950"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            {isApproved ? (
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            )}
            <div>
              <h3 className="text-sm font-black">
                {isApproved
                  ? "Verified RUXs Kids Activity Provider"
                  : "Verification Review In Progress"}
              </h3>
              <p className="mt-0.5 text-xs font-medium opacity-90">
                {isApproved
                  ? "Your academy badge is visible to parents on all kids activity searches."
                  : "Your classes and workshops are currently pending admin safety review before public spotlight."}
              </p>
              {profile?.safetyNotes && (
                <p className="mt-1.5 text-[11px] font-semibold italic text-slate-700">
                  Admin note: {profile.safetyNotes}
                </p>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                safetyCleared
                  ? "bg-emerald-200 text-emerald-900"
                  : "bg-amber-200 text-amber-900"
              }`}
            >
              Safety: {profile?.safetyReviewStatus ?? "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("classes")}
            className={`rounded-full px-4 py-1.5 text-xs font-black transition ${
              activeTab === "classes"
                ? "bg-ink text-white"
                : "bg-surface text-muted hover:text-ink border border-line"
            }`}
          >
            Classes ({services.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("workshops")}
            className={`rounded-full px-4 py-1.5 text-xs font-black transition ${
              activeTab === "workshops"
                ? "bg-ink text-white"
                : "bg-surface text-muted hover:text-ink border border-line"
            }`}
          >
            Bootcamps ({workshops.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("runsheet")}
            className={`rounded-full px-4 py-1.5 text-xs font-black transition ${
              activeTab === "runsheet"
                ? "bg-ink text-white"
                : "bg-surface text-muted hover:text-ink border border-line"
            }`}
          >
            Child Run Sheet ({bookings.length + enrollments.length})
          </button>
        </div>

        <div>
          {activeTab === "classes" && (
            <button
              type="button"
              onClick={() => setShowServiceModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-black text-white shadow-2xs hover:bg-accent/90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add New Class</span>
            </button>
          )}

          {activeTab === "workshops" && (
            <button
              type="button"
              onClick={() => setShowWorkshopModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-black text-white shadow-2xs hover:bg-emerald-500"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Workshop Camp</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Classes */}
      {activeTab === "classes" && (
        <div className="space-y-3">
          {services.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-surface p-8 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-muted" />
              <h4 className="mt-2 text-sm font-bold text-ink">No Kids Classes Listed</h4>
              <p className="mt-1 text-xs text-muted">
                Add robotics, chess, pottery or homework assistance classes for local children.
              </p>
              <button
                type="button"
                onClick={() => setShowServiceModal(true)}
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-white"
              >
                + Add First Class
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {services.map(({ service, category }) => (
                <div
                  key={service.id}
                  className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-peach/80 px-2 py-0.5 text-[10px] font-bold text-accent">
                        {category.name}
                      </span>
                      <span className="text-xs font-bold text-ink">
                        {formatINR(service.pricePaise)}
                      </span>
                    </div>

                    <h4 className="mt-2 text-sm font-black text-ink">{service.title}</h4>
                    {service.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted">
                        {service.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted">
                      <span><UiIcon name="age" /> Ages {service.minAge}–{service.maxAge}</span>
                      <span>·</span>
                      <span><UiIcon name="time" /> {service.durationMinutes} min</span>
                      <span>·</span>
                      <span className="capitalize">{service.deliveryModes.join(", ")}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end border-t border-line/60 pt-2.5">
                    <button
                      type="button"
                      onClick={() => handleArchiveService(service.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      <Archive className="h-3 w-3" />
                      <span>Archive</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Workshops */}
      {activeTab === "workshops" && (
        <div className="space-y-3">
          {workshops.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-surface p-8 text-center">
              <Calendar className="mx-auto h-8 w-8 text-muted" />
              <h4 className="mt-2 text-sm font-bold text-ink">No Camps or Workshops Listed</h4>
              <p className="mt-1 text-xs text-muted">
                Create weekend bootcamps or multi-day holiday masterclasses.
              </p>
              <button
                type="button"
                onClick={() => setShowWorkshopModal(true)}
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white"
              >
                + Create Workshop
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {workshops.map(({ workshop, category }) => (
                <div
                  key={workshop.id}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-900">
                      {category.name}
                    </span>
                    <span className="text-xs font-bold text-ink">
                      {formatINR(workshop.pricePaise)}
                    </span>
                  </div>

                  <h4 className="mt-2 text-sm font-black text-ink">{workshop.title}</h4>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    {workshop.description}
                  </p>

                  <div className="mt-3 text-[11px] font-semibold text-muted space-y-1">
                    <div><UiIcon name="date" /> {workshop.startDate} to {workshop.endDate}</div>
                    <div><UiIcon name="place" /> {workshop.venueOrMode} · Max {workshop.capacity} seats</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Run Sheet & Child Notes */}
      {activeTab === "runsheet" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted">
              Scheduled Child Attendees & Special Considerations
            </h4>
            <p className="mt-0.5 text-xs text-muted">
              Review child details, dietary requirements, and activity notes before session kickoff.
            </p>
          </div>

          <div className="space-y-2.5">
            {bookings.length === 0 && enrollments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-xs text-muted">
                No active child bookings yet.
              </div>
            ) : (
              <>
                {bookings.map(({ booking, service, child }) => (
                  <div
                    key={booking.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-2xs sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-black text-pink-900">
                          <UiIcon name="age" /> {child.displayName}
                        </span>
                        {child.schoolClass && (
                          <span className="text-[11px] font-semibold text-muted">
                            Class: {child.schoolClass}
                          </span>
                        )}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-700">
                          {providerStatusLabel(booking.bookingStatus, new Date(booking.startsAt))}
                        </span>
                      </div>

                      <h5 className="mt-1.5 text-xs font-black text-ink">
                        {service?.title ?? "Activity Session"}
                      </h5>

                      <div className="mt-1 flex items-center gap-3 text-[11px] font-medium text-muted">
                        <span><UiIcon name="time" /> {new Date(booking.startsAt).toLocaleString()}</span>
                        <span>Mode: {booking.deliveryMode}</span>
                      </div>

                      {child.activityNotes && (
                        <div className="mt-2 rounded-xl bg-amber-50 p-2 text-[11px] font-semibold text-amber-900">
                          <UiIcon name="warning" /> Parent note: {child.activityNotes}
                        </div>
                      )}
                    </div>
                    <KidsBookingActions
                      slug={slug}
                      bookingId={booking.id}
                      status={toCalendarStatus(booking.bookingStatus, new Date(booking.startsAt))}
                      started={new Date(booking.startsAt) <= new Date()}
                    />
                  </div>
                ))}

                {enrollments.map(({ enrollment, workshop, child }) => (
                  <div
                    key={enrollment.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-line bg-emerald-50/50 p-4 shadow-2xs sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-black text-emerald-950">
                          <UiIcon name="camp" /> CAMP · {child.displayName}
                        </span>
                        {child.schoolClass && (
                          <span className="text-[11px] font-semibold text-muted">
                            Class: {child.schoolClass}
                          </span>
                        )}
                      </div>

                      <h5 className="mt-1.5 text-xs font-black text-ink">
                        {workshop.title} (Starts {workshop.startDate})
                      </h5>

                      {child.activityNotes && (
                        <div className="mt-2 rounded-xl bg-amber-50 p-2 text-[11px] font-semibold text-amber-900">
                          <UiIcon name="warning" /> Parent note: {child.activityNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Service */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveService}
            className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-ink">Add New Kids Class</h3>
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
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
              <label className="block text-xs font-bold text-ink">Title</label>
              <input
                type="text"
                required
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                placeholder="e.g. Scratch Game Programming & Logic"
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink">Category</label>
              <select
                value={serviceCategoryId}
                onChange={(e) => setServiceCategoryId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink">Description</label>
              <textarea
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                placeholder="What will children learn, create, or take home?"
                rows={3}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink">Min Age</label>
                <input
                  type="number"
                  min={3}
                  max={15}
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink">Max Age</label>
                <input
                  type="number"
                  min={3}
                  max={15}
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink">Session Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink">Duration (Mins)</label>
                <input
                  type="number"
                  min={15}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink">Materials Policy</label>
              <select
                value={materialPolicy}
                onChange={(e) => setMaterialPolicy(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
              >
                <option value="included">Included in Fee</option>
                <option value="extra">Extra Optional Kit</option>
                <option value="required">Required Material Fee</option>
                <option value="none">No Materials Needed</option>
              </select>
            </div>

            {materialPolicy !== "included" && materialPolicy !== "none" ? (
              <div>
                <label className="block text-xs font-bold text-ink">Material Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={materialFeeRupees}
                  onChange={(e) => setMaterialFeeRupees(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
                />
              </div>
            ) : null}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                className="w-1/2 rounded-xl border border-line py-2 text-xs font-bold text-ink hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-1/2 rounded-xl bg-accent py-2 text-xs font-bold text-white shadow-2xs disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Class"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Workshop */}
      {showWorkshopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveWorkshop}
            className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-ink">Create Holiday Workshop Camp</h3>
              <button
                type="button"
                onClick={() => setShowWorkshopModal(false)}
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
              <label className="block text-xs font-bold text-ink">Title</label>
              <input
                type="text"
                required
                value={wsTitle}
                onChange={(e) => setWsTitle(e.target.value)}
                placeholder="e.g. 2-Day Mars Rover Robotics Bootcamp"
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink">Category</label>
              <select
                value={wsCategoryId}
                onChange={(e) => setWsCategoryId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink">Min Age</label>
                <input
                  type="number"
                  min={3}
                  max={15}
                  value={wsMinAge}
                  onChange={(e) => setWsMinAge(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink">Max Age</label>
                <input
                  type="number"
                  min={3}
                  max={15}
                  value={wsMaxAge}
                  onChange={(e) => setWsMaxAge(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink">Start Date</label>
                <input
                  type="date"
                  required
                  value={wsStartDate}
                  onChange={(e) => setWsStartDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink">End Date</label>
                <input
                  type="date"
                  required
                  value={wsEndDate}
                  onChange={(e) => setWsEndDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink">Enrollment Deadline</label>
              <input
                type="datetime-local"
                value={wsDeadline}
                onChange={(e) => setWsDeadline(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink">Address / Studio Location</label>
              <input
                type="text"
                value={wsAddress}
                onChange={(e) => setWsAddress(e.target.value)}
                placeholder="Studio room or campus address"
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink">Seat Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={wsCapacity}
                  onChange={(e) => setWsCapacity(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink">Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={wsPriceRupees}
                  onChange={(e) => setWsPriceRupees(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink">Venue / Format</label>
              <select
                value={wsVenue}
                onChange={(e) => setWsVenue(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
              >
                <option value="studio">Studio Academy</option>
                <option value="online">Online Live Batch</option>
                <option value="outdoor">Outdoor / Camp Ground</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWorkshopModal(false)}
                className="w-1/2 rounded-xl border border-line py-2 text-xs font-bold text-ink hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-1/2 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-2xs disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Publish Bootcamp"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
