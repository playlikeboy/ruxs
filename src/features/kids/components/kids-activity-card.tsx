import Link from "next/link";
import { Star, Clock, MapPin } from "lucide-react";
import { formatINR } from "@/core/money";
import { formatAgeBadge, KIDS_FORMATS } from "@/core/kids";
import type { KidsActivityItem } from "../types";

export function KidsActivityCard({ item }: { item: KidsActivityItem }) {
  const formatMeta = KIDS_FORMATS[item.format];
  const ageLabel = formatAgeBadge(item.ageMin, item.ageMax);

  return (
    <div className="group relative flex flex-col justify-between rounded-[26px] border-2 border-kids-grape/15 bg-white p-4 shadow-[0_5px_0_rgba(155,92,246,0.14),0_12px_24px_-14px_rgba(59,31,92,0.35)] transition hover:translate-y-[-1px] hover:shadow-[0_7px_0_rgba(155,92,246,0.16),0_16px_28px_-14px_rgba(59,31,92,0.4)]">
      {/* Top badges and emoji avatar */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border-2 border-kids-grape/15 bg-amber-100 text-2xl shadow-[0_3px_0_rgba(155,92,246,0.18)]">
            {item.emoji}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <span className="inline-flex items-center rounded-full border border-kids-grape/20 bg-pink-100 px-2.5 py-0.5 text-[10px] font-black text-kids-ink">
              👶 {ageLabel}
            </span>
            {item.badge && (
              <span className="inline-flex items-center rounded-full border border-kids-grape/20 bg-yellow-300 px-2.5 py-0.5 text-[10px] font-black text-kids-ink">
                {item.badge}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mt-3">
          <h3 className="text-base font-black leading-snug tracking-tight text-kids-ink group-hover:text-kids-grape">
            {item.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-kids-ink/70">
            {item.description}
          </p>
        </div>

        {/* Metadata row */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-kids-ink/60">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-kids-ink/80">
            <Clock className="h-3 w-3" />
            <span>{item.durationMinutes} min</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-sky-800">
            <span aria-hidden="true">{formatMeta.emoji}</span>
            <span>{formatMeta.label}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-kids-ink/60">
            <MapPin className="h-3 w-3" />
            <span>{item.vendor.area}</span>
          </span>
        </div>

        {/* Vendor info and rating */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
          <Link
            href={`/app/kids/providers/${item.vendor.slug}`}
            className="font-bold text-kids-ink/80 hover:text-kids-bubblegum truncate max-w-[180px]"
          >
            {item.vendor.name}
          </Link>
          <div className="flex items-center gap-1 shrink-0 font-bold text-kids-ink">
            {item.vendor.reviewCount > 0 ? (
              <>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{item.vendor.rating.toFixed(1)}</span>
                <span className="text-[10px] font-medium text-slate-400">({item.vendor.reviewCount})</span>
              </>
            ) : (
              <span className="rounded-full bg-kids-mint/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700">New ✨</span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing & Booking action */}
      <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-slate-200 pt-3">
        <div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
            {item.trialPricePaise ? "Trial Class" : "Per Session"}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-kids-ink">
              {formatINR(item.trialPricePaise ?? item.pricePaise)}
            </span>
            {item.trialPricePaise && item.trialPricePaise < item.pricePaise && (
              <span className="text-xs font-semibold text-slate-400 line-through">
                {formatINR(item.pricePaise)}
              </span>
            )}
          </div>
        </div>

        <Link
          href={`/app/kids/services/${item.id}`}
          className="inline-flex items-center gap-1 rounded-full border-2 border-kids-grape/15 bg-kids-sunny px-4 py-2 text-xs font-black text-kids-ink shadow-[0_3px_0_rgba(155,92,246,0.18)] transition active:translate-y-0.5 active:shadow-none"
        >
          <span>Book Session</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
