import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, ChevronRight, ExternalLink, FileBadge, Globe, ImageIcon, MapPin, ShieldCheck, Star } from "lucide-react";
import { CoverArt } from "@/components/ui/cover-art";
import { getKidsProviderBySlug } from "@/features/kids/queries";
import { formatINR } from "@/core/money";
import { formatAgeRange } from "@/core/kids/age-eligibility";
import { getYouTubeEmbedUrl } from "@/core/media";
import { safeHttpUrl } from "@/core/html";
import { KidsBackLink, KidsSection, KidsTag, kidsCard } from "@/features/kids/components/kids-ui";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getKidsProviderBySlug(slug);
  if (!data) return { title: "Provider not found" };
  return {
    title: `${data.vendor.name} · RUXs Kids`,
    description: data.profile?.headline ?? `Kids classes and workshops by ${data.vendor.name} in ${data.vendor.area}.`,
  };
}

function FileLinks({ title, icon: Icon, urls, noun }: { title: string; icon: typeof FileBadge; urls: string[]; noun: string }) {
  const safe = urls.map((u) => safeHttpUrl(u)).filter((u): u is string => Boolean(u));
  if (safe.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {safe.map((url, i) => (
          <li key={url}>
            <a href={url} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-kids-ink/15 px-3.5 text-sm font-medium hover:border-kids-ink/40">
              <Icon className="h-4 w-4" aria-hidden="true" /> {noun} {i + 1}
              <ExternalLink className="h-3.5 w-3.5 text-kids-ink/50" aria-label="opens in a new tab" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function KidsProviderProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getKidsProviderBySlug(slug);
  if (!data) notFound();

  const { vendor, profile, services, workshops, reviews } = data;
  const isVerified = profile?.verificationStatus === "approved";
  const safetyPassed = profile?.safetyReviewStatus === "passed";
  const lead = services[0]?.category ?? workshops[0]?.category;
  const embed = getYouTubeEmbedUrl(profile?.previewVideoUrl ?? undefined);

  return (
    <div className="space-y-7">
      <KidsBackLink href="/app/kids/activities" label="Classes" />

      <section className={`${kidsCard} group overflow-hidden`}>
        <CoverArt theme={lead ? `${lead.id} ${lead.name}` : "kids"} className="h-32 w-full" />
        <div className="space-y-4 p-5">
          <div>
            <div className="flex flex-wrap gap-2">
              {isVerified && <KidsTag tone="good"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Reviewed by RUXs</KidsTag>}
              {safetyPassed && <KidsTag tone="good">Safety review passed</KidsTag>}
            </div>
            <h1 className="mt-2 font-kids text-[28px] font-semibold leading-tight tracking-tight">{vendor.name}</h1>
            {profile?.headline && <p className="mt-1 text-[15px] text-kids-ink/70">{profile.headline}</p>}
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-kids-ink/70">
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden="true" />{vendor.area}</span>
              {profile?.experienceYears ? <span className="inline-flex items-center gap-1"><Award className="h-4 w-4" aria-hidden="true" />{profile.experienceYears} years teaching</span> : null}
              {profile?.languages && profile.languages.length > 0 && (
                <span className="inline-flex items-center gap-1"><Globe className="h-4 w-4" aria-hidden="true" />{profile.languages.join(", ")}</span>
              )}
            </p>
          </div>

          {(profile?.safetyNotes || profile?.qualifications) && (
            <dl className="grid gap-3 rounded-[16px] bg-kids-cream p-4 text-sm">
              {profile?.safetyNotes && (
                <div>
                  <dt className="font-semibold">RUXs review notes</dt>
                  <dd className="mt-0.5 text-kids-ink/70">{profile.safetyNotes}</dd>
                </div>
              )}
              {profile?.qualifications && (
                <div>
                  <dt className="font-semibold">Qualifications (provider&apos;s own)</dt>
                  <dd className="mt-0.5 text-kids-ink/70">{profile.qualifications}</dd>
                </div>
              )}
            </dl>
          )}

          {profile?.specialties && profile.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.specialties.map((s) => <KidsTag key={s}>{s}</KidsTag>)}
            </div>
          )}

          {profile?.guardianSupervisionRequired && (
            <p className="rounded-[16px] bg-kids-peach/60 p-3.5 text-sm">
              <span className="font-semibold">Home sessions:</span> a parent or guardian stays at home for the whole session.
            </p>
          )}

          {embed && (
            <div className="aspect-video w-full overflow-hidden rounded-[16px] bg-black">
              <iframe src={embed} title={`${vendor.name} preview`} allow="encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full border-0" />
            </div>
          )}

          <FileLinks title="Certificates" icon={FileBadge} urls={profile?.certificates ?? []} noun="Certificate" />
          <FileLinks title="Studio photos" icon={ImageIcon} urls={profile?.galleryImages ?? []} noun="Photo" />
        </div>
      </section>

      <KidsSection title={`Classes (${services.length})`}>
        {services.length === 0 ? (
          <p className={`${kidsCard} p-4 text-center text-sm text-kids-ink/60`}>No classes listed yet.</p>
        ) : (
          <ul className={`${kidsCard} divide-y divide-kids-ink/10`}>
            {services.map(({ service, category }) => (
              <li key={service.id}>
                <Link href={`/app/kids/services/${service.id}`} className="group flex items-center gap-3 p-3">
                  <CoverArt theme={`${category.id} ${category.name}`} className="h-16 w-16 shrink-0 rounded-[12px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug">{service.title}</span>
                    <span className="block text-[13px] text-kids-ink/60">{category.name} · {formatAgeRange(service.minAge, service.maxAge)}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatINR(service.pricePaise)}</span>
                  <ChevronRight className="h-5 w-5 text-kids-ink/40" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </KidsSection>

      {workshops.length > 0 && (
        <KidsSection title={`Workshops and camps (${workshops.length})`}>
          <ul className={`${kidsCard} divide-y divide-kids-ink/10`}>
            {workshops.map(({ workshop, category }) => (
              <li key={workshop.id}>
                <Link href={`/app/kids/workshops/${workshop.id}`} className="group flex items-center gap-3 p-3">
                  <CoverArt theme="camp" className="h-16 w-16 shrink-0 rounded-[12px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug">{workshop.title}</span>
                    <span className="block text-[13px] text-kids-ink/60">{category.name}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatINR(workshop.pricePaise)}</span>
                  <ChevronRight className="h-5 w-5 text-kids-ink/40" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </KidsSection>
      )}

      <KidsSection title={`Parent reviews (${reviews.length})`}>
        {reviews.length === 0 ? (
          <p className={`${kidsCard} p-4 text-center text-sm text-kids-ink/60`}>No reviews yet. Parents can review after a completed class.</p>
        ) : (
          <ul className="space-y-2.5">
            {reviews.map((rev) => (
              <li key={rev.id} className={`${kidsCard} p-4`}>
                <div className="flex items-center justify-between">
                  <span className="flex gap-0.5" aria-label={`${rev.rating} out of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-4 w-4 ${n <= rev.rating ? "fill-amber-400 text-amber-400" : "text-kids-ink/15"}`} aria-hidden="true" />
                    ))}
                  </span>
                  <span className="text-xs text-kids-ink/50">{new Date(rev.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                {rev.reviewText && <p className="mt-2 text-sm text-kids-ink/80">{rev.reviewText}</p>}
              </li>
            ))}
          </ul>
        )}
      </KidsSection>
    </div>
  );
}
