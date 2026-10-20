import Link from "next/link";
import { Star, Clock, MapPin } from "lucide-react";
import { formatINR } from "@/core/money";
import { formatAgeBadge, KIDS_FORMATS } from "@/core/kids";
import type { KidsActivityItem } from "../types";

export function KidsActivityCard({ item }: { item: KidsActivityItem }) {
  const formatMeta = KIDS_FORMATS[item.format];
  const ageLabel = formatAgeBadge(item.ageMin, item.ageMax);

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_0_#0f172a] transition hover:translate-y-[-1px] hover:shadow-[4px_4px_0_0_#0f172a]">
      {/* Top badges and emoji avatar */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 bg-amber-100 text-2xl shadow-[2px_2px_0_0_#0f172a]">
            {item.emoji}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <span className="inline-flex items-center rounded-full border border-slate-900 bg-pink-100 px-2.5 py-0.5 text-[10px] font-black text-slate-900">
              👶 {ageLabel}
            </span>
            {item.badge && (
              <span className="inline-flex items-center rounded-full border border-slate-900 bg-yellow-300 px-2.5 py-0.5 text-[10px] font-black text-slate-950">
                {item.badge}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mt-3">
          <h3 className="text-base font-black leading-snug tracking-tight text-slate-950 group-hover:text-accent">
            {item.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-slate-600">
            {item.description}
          </p>
        </div>

        {/* Metadata row */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
            <Clock className="h-3 w-3" />
            <span>{item.durationMinutes} min</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-sky-800">
            <span aria-hidden="true">{formatMeta.emoji}</span>
            <span>{formatMeta.label}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500">
            <MapPin className="h-3 w-3" />
            <span>{item.vendor.area}</span>
          </span>
        </div>

        {/* Vendor info and rating */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
          <Link
            href={`/app/kids/providers/${item.vendor.slug}`}
            className="font-bold text-slate-700 hover:text-accent hover:underline truncate max-w-[180px]"
          >
            {item.vendor.name}
          </Link>
          <div className="flex items-center gap-1 shrink-0 font-bold text-slate-900">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{item.vendor.rating.toFixed(1)}</span>
            <span className="text-[10px] font-medium text-slate-400">({item.vendor.reviewCount})</span>
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
            <span className="text-lg font-black text-slate-950">
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
          className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 shadow-[2px_2px_0_0_#0f172a] transition active:translate-y-0.5 active:shadow-none"
        >
          <span>Book Session</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
