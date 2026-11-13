import { istDateTime } from "./store-labels";
import type { AdminAuditEntry } from "../types";

const TITLES: Record<string, string> = {
  "category.save": "Category saved",
  "collection.create": "Collection added",
  "collection.update": "Collection changed",
  "collection.delete": "Collection removed",
  "coupon.create": "Coupon added",
  "coupon.update": "Coupon changed",
  "coupon.deactivate": "Coupon switched off",
  "coupon.delete": "Coupon removed",
  "export.orders": "Orders exported",
  "export.products": "Products exported",
  "order.auto_forward": "Order forwarded automatically",
  "order.forward": "Order forwarded to a partner",
  "order.details": "Courier or note changed",
  "order.fulfilment": "Partner update saved",
  "order.refund": "Order refunded",
  "order.status": "Order status changed",
  "partner.create": "Partner added",
  "partner.update": "Partner changed",
  "partner.deactivate": "Partner switched off",
  "partner.delete": "Partner removed",
  "product.create": "Product added",
  "product.update": "Product changed",
  "product.archive": "Product archived",
  "product.restore": "Product restored",
  "product.import": "Products imported",
  "return.approved": "Return approved",
  "return.rejected": "Return declined",
  "return.received": "Return received",
  "return.refunded": "Return refunded",
  "review.published": "Review published",
  "review.hidden": "Review hidden",
  "review.pending": "Review moved back to waiting",
  "settings.save": "Store settings saved",
  "stock.adjust": "Stock adjusted",
  "stock.bulk_update": "Stock updated in bulk",
  "zone.create": "Shipping zone added",
  "zone.update": "Shipping zone changed",
  "zone.deactivate": "Shipping zone switched off",
  "zone.delete": "Shipping zone removed",
};

/** "order.forward" → "Order forwarded to a partner". An action without a title falls back to its own words. */
export function auditTitle(action: string): string {
  const known = TITLES[action];
  if (known) return known;
  const words = action.replace(/[._-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function show(v: unknown): string {
  if (v == null) return "none";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "string" || typeof v === "number") return String(v);
  const json = JSON.stringify(v);
  return json.length > 160 ? `${json.slice(0, 160)}…` : json;
}

/** Audit entries as a plain list. `data` is whatever the action recorded, shown as key: value pairs. */
export function AuditList({ rows, empty, compact = false }: { rows: AdminAuditEntry[]; empty: string; compact?: boolean }) {
  if (rows.length === 0) return <p className="px-4 py-6 text-sm text-muted">{empty}</p>;
  return (
    <ul className={"divide-y divide-line " + (compact ? "max-h-96 overflow-y-auto" : "")}>
      {rows.map((a) => {
        const data = Object.entries(a.data ?? {});
        return (
          <li key={a.id} className="px-4 py-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-sm font-medium text-ink">{auditTitle(a.action)}</p>
              <p className="text-xs tabular-nums text-muted">{istDateTime(a.createdAt)}</p>
            </div>
            <p className="break-all text-xs text-muted">
              By {a.actorUserId === "system" ? "the system" : a.actorUserId}
              {!compact && a.entityId ? ` · ${a.entity} ${a.entityId}` : ""}
            </p>
            {data.length > 0 && (
              <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                {data.map(([k, v]) => (
                  <div key={k} className="flex min-w-0 gap-1">
                    <dt className="shrink-0 text-muted">{k}:</dt>
                    <dd className="break-all text-ink">{show(v)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        );
      })}
    </ul>
  );
}
