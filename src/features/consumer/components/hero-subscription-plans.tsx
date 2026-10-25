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
    <section className="mt-4 rounded-3xl border border-black/5 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mint text-good">
            <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">Your Daily Subscriptions</h2>
            <p className="text-[11px] text-neutral-500">
              {plans.length} active {plans.length === 1 ? "service" : "services"}
            </p>
          </div>
        </div>
        <Link
          href="/app/plans"
          className="flex items-center gap-0.5 text-xs font-semibold text-accent hover:underline"
        >
          Manage plans <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pt-3 pb-1 [scrollbar-width:none]">
        {plans.map((p) => {
          const cat = category(p.kind);
          const isScheduledToday = p.days.includes(currentWeekday);

          return (
            <div
              key={p.id}
              className="flex w-[220px] shrink-0 flex-col justify-between rounded-2xl border border-black/10 bg-neutral-50/60 p-3"
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
                      <span className="rounded-full bg-neutral-200/80 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                        Off today
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-[10px] font-semibold text-good">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Delivering
                      </span>
                    )
                  ) : (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-500 border border-black/5">
                      Not today
                    </span>
                  )}
                </div>

                <h3 className="mt-2 line-clamp-1 text-[13px] font-semibold text-ink">
                  {p.productName}
                </h3>
                <p className="truncate text-xs text-neutral-500">
                  {p.vendorName}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-2 text-xs">
                <span className="font-semibold tabular-nums text-ink">
                  {formatINR(p.pricePaise)}
                  <span className="text-[10px] font-normal text-neutral-500"> / day</span>
                </span>
                <Link
                  href="/app/plans"
                  className="text-[11px] font-semibold text-accent hover:underline"
                >
                  Manage →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
