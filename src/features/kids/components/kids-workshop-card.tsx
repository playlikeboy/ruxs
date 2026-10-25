import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { CoverArt } from "@/components/ui/cover-art";
import { formatINR } from "@/core/money";
import { formatAgeBadge, formatBatchUrgency } from "@/core/kids";
import { KidsVideoButton } from "./kids-video-dialog";
import { KidsTag } from "./kids-ui";
import type { KidsWorkshopItem } from "../types";

/** A dated workshop or camp with seats left. */
export function KidsWorkshopCard({ item }: { item: KidsWorkshopItem }) {
  const urgency = formatBatchUrgency(item.batchSize, item.enrolledCount);
  const href = `/app/kids/workshops/${item.id}`;

  return (
    <article className="group relative overflow-hidden rounded-[20px] border border-kids-ink/10 bg-white transition-all duration-200 hover:border-kids-ink/25 hover:shadow-[0_4px_16px_rgba(23,71,55,0.06)] hover:-translate-y-0.5">
      <CoverArt theme={item.category} className="h-32 w-full" />
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <KidsTag><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{item.dateLabel}</KidsTag>
          <KidsTag tone={urgency.isAlmostFull ? "warn" : "good"}>
            {urgency.isAlmostFull ? `🔥 ${urgency.label}` : `✨ ${urgency.label}`}
          </KidsTag>
        </div>
        <h3 className="mt-2.5 font-kids text-base font-semibold leading-snug text-kids-ink">
          <Link href={href} className="after:absolute after:inset-0">{item.title}</Link>
        </h3>
        <p className="mt-0.5 truncate text-sm text-kids-ink/60">{item.vendor.name} · {item.vendor.area}</p>
        <p className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-kids-ink/[0.05] px-2.5 py-0.5 font-medium text-kids-ink/75">
            <Clock className="h-3 w-3" aria-hidden="true" />{item.timeLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-kids-peach/40 px-2.5 py-0.5 font-semibold text-kids-ink">
            🐣 {formatAgeBadge(item.minAge, item.maxAge)}
          </span>
        </p>
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-kids-ink/10 pt-3">
          <p className="whitespace-nowrap">
            <span className="text-base font-extrabold tabular-nums text-kids-ink">{formatINR(item.pricePaise)}</span>
            <span className="ml-1 text-[13px] text-kids-ink/60">per child</span>
          </p>
          <span className="relative z-10 shrink-0">
            <KidsVideoButton url={item.previewVideoUrl} title={item.title} />
          </span>
        </div>
      </div>
    </article>
  );
}
