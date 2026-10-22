import Link from "next/link";
import { Award, CalendarClock, ChevronLeft, GraduationCap, Languages, MapPin, Navigation } from "lucide-react";
import { formatINR } from "@/core/money";
import { MODE_LABEL } from "@/core/booking";
import { directionsUrl } from "@/core/maps";
import type { RatingSummary } from "@/core/ratings";
import type { CoverStyle } from "@/config/service-kinds";
import { StoreCover } from "@/features/consumer/components/store-cover";
import { RatingBadge } from "@/features/reviews/components/rating-badge";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { ReviewList, type ReviewItem } from "@/features/reviews/components/review-list";
import { ReportStoreButton } from "@/features/support/components/report-button";

export interface ProviderPageProps {
  vendor: {
    id: string;
    slug: string;
    name: string;
    area: string;
    city: string;
    description: string | null;
    coverUrl: string | null;
    acceptingOrders: boolean;
    serviceRadiusKm: number;
    cancelCutoffHours: number;
    mapsUrl: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  cover: CoverStyle;
  categoryLabel: string;
  distanceKm: number | null;
  visible: boolean;
  homeVisitsReach: boolean;
  discoveryRadiusKm: number;
  rating: RatingSummary;
  profile: { headline: string | null; qualifications: string | null; experienceYears: number | null; specialities: string[]; languages: string[]; gender: string | null } | null;
  highlights: string[];
  serviceChips: Map<string, string[]>;
  services: { id: string; name: string; description: string | null; durationMinutes: number; pricePaise: number; modes: string[]; isActive: boolean }[];
  reviews: ReviewItem[];
  totalReviews?: number;
  myReview: { eligible: boolean; mine: { rating: number; comment: string | null } | null };
  canReply?: boolean;
}

/** Public page for a trainer, physiotherapist or any booking provider. Not a menu: a profile with bookable sessions. */
export function ProviderPage(p: ProviderPageProps) {
  const { vendor, profile } = p;
  const facts = [
    profile?.experienceYears != null && { icon: Award, text: `${profile.experienceYears}+ years experience` },
    profile?.qualifications && { icon: GraduationCap, text: profile.qualifications },
    profile?.languages.length && { icon: Languages, text: profile.languages.join(", ") },
  ].filter(Boolean) as { icon: typeof Award; text: string }[];

  return (
    <div className="pb-24">
      <div className="relative">
        <StoreCover cover={p.cover} imageUrl={vendor.coverUrl} alt={vendor.name} className="aspect-[16/9] w-full" emojiClass="text-[88px]" />
        <Link href="/app" aria-label="Back to explore" className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md">
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="relative -mt-6 rounded-t-3xl bg-white px-5 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">{p.categoryLabel}</p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight text-ink">{vendor.name}</h1>
        {profile?.headline && <p className="mt-1 text-[15px] text-neutral-600">{profile.headline}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <a href="#reviews"><RatingBadge rating={p.rating} /></a>
          <span className="flex items-center gap-1 text-sm text-neutral-500">
            <MapPin className="h-4 w-4" aria-hidden="true" /> {vendor.area}
            {p.distanceKm != null && <> · {p.distanceKm < 1 ? "under 1" : p.distanceKm} km</>}
          </span>
        </div>

        {facts.length > 0 && (
          <ul className="mt-4 space-y-2">
            {facts.map((f) => (
              <li key={f.text} className="flex items-center gap-2.5 text-sm text-neutral-700">
                <f.icon className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" /> {f.text}
              </li>
            ))}
          </ul>
        )}
        {profile && profile.specialities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {profile.specialities.map((s) => (
              <span key={s} className="rounded-full bg-peach px-2.5 py-1 text-xs font-medium text-accent">{s}</span>
            ))}
          </div>
        )}
        {p.highlights.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.highlights.map((h) => (
              <span key={h} className="rounded-full border border-black/5 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">{h}</span>
            ))}
          </div>
        )}
        {vendor.description && <p className="mt-4 text-[15px] leading-6 text-neutral-700">{vendor.description}</p>}
        {p.services.some((s) => s.modes.includes("studio")) && (vendor.mapsUrl || (vendor.latitude != null && vendor.longitude != null)) && (
          <a
            href={vendor.mapsUrl ?? directionsUrl({ latitude: vendor.latitude!, longitude: vendor.longitude! })}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-black/10 px-4 text-sm font-semibold text-ink"
          >
            <Navigation className="h-4 w-4" aria-hidden="true" /> Get directions to the gym / clinic
          </a>
        )}

