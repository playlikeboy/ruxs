import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import { formatINR } from "@/core/money";
import { formatAgeBadge, formatBatchUrgency } from "@/core/kids";
import type { KidsWorkshopItem } from "../types";

export function KidsWorkshopCard({ item }: { item: KidsWorkshopItem }) {
  const urgency = formatBatchUrgency(item.batchSize, item.enrolledCount);
  const ageLabel = formatAgeBadge(item.minAge, item.maxAge);

  const bookHref = `/app/kids/workshops/${item.id}`;

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-[26px] border-2 border-kids-grape/15 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-[0_5px_0_rgba(155,92,246,0.14),0_12px_24px_-14px_rgba(59,31,92,0.35)]">
      {/* Top badges */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-kids-grape/20 bg-white px-2.5 py-0.5 text-[11px] font-black text-kids-ink shadow-sm">
            <Calendar className="h-3 w-3 text-amber-600" />
            <span>{item.dateLabel}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1 rounded-full border border-kids-grape/20 px-2.5 py-0.5 text-[10px] font-black ${
              urgency.isAlmostFull
                ? "bg-rose-200 text-rose-950 animate-pulse"
                : "bg-emerald-200 text-emerald-950"
            }`}
          >
            <Users className="h-2.5 w-2.5" />
            <span>{urgency.label}</span>
          </span>
        </div>

        {/* Title & Emoji */}
        <div className="mt-3 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[20px] border-2 border-kids-grape/15 bg-white text-2xl shadow-[0_3px_0_rgba(155,92,246,0.18)]">
            {item.emoji}
          </span>
          <div>
            <Link href={bookHref} className="hover:text-kids-grape">
              <h3 className="text-base font-black leading-tight tracking-tight text-kids-ink">
                {item.title}
              </h3>
            </Link>
            <span className="mt-1 inline-block text-[11px] font-bold text-kids-ink/60">
              ⏰ {item.timeLabel} · 👶 {ageLabel}
            </span>
          </div>
        </div>

        <p className="mt-2 text-xs font-medium leading-relaxed text-kids-ink/70">
          {item.description}
        </p>

        <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-kids-ink/80">
          <Link href={`/app/kids/providers/${item.vendor.slug}`} className="hover:text-kids-bubblegum">
            By {item.vendor.name}
          </Link>
          <span className="text-slate-400">·</span>
          <span>{item.vendor.area}</span>
        </div>
      </div>

      {/* Pricing & Booking action */}
      <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-slate-300 pt-3">
        <div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Workshop Fee</span>
          <span className="text-lg font-black text-kids-ink">{formatINR(item.pricePaise)}</span>
        </div>

        <Link
          href={bookHref}
          className="inline-flex items-center gap-1 rounded-full border-2 border-kids-grape/15 bg-emerald-400 px-4 py-2 text-xs font-black text-kids-ink shadow-[0_3px_0_rgba(155,92,246,0.18)] transition active:translate-y-0.5 active:shadow-none"
        >
          <span>Reserve Spot</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
