import Link from "next/link";
import { Clock, Star } from "lucide-react";
import { AppIcon } from "@/components/ui/app-icon";
import { CoverArt } from "@/components/ui/cover-art";
import { formatINR } from "@/core/money";
import { formatAgeBadge, KIDS_FORMATS } from "@/core/kids";
import { KidsVideoButton } from "./kids-video-dialog";
import type { KidsActivityItem } from "../types";

/** One class: what it is, who teaches it, when it fits, what it costs. */
export function KidsActivityCard({ item }: { item: KidsActivityItem }) {
  const price = item.trialPricePaise ?? item.pricePaise;
  const href = `/app/kids/services/${item.id}`;

  return (
    <article className="group relative flex gap-3.5 rounded-[20px] border border-kids-ink/10 bg-white p-3.5 transition-all duration-200 hover:border-kids-ink/25 hover:shadow-[0_4px_16px_rgba(23,71,55,0.06)] hover:-translate-y-0.5">
      <CoverArt theme={item.category} className="h-24 w-24 shrink-0 rounded-[16px] shadow-xs" />
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-kids-ink">
          <Link href={href} className="after:absolute after:inset-0 after:rounded-[20px]">
            {item.name}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-sm text-kids-ink/60">
          {item.vendor.name} · {item.vendor.area}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-kids-peach/40 px-2.5 py-0.5 font-semibold text-kids-ink">
            🐣 {formatAgeBadge(item.ageMin, item.ageMax)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-kids-ink/[0.05] px-2 py-0.5 font-medium text-kids-ink/70">
            <Clock className="h-3 w-3" aria-hidden="true" />{item.durationMinutes}m
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-kids-sky/40 px-2 py-0.5 font-medium text-kids-ink">
            <AppIcon name={item.format} className="h-3 w-3" />{KIDS_FORMATS[item.format].label}
          </span>
          {item.vendor.reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-900 ring-1 ring-amber-200/60">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
              {item.vendor.rating.toFixed(1)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-kids-mint/70 px-2 py-0.5 font-bold text-good">
              ✨ New
            </span>
          )}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <p className="whitespace-nowrap leading-tight">
            <span className="text-base font-extrabold tabular-nums text-kids-ink">{formatINR(price)}</span>
            <span className="ml-1 rounded-md bg-kids-ink/[0.05] px-1.5 py-0.5 text-[11px] font-semibold text-kids-ink/70">{item.trialPricePaise ? "trial session" : "per session"}</span>
          </p>
          <span className="relative z-10 shrink-0">
            <KidsVideoButton url={item.previewVideoUrl} title={item.name} />
          </span>
        </div>
      </div>
    </article>
  );
}
