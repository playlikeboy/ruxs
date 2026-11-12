import Link from "next/link";
import { ArrowRight, CheckCircle2, Repeat } from "lucide-react";
import { formatINR } from "@/core/money";
import { weekdayIST } from "@/core/time";
import { StoreCover } from "./store-cover";
import type { CoverStyle } from "@/config/service-kinds";

export interface HeroPlanItem {
  id: string;
  productName: string;
  vendorName: string;
  vendorSlug: string;
  imageUrl: string | null;
  kind: string;
  pricePaise: number;
  qty: number;
  shift: string;
  cutoffAt: string;
  days: string[];
  isDeliveringToday: boolean;
  isSkippedToday: boolean;
}

export function HeroSubscriptionPlans({
  plans,
  today,
  category,
}: {
  plans: HeroPlanItem[];
  today: string;
  category: (kind: string) => CoverStyle;
}) {
  const currentWeekday = weekdayIST(today);

  // New households see the home slides instead of a promo card.
  if (plans.length === 0) return null;

  return (
    <section className="mt-4 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mint text-good">
            <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">Your daily plans</h2>
            <p className="text-xs text-muted">
              {plans.length} active {plans.length === 1 ? "service" : "services"}
            </p>
          </div>
        </div>
        <Link
          href="/app/plans"
          className="flex min-h-10 items-center gap-0.5 text-xs font-semibold text-accent hover:underline"
        >
          Manage plans <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pt-3 pb-1 [scrollbar-width:none]">
        {plans.map((p) => {
          const cat = category(p.kind);
          const isScheduledToday = p.days.includes(currentWeekday);

          return (
            <div
              key={p.id}
              className="flex w-[220px] shrink-0 flex-col justify-between rounded-xl bg-app-canvas p-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <StoreCover
                    cover={cat}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-xl"
                  />
                  {isScheduledToday ? (
                    p.isSkippedToday ? (
                      <span className="rounded-full bg-line px-2 py-0.5 text-xs font-semibold text-ink">
                        Off today
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-xs font-semibold text-good">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Delivering
                      </span>
                    )
                  ) : (
                    <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                      Not today
                    </span>
                  )}
                </div>

                <h3 className="mt-2 line-clamp-1 text-[13px] font-semibold text-ink">
                  {p.productName}
                </h3>
                <p className="truncate text-xs text-muted">
                  {p.vendorName}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-line pt-2 text-xs">
                <span className="font-semibold tabular-nums text-ink">
                  {formatINR(p.pricePaise)}
                  <span className="text-xs font-normal text-muted"> / day</span>
                </span>
                <Link
                  href="/app/plans"
                  aria-label={`Manage ${p.productName} plan`}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Manage
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
