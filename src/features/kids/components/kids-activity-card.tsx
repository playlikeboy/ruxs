"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Play, Star, X } from "lucide-react";
import { AppIcon } from "@/components/ui/app-icon";
import { formatINR } from "@/core/money";
import { formatAgeBadge, KIDS_FORMATS } from "@/core/kids";
import { getYouTubeEmbedUrl } from "@/core/media";
import type { KidsActivityItem } from "../types";

/** One class: what it is, who teaches it, when it fits, what it costs. */
export function KidsActivityCard({ item }: { item: KidsActivityItem }) {
  const [videoOpen, setVideoOpen] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(item.previewVideoUrl);
  const price = item.trialPricePaise ?? item.pricePaise;
  const href = `/app/kids/services/${item.id}`;

  return (
    <article className="group overflow-hidden rounded-[16px] border border-kids-ink/10 bg-white transition-colors hover:border-kids-ink/25">
      {item.posterUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-kids-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.posterUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          {embedUrl && (
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              className="absolute bottom-2.5 right-2.5 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-black/70 px-3 text-xs font-semibold text-white"
            >
              <Play className="h-3 w-3" fill="currentColor" aria-hidden="true" /> Preview
            </button>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {!item.posterUrl && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-kids-mint/60 text-kids-ink">
              <AppIcon name={item.category} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-snug text-kids-ink">
              <Link href={href} className="hover:underline">
                {item.name}
              </Link>
            </h3>
            <p className="mt-0.5 truncate text-sm text-kids-ink/65">
              <Link href={`/app/kids/providers/${item.vendor.slug}`} className="hover:text-kids-ink">{item.vendor.name}</Link> · {item.vendor.area}
            </p>
          </div>
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-kids-ink/70">
          <span>{formatAgeBadge(item.ageMin, item.ageMax)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{item.durationMinutes} min</span>
          <span className="inline-flex items-center gap-1"><AppIcon name={item.format} className="h-3.5 w-3.5" />{KIDS_FORMATS[item.format].label}</span>
          {item.homeSupervisionRequired && <span>Parent present at home</span>}
          {item.vendor.reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1 font-medium text-kids-ink">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              {item.vendor.rating.toFixed(1)} <span className="font-normal text-kids-ink/50">({item.vendor.reviewCount})</span>
            </span>
          ) : (
            <span className="font-medium text-good">New</span>
          )}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-kids-ink/10 pt-3">
          <p>
            <span className="text-lg font-bold tabular-nums text-kids-ink">{formatINR(price)}</span>
            <span className="ml-1 text-sm text-kids-ink/60">{item.trialPricePaise ? "trial class" : "per session"}</span>
            {item.trialPricePaise && item.trialPricePaise < item.pricePaise && (
              <span className="ml-2 text-sm text-kids-ink/40 line-through tabular-nums">{formatINR(item.pricePaise)}</span>
            )}
          </p>
          <Link href={href} className="inline-flex min-h-10 items-center rounded-[12px] bg-kids-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-kids-ink/90">
            Book
          </Link>
        </div>
      </div>

      {videoOpen && embedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label={`${item.name} preview`}>
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-black">
            <button
              type="button"
              onClick={() => setVideoOpen(false)}
              aria-label="Close preview"
              className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="aspect-video w-full">
              <iframe src={embedUrl} title={item.name} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
