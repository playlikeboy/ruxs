import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Globe,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Star,
} from "lucide-react";
import { getKidsProviderBySlug } from "@/features/kids/queries";
import { formatINR } from "@/core/money";
import { formatAgeRange } from "@/core/kids/age-eligibility";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getKidsProviderBySlug(slug);
  if (!data) return { title: "Provider Not Found" };

  return {
    title: `${data.vendor.name} · Verified Kids Mentor`,
    description:
      data.profile?.headline ??
      `Verified kids mentor & academy in ${data.vendor.area}. Classes, workshops & STEM learning on RUXs.`,
  };
}

export default async function KidsProviderProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getKidsProviderBySlug(slug);

  if (!data) notFound();

  const { vendor, profile, services, workshops, reviews } = data;
  const isVerified = profile?.verificationStatus === "approved";
  const safetyPassed = profile?.safetyReviewStatus === "passed";

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/app/kids/activities"
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black text-slate-800 shadow-[2px_2px_0_0_#0f172a] transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Classes</span>
        </Link>
      </div>

      {/* Provider Hero Header */}
      <div className="rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-[3px_3px_0_0_#0f172a]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-900 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-900">
                  <ShieldCheck className="h-3 w-3 text-emerald-700" />
                  <span>VERIFIED MENTOR</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                  <ShieldAlert className="h-3 w-3 text-slate-400" />
                  <span>VERIFICATION PENDING</span>
                </span>
              )}

              {safetyPassed && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-900 bg-amber-200 px-2.5 py-0.5 text-[10px] font-black text-slate-950">
                  <CheckCircle2 className="h-3 w-3 text-amber-800" />
                  <span>CHILD SAFETY CLEARED</span>
                </span>
              )}
            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              {vendor.name}
            </h1>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              {profile?.headline ?? "Local kids activity educator and mentor."}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>{vendor.area}</span>
              </span>
              {profile?.experienceYears ? (
                <span className="inline-flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-slate-500" />
                  <span>{profile.experienceYears} Years Teaching</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Credentials Breakdown: Verified vs Claimed */}
        <div className="mt-4 rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Safety & Qualification Standards
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <span className="block font-black text-emerald-800">
                🛡️ Verified by RUXs Admin
              </span>
              <p className="mt-1 text-[11px] font-medium text-slate-600">
                {profile?.safetyNotes || "Identity verified, premise inspected, child safety guidelines signed."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <span className="block font-black text-slate-900">
                🎓 Claimed Credentials
              </span>
              <p className="mt-1 text-[11px] font-medium text-slate-600">
                {profile?.qualifications || "Certified educator in subject domain."}
              </p>
            </div>
          </div>

          {profile?.specialties && profile.specialties.length > 0 && (
            <div className="mt-3">
              <span className="text-[11px] font-bold text-slate-700">Specialties: </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {profile.specialties.map((spec, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-800"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile?.languages && profile.languages.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <Globe className="h-3 w-3 text-slate-400" />
              <span>Languages: {profile.languages.join(", ")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Services & Classes Offered */}
      <section className="space-y-3">
        <h2 className="px-1 text-base font-black text-slate-950">
          Classes & Sessions ({services.length})
        </h2>

        {services.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-center text-xs font-semibold text-slate-500">
            No active individual sessions published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {services.map(({ service, category }) => {
              const ageLabel = formatAgeRange(service.minAge, service.maxAge);
              return (
                <div
                  key={service.id}
                  className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[2px_2px_0_0_#0f172a]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full border border-slate-900 bg-amber-200 px-2 py-0.5 text-[9px] font-black text-slate-950">
                          {category.name}
                        </span>
                        <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700">
                          👶 {ageLabel}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-sm font-black text-slate-950">
                        {service.title}
                      </h3>
                      {service.description && (
                        <p className="mt-1 text-xs font-medium text-slate-600 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="block text-base font-black text-slate-950">
                        {formatINR(service.pricePaise)}
                      </span>
                      <Link
                        href={`/app/kids/services/${service.id}`}
                        className="mt-2 inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-amber-400 px-3 py-1 text-xs font-black text-slate-950 shadow-[1px_1px_0_0_#0f172a] hover:bg-amber-300"
                      >
                        Book →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Upcoming Multi-session Workshops */}
      {workshops.length > 0 && (
        <section className="space-y-3">
          <h2 className="px-1 text-base font-black text-slate-950">
            Workshops & Holiday Camps ({workshops.length})
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {workshops.map(({ workshop, category }) => (
              <div
                key={workshop.id}
                className="rounded-2xl border-2 border-slate-900 bg-emerald-50/60 p-4 shadow-[2px_2px_0_0_#0f172a]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full border border-slate-900 bg-emerald-200 px-2 py-0.5 text-[9px] font-black text-emerald-950">
                      CAMP · {category.name}
                    </span>
                    <h3 className="mt-1.5 text-sm font-black text-slate-950">
                      {workshop.title}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-slate-600 line-clamp-2">
                      {workshop.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-base font-black text-slate-950">
                      {formatINR(workshop.pricePaise)}
                    </span>
                    <Link
                      href={`/app/kids/workshops/${workshop.id}`}
                      className="mt-2 inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-emerald-400 px-3 py-1 text-xs font-black text-slate-950 shadow-[1px_1px_0_0_#0f172a] hover:bg-emerald-300"
                    >
                      Enroll →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Verified Reviews */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-black text-slate-950">
            Parent Reviews ({reviews.length})
          </h2>
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-center text-xs font-semibold text-slate-500">
            No parent reviews yet. Completed bookings are eligible to review!
          </div>
        ) : (
          <div className="space-y-2.5">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_0_#0f172a]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= rev.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {rev.reviewText && (
                  <p className="mt-2 text-xs font-medium text-slate-700">
                    &ldquo;{rev.reviewText}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
