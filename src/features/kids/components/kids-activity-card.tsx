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
    <article className="group relative flex gap-3.5 rounded-[20px] border border-kids-ink/10 bg-white p-3 transition-colors hover:border-kids-ink/25">
      <CoverArt theme={item.category} className="h-24 w-24 shrink-0 rounded-[14px]" />
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:rounded-[20px]">
            {item.name}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-sm text-kids-ink/60">
          {item.vendor.name} · {item.vendor.area}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-kids-ink/70">
          <span>{formatAgeBadge(item.ageMin, item.ageMax)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{item.durationMinutes} min</span>
          <span className="inline-flex items-center gap-1"><AppIcon name={item.format} className="h-3.5 w-3.5" />{KIDS_FORMATS[item.format].label}</span>
          {item.vendor.reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1 font-medium text-kids-ink">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              {item.vendor.rating.toFixed(1)}
            </span>
          ) : (
            <span className="font-medium text-good">New</span>
          )}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <p className="whitespace-nowrap leading-tight">
            <span className="text-base font-bold tabular-nums">{formatINR(price)}</span>
            <span className="ml-1 text-[13px] text-kids-ink/55">{item.trialPricePaise ? "trial" : "/ session"}</span>
          </p>
          <span className="relative z-10 shrink-0">
            <KidsVideoButton url={item.previewVideoUrl} title={item.name} />
          </span>
        </div>
      </div>
    </article>
  );
}
