"use client";


import { AppIcon, UiIcon } from "@/components/ui/app-icon";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Users, Play, X } from "lucide-react";
import { formatINR } from "@/core/money";
import { formatAgeBadge, formatBatchUrgency } from "@/core/kids";
import { getYouTubeEmbedUrl } from "@/core/media";
import type { KidsWorkshopItem } from "../types";

export function KidsWorkshopCard({ item }: { item: KidsWorkshopItem }) {
  const [videoOpen, setVideoOpen] = useState(false);
  const urgency = formatBatchUrgency(item.batchSize, item.enrolledCount);
  const ageLabel = formatAgeBadge(item.minAge, item.maxAge);
  const embedUrl = getYouTubeEmbedUrl(item.previewVideoUrl);
  const bookHref = `/app/kids/workshops/${item.id}`;

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-[26px] border-2 border-kids-grape/15 bg-gradient-to-br from-amber-50 to-orange-50 shadow-[0_5px_0_rgba(155,92,246,0.14),0_12px_24px_-14px_rgba(59,31,92,0.35)] transition hover:translate-y-[-2px]">
      {/* Poster image if available */}
      {item.posterUrl && (
        <div className="relative h-32 w-full overflow-hidden bg-amber-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.posterUrl} alt={item.title} className="h-full w-full object-cover" />
          {embedUrl && (
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-black text-white shadow backdrop-blur-xs transition hover:bg-red-700"
            >
              <Play size={9} fill="currentColor" />
              <span>Video</span>
            </button>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Top badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-kids-grape/20 bg-white px-2.5 py-0.5 text-[11px] font-black text-kids-ink shadow-xs">
            <Calendar className="h-3 w-3 text-amber-600" />
            <span>{item.dateLabel}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1 rounded-full border border-kids-grape/20 px-2.5 py-0.5 text-[10px] font-black ${
              urgency.isAlmostFull ? "bg-rose-200 text-rose-950 animate-pulse" : "bg-emerald-200 text-emerald-950"
            }`}
          >
            <Users className="h-2.5 w-2.5" />
            <span>{urgency.label}</span>
          </span>
        </div>

        {/* Title & Emoji */}
        <div className="mt-3 flex items-start gap-3">
          {!item.posterUrl && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[20px] border-2 border-kids-grape/15 bg-white text-2xl shadow-[0_3px_0_rgba(155,92,246,0.18)]">
              <AppIcon name={item.category} className="h-6 w-6 text-kids-ink" />
            </span>
          )}
          <div>
            <Link href={bookHref} className="hover:text-kids-grape">
              <h3 className="text-base font-black leading-tight tracking-tight text-kids-ink">
                {item.title}
              </h3>
            </Link>
            <span className="mt-1 inline-block text-[11px] font-bold text-kids-ink/60">
              <UiIcon name="time" /> {item.timeLabel} · <UiIcon name="age" /> {ageLabel}
            </span>
          </div>
        </div>

        <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-kids-ink/70">
          {item.description}
        </p>

        <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-kids-ink/80">
          <Link href={`/app/kids/providers/${item.vendor.slug}`} className="hover:text-kids-bubblegum">
            By {item.vendor.name}
          </Link>
          <span className="text-slate-400">·</span>
          <span className="text-[11px] text-kids-ink/60">{item.vendor.area}</span>
        </div>

        {/* Price & action */}
        <div className="mt-4 flex items-center justify-between border-t border-amber-200/80 pt-3">
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-amber-900/60">
              Total Seat Fee
            </span>
            <span className="text-lg font-black text-kids-ink">
              {formatINR(item.pricePaise)}
            </span>
          </div>

          <Link
            href={bookHref}
            className="inline-flex items-center gap-1 rounded-full border-2 border-kids-grape/15 bg-kids-grape px-4 py-2 text-xs font-black text-white shadow-[0_3px_0_rgba(59,31,92,0.25)] transition active:translate-y-0.5 active:shadow-none hover:bg-purple-700"
          >
            Enroll Child
          </Link>
        </div>
      </div>

      {/* Video Modal */}
      {videoOpen && embedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-black shadow-2xl">
            <button
              type="button"
              onClick={() => setVideoOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40"
            >
              <X size={16} />
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={embedUrl + "&autoplay=1"}
                title={`${item.title} video preview`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
