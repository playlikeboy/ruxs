import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { getMyStoreOrders } from "@/features/store/queries";
import { KidsPageHeader, kidsCard, kidsPrimaryButton } from "@/features/kids/components/kids-ui";
import { StoreProductImage } from "@/features/store/components/store-product-card";
import { StoreStatusPill, paymentLine } from "@/features/store/components/store-status";
import { formatINR } from "@/core/money";

export const metadata: Metadata = { title: "Store orders · RUXs Kids" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function StoreOrdersPage() {
  const orders = await getMyStoreOrders();

  return (
    <div className="space-y-5">
      <KidsPageHeader title="Store orders" lead="Your RUXs Store orders, newest first." />
      {orders.length === 0 ? (
        <div className={`${kidsCard} flex flex-col items-center px-6 py-10 text-center`}>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kids-sky/60">
            <Package className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-4 font-kids text-xl font-semibold">No store orders yet</p>
          <p className="mt-1 max-w-xs text-sm text-kids-ink/65">Orders you place in the RUXs Store show up here with their delivery status.</p>
          <Link href="/app/kids/shop" className={`${kidsPrimaryButton} mt-5`}>
            Browse the store
          </Link>
        </div>
      ) : (
        <ul className={`${kidsCard} divide-y divide-kids-ink/10 overflow-hidden`}>
          {orders.map((o) => {
            const more = o.itemCount > 1 ? ` + ${o.itemCount - 1} more` : "";
            return (
              <li key={o.id}>
                <Link
                  href={`/app/kids/shop/orders/${o.id}`}
                  className="flex items-center gap-3 p-3.5 transition-colors hover:bg-kids-cream focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-kids-ink"
                >
                  <StoreProductImage src={o.firstItemImage} alt="" className="h-14 w-14 shrink-0 rounded-[12px]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StoreStatusPill status={o.status} label={o.statusLabel} />
                      <span className="text-xs tabular-nums text-kids-ink/60">{o.orderNumber}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold">
                      {o.firstItemName ?? "Order"}
                      {more}
                    </p>
                    <p className="text-xs text-kids-ink/65">
                      <time dateTime={o.createdAt.toISOString()}>{dateFmt.format(o.createdAt)}</time> · {paymentLine(o.paymentMode, o.paymentStatus)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums">{formatINR(o.totalPaise)}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-kids-ink/40" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
