import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ExternalLink,
  Globe,
  MapPin,
  Play,
  ShieldAlert,
  ShieldCheck,
  Star,
} from "lucide-react";
import { getKidsProviderBySlug } from "@/features/kids/queries";
import { formatINR } from "@/core/money";
import { formatAgeRange } from "@/core/kids/age-eligibility";
import { getYouTubeEmbedUrl } from "@/core/media";

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
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-kids-grape/15 bg-white px-3 py-1 text-xs font-black text-slate-800 shadow-[0_3px_0_rgba(155,92,246,0.18)] transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Classes</span>
        </Link>
      </div>

      {/* Provider Hero Header */}
      <div className="rounded-[26px] border-2 border-kids-grape/15 bg-white p-5 shadow-[0_5px_0_rgba(155,92,246,0.14),0_12px_24px_-14px_rgba(59,31,92,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-kids-grape/20 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-900">
                  <ShieldCheck className="h-3 w-3 text-emerald-700" />
                  <span>VERIFIED MENTOR</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-kids-ink/70">
                  <ShieldAlert className="h-3 w-3 text-slate-400" />
                  <span>VERIFICATION PENDING</span>
                </span>
              )}

              {safetyPassed && (
                <span className="inline-flex items-center gap-1 rounded-full border border-kids-grape/20 bg-amber-200 px-2.5 py-0.5 text-[10px] font-black text-kids-ink">
                  <CheckCircle2 className="h-3 w-3 text-amber-800" />
                  <span>CHILD SAFETY CLEARED</span>
                </span>
              )}
            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-kids-ink">
              {vendor.name}
            </h1>
            <p className="mt-1 text-xs font-semibold text-kids-ink/70">
              {profile?.headline ?? "Local kids activity educator and mentor."}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-kids-ink/70">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-kids-ink/60" />
                <span>{vendor.area}</span>
              </span>
              {profile?.experienceYears ? (
                <span className="inline-flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-kids-ink/60" />
                  <span>{profile.experienceYears} Years Teaching</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Credentials Breakdown: Verified vs Claimed */}
        <div className="mt-4 rounded-[20px] border-2 border-kids-grape/15 bg-slate-50 p-4">
          <div className="text-[11px] font-black uppercase tracking-wider text-kids-ink/60">
            Safety & Qualification Standards
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <span className="block font-black text-emerald-800">
                🛡️ Verified by RUXs Admin
              </span>
              <p className="mt-1 text-[11px] font-medium text-kids-ink/70">
                {profile?.safetyNotes || "Identity verified, premise inspected, child safety guidelines signed."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <span className="block font-black text-kids-ink">
                🎓 Claimed Credentials
              </span>
              <p className="mt-1 text-[11px] font-medium text-kids-ink/70">
                {profile?.qualifications || "Certified educator in subject domain."}
              </p>
            </div>
          </div>

          {profile?.specialties && profile.specialties.length > 0 && (
            <div className="mt-3">
              <span className="text-[11px] font-bold text-kids-ink/80">Specialties: </span>
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
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-kids-ink/70">
              <Globe className="h-3 w-3 text-slate-400" />
              <span>Languages: {profile.languages.join(", ")}</span>
            </div>
          )}
        </div>

        {/* Video Preview if provided */}
        {profile?.previewVideoUrl && getYouTubeEmbedUrl(profile.previewVideoUrl) && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-kids-ink">
              <Play size={13} className="text-red-600 fill-current" />
              <span>Teaching & Performance Preview Video</span>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-[20px] border-2 border-kids-grape/15 bg-black shadow-sm">
              <iframe
                src={getYouTubeEmbedUrl(profile.previewVideoUrl)!}
                title={`${vendor.name} preview video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </div>
        )}

        {/* Certificates & Accreditations (ImgBB) */}
        {profile?.certificates && profile.certificates.length > 0 && (
          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                <ShieldCheck size={14} className="text-emerald-700" />
                <span>Verified Certificates & Accreditations ({profile.certificates.length})</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Click to view original</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {profile.certificates.map((certUrl, idx) => (
                <a
                  key={idx}
                  href={certUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative flex h-24 flex-col items-center justify-center overflow-hidden rounded-[14px] border-2 border-emerald-200/80 bg-emerald-50/40 p-1 shadow-xs transition hover:scale-102 hover:border-emerald-500"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={certUrl} alt={`Certificate ${idx + 1}`} className="h-full w-full object-cover rounded-[10px]" />
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/40 opacity-0 transition group-hover:opacity-100">
                    <span className="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-emerald-950 shadow">
                      <ExternalLink size={10} /> View
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Studio / Classroom Photos */}
        {profile?.galleryImages && profile.galleryImages.length > 0 && (
          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
            <div className="text-xs font-black text-kids-ink">
              Studio & Activity Photos ({profile.galleryImages.length})
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {profile.galleryImages.map((imgUrl, idx) => (
                <a
                  key={idx}
                  href={imgUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative h-20 overflow-hidden rounded-[14px] border border-line bg-surface shadow-xs transition hover:scale-102"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Guardian Supervision Safeguard */}
        {profile?.guardianSupervisionRequired && (
          <div className="mt-5 flex items-start gap-2.5 rounded-[18px] border-2 border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950">
            <ShieldCheck size={18} className="text-amber-800 shrink-0 mt-0.5" />
            <div>
              <span className="block font-black">Home Session Child Safeguarding Policy</span>
              <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-amber-900/80">
                For in-home 1-on-1 tutoring and dance sessions, an adult parent or guardian is required to remain present at home throughout the appointment.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Services & Classes Offered */}
      <section className="space-y-3">
        <h2 className="px-1 text-base font-black text-kids-ink">
          Classes & Sessions ({services.length})
        </h2>

        {services.length === 0 ? (
          <div className="rounded-[20px] border-2 border-dashed border-slate-300 bg-white p-4 text-center text-xs font-semibold text-kids-ink/60">
            No active individual sessions published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {services.map(({ service, category }) => {
              const ageLabel = formatAgeRange(service.minAge, service.maxAge);
              return (
                <div
                  key={service.id}
                  className="rounded-[20px] border-2 border-kids-grape/15 bg-white p-4 shadow-[0_3px_0_rgba(155,92,246,0.18)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full border border-kids-grape/20 bg-amber-200 px-2 py-0.5 text-[9px] font-black text-kids-ink">
                          {category.name}
                        </span>
                        <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-kids-ink/80">
                          👶 {ageLabel}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-sm font-black text-kids-ink">
                        {service.title}
                      </h3>
                      {service.description && (
                        <p className="mt-1 text-xs font-medium text-kids-ink/70 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="block text-base font-black text-kids-ink">
                        {formatINR(service.pricePaise)}
                      </span>
                      <Link
                        href={`/app/kids/services/${service.id}`}
                        className="mt-2 inline-flex items-center gap-1 rounded-full border-2 border-kids-grape/15 bg-kids-sunny px-3 py-1 text-xs font-black text-kids-ink shadow-[0_2px_0_rgba(155,92,246,0.18)] hover:bg-kids-sunny/80"
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
          <h2 className="px-1 text-base font-black text-kids-ink">
            Workshops & Holiday Camps ({workshops.length})
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {workshops.map(({ workshop, category }) => (
              <div
                key={workshop.id}
                className="rounded-[20px] border-2 border-kids-grape/15 bg-emerald-50/60 p-4 shadow-[0_3px_0_rgba(155,92,246,0.18)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full border border-kids-grape/20 bg-emerald-200 px-2 py-0.5 text-[9px] font-black text-emerald-950">
                      CAMP · {category.name}
                    </span>
                    <h3 className="mt-1.5 text-sm font-black text-kids-ink">
                      {workshop.title}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-kids-ink/70 line-clamp-2">
                      {workshop.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-base font-black text-kids-ink">
                      {formatINR(workshop.pricePaise)}
                    </span>
                    <Link
                      href={`/app/kids/workshops/${workshop.id}`}
                      className="mt-2 inline-flex items-center gap-1 rounded-full border-2 border-kids-grape/15 bg-emerald-400 px-3 py-1 text-xs font-black text-kids-ink shadow-[0_2px_0_rgba(155,92,246,0.18)] hover:bg-emerald-300"
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
          <h2 className="text-base font-black text-kids-ink">
            Parent Reviews ({reviews.length})
          </h2>
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-[20px] border-2 border-dashed border-slate-300 bg-white p-4 text-center text-xs font-semibold text-kids-ink/60">
            No parent reviews yet. Completed bookings are eligible to review!
          </div>
        ) : (
          <div className="space-y-2.5">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-[20px] border-2 border-kids-grape/15 bg-white p-3.5 shadow-[0_3px_0_rgba(155,92,246,0.18)]"
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
                  <p className="mt-2 text-xs font-medium text-kids-ink/80">
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