        {!p.visible && (
          <p className="mt-4 rounded-xl bg-blush px-4 py-3 text-sm font-medium text-bad">This provider is more than {p.discoveryRadiusKm} km from you, so they can&apos;t be booked in your area.</p>
        )}
        {p.visible && !vendor.acceptingOrders && (
          <p className="mt-4 rounded-xl bg-butter px-4 py-3 text-sm font-medium text-warn">Not taking bookings right now.</p>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-bold tracking-tight text-ink">Book a session</h2>
          <p className="mt-1 text-sm text-neutral-500">Pick a service, then a free time. Free cancellation up to {vendor.cancelCutoffHours} h before.</p>
          {p.services.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-neutral-50 p-5 text-sm text-neutral-500">No services listed yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {p.services.map((s) => {
                const bookable = s.isActive && vendor.acceptingOrders && p.visible;
                const homeOnly = s.modes.length === 1 && s.modes[0] === "home";
                return (
                  <li key={s.id} className="rounded-2xl border border-black/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-ink">{s.name}</h3>
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-neutral-500">
                          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> {s.durationMinutes} min
                        </p>
                      </div>
                      <p className="shrink-0 text-[17px] font-bold text-ink tabular-nums">{formatINR(s.pricePaise)}</p>
                    </div>
                    {s.description && <p className="mt-2 text-sm leading-5 text-neutral-600">{s.description}</p>}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {s.modes.map((m) => (
                          <span key={m} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700">{MODE_LABEL[m] ?? m}</span>
                        ))}
                        {(p.serviceChips.get(s.id) ?? []).map((c) => (
                          <span key={c} className="rounded-full bg-peach px-2.5 py-1 text-[11px] font-medium text-accent">{c}</span>
                        ))}
                      </div>
                      {bookable && !(homeOnly && !p.homeVisitsReach) ? (
                        <Link href={`/app/store/${vendor.slug}/book/${s.id}`} className="flex h-10 items-center rounded-xl bg-accent px-5 text-sm font-bold text-white">
                          Book
                        </Link>
                      ) : (
                        <span className="flex h-10 items-center rounded-xl bg-neutral-100 px-4 text-xs font-semibold text-neutral-400">
                          {homeOnly && !p.homeVisitsReach && p.visible ? `Home visits within ${vendor.serviceRadiusKm} km only` : "Unavailable"}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section id="reviews" className="mt-10 scroll-mt-4">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight text-ink">Ratings &amp; reviews</h2>
            <RatingBadge rating={p.rating} />
          </div>
          {p.myReview.eligible && (
            <div className="mt-4">
              <ReviewForm vendorSlug={vendor.slug} initialRating={p.myReview.mine?.rating} initialComment={p.myReview.mine?.comment} />
            </div>
          )}
          <div className="mt-2">
            <ReviewList
              reviews={p.reviews}
              total={p.totalReviews}
              vendorId={vendor.id}
              vendorSlug={vendor.slug}
              storeName={vendor.name}
              canReply={p.canReply}
              pageSize={10}
            />
          </div>
        </section>

        <div className="mt-12 flex justify-center pb-4">
          <ReportStoreButton vendorId={vendor.id} vendorName={vendor.name} />
        </div>
      </div>
    </div>
  );
}
