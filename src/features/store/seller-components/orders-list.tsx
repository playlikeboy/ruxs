"use client";

import { useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { formatINR } from "@/core/money";
import { canForwardStoreOrder } from "@/core/store";
import { bulkForwardStoreOrders } from "../admin-actions";
import type { AdminStoreOrderRow } from "../types";
import { ErrorNote, selectInput } from "./seller-ui";
import { StorePaymentBadge, StoreStatusBadge, istDateTime } from "./store-labels";
import { useStoreAction } from "./use-store-action";

type Skipped = { orderId: string; orderNumber: string | null; error: string };

/** Order rows with a tick box on every order that can still be forwarded, and one bar to forward the ticked ones. */
export function StoreOrdersList({ rows, partners }: { rows: AdminStoreOrderRow[]; partners: { id: string; name: string }[] }) {
  const { pending, error, run } = useStoreAction();
  const [picked, setPicked] = useState<string[]>([]);
  const [partnerId, setPartnerId] = useState("");
  const [skipped, setSkipped] = useState<Skipped[]>([]);

  const forwardable = rows.filter((r) => canForwardStoreOrder(r.status)).map((r) => r.id);
  const live = picked.filter((id) => forwardable.includes(id));
  const allPicked = forwardable.length > 0 && live.length === forwardable.length;
  const showBulk = partners.length > 0 && forwardable.length > 0;

  function forward() {
    setSkipped([]);
    run(() => bulkForwardStoreOrders({ orderIds: live, partnerId: partnerId || undefined }), {
      success: (r) => `${r.forwarded} forwarded, ${r.emailed} emailed${r.skipped.length ? `, ${r.skipped.length} skipped` : ""}`,
      onOk: (r) => {
        setSkipped(r.skipped);
        setPicked([]);
      },
    });
  }

  return (
    <div className="space-y-3">
      {showBulk && (
        <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface p-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 pr-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={allPicked}
              onChange={() => setPicked(allPicked ? [] : forwardable)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Tick all on this page
          </label>
          <label htmlFor="bulk-partner" className="sr-only">
            Forward to
          </label>
          <select id="bulk-partner" value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className={selectInput}>
            <option value="">Best match for each order</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="button" disabled={pending || live.length === 0} aria-busy={pending} onClick={forward} className={buttonClass("dark", "md")}>
            <Send className="h-4 w-4" aria-hidden="true" />
            {pending ? "Forwarding…" : live.length === 0 ? "Forward ticked orders" : `Forward ${live.length} ${live.length === 1 ? "order" : "orders"}`}
          </button>
        </div>
      )}

      <ErrorNote>{error}</ErrorNote>
      {skipped.length > 0 && (
        <div role="status" className="rounded-card border border-line bg-butter px-4 py-3 text-sm text-warn">
          <p className="font-semibold">Not forwarded</p>
          <ul className="mt-1 space-y-0.5">
            {skipped.map((s) => (
              <li key={s.orderId}>
                <span className="font-semibold tabular-nums">{s.orderNumber ?? "Order"}</span>: {s.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {rows.map((r) => {
          const canPick = showBulk && forwardable.includes(r.id);
          const on = picked.includes(r.id);
          const place = [r.shipCity, r.shipState, r.shipPincode].filter(Boolean).join(", ");
          return (
            <li key={r.id} className="flex items-stretch">
              {showBulk && (
                <span className="flex w-11 shrink-0 items-center justify-center">
                  {canPick && (
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => setPicked(on ? picked.filter((id) => id !== r.id) : [...picked, r.id])}
                      aria-label={`Tick order ${r.orderNumber}`}
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                  )}
                </span>
              )}
              <Link
                href={`/seller-portal/orders/${r.id}`}
                className={
                  "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 py-3 pr-3 transition hover:bg-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent sm:grid-cols-[minmax(0,1fr)_auto_auto] " +
                  (showBulk ? "" : "pl-3")
                }
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold tabular-nums text-ink">{r.orderNumber}</span>
                  <span className="block truncate text-xs text-muted">
                    {r.customerName} · {r.itemCount} {r.itemCount === 1 ? "item" : "items"}
                    {place ? ` · ${place}` : ""}
                  </span>
                  <span className="block text-xs text-muted">{istDateTime(r.createdAt)}</span>
                </span>
                <span className="text-right text-sm font-semibold tabular-nums text-ink sm:order-last sm:w-24">{formatINR(r.totalPaise)}</span>
                <span className="col-span-2 flex flex-wrap gap-1 sm:col-span-1 sm:justify-end">
                  <StoreStatusBadge status={r.status} />
                  <StorePaymentBadge status={r.paymentStatus} mode={r.paymentMode} />
                  {r.partnerName ? <Badge tone="neutral">With {r.partnerName}</Badge> : showBulk && canForwardStoreOrder(r.status) ? <Badge tone="warn">Not forwarded</Badge> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
