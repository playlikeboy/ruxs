"use client";

import { useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { forwardStoreOrder, updateStoreOrderFulfilment } from "../admin-actions";
import type { AdminOrderFulfilment, AdminPartnerSuggestion } from "../types";
import { ErrorNote } from "./seller-ui";
import { istDateTime } from "./store-labels";
import { useStoreAction } from "./use-store-action";

const MATCH: Record<AdminPartnerSuggestion["matchedBy"], string> = {
  pin: "Covers this PIN code",
  state: "Covers this state",
  anywhere: "Takes orders from anywhere",
};

/**
 * Hand an order to a fulfilment partner. The best match is picked first; the
 * same partner again resends the email. Internal: households never see this.
 */
export function OrderForwardPanel({ orderId, fulfilment: f }: { orderId: string; fulfilment: AdminOrderFulfilment }) {
  const { pending, error, run } = useStoreAction();
  const [partnerId, setPartnerId] = useState(f.partnerId ?? f.suggestions[0]?.partnerId ?? "");
  const [note, setNote] = useState("");
  const same = !!f.partnerId && partnerId === f.partnerId;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run(() => forwardStoreOrder({ orderId, partnerId, note: note || undefined }), {
      success: (r) =>
        r.emailed
          ? `${r.reassigned ? "Moved to" : "Sent to"} ${r.partnerName}. Email sent.`
          : `Marked for ${r.partnerName}, but the email did not send. Use Resend.`,
      onOk: () => setNote(""),
    });
  }

  return (
    <div className="space-y-4">
      {f.partnerId ? (
        <div className="text-sm">
          <p className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-ink">{f.partnerName}</span>
            {f.forwardEmailedAt ? <Badge tone="good">Email sent</Badge> : <Badge tone="bad">Email not sent</Badge>}
          </p>
          <p className="text-xs text-muted">
            {f.partnerEmail} · forwarded {istDateTime(f.forwardedAt)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">Not forwarded yet. RUXs packs and ships this order itself until it is.</p>
      )}

      {!f.canForward ? (
        <p className="text-sm text-muted">Only new and packed orders can be forwarded.</p>
      ) : f.suggestions.length === 0 ? (
        <p className="text-sm text-muted">
          No active partner yet.{" "}
          <Link href="/seller-portal/partners" className="font-semibold text-accent hover:underline">
            Add a partner
          </Link>{" "}
          to forward orders.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-sm font-medium text-ink">Partner</legend>
            {f.suggestions.map((s, i) => (
              <label
                key={s.partnerId}
                className={
                  "flex min-h-11 cursor-pointer items-start gap-3 rounded-control border bg-surface px-3 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent " +
                  (partnerId === s.partnerId ? "border-ink" : "border-line")
                }
              >
                <input
                  type="radio"
                  name="forward-partner"
                  value={s.partnerId}
                  checked={partnerId === s.partnerId}
                  onChange={() => setPartnerId(s.partnerId)}
                  className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink">
                    {s.name}
                    {i === 0 && <Badge tone="accent">Suggested</Badge>}
                    {s.partnerId === f.partnerId && <Badge tone="info">Current</Badge>}
                  </span>
                  <span className="block text-xs text-muted">
                    {MATCH[s.matchedBy]} · <span className="tabular-nums">{s.openOrders}</span> open {s.openOrders === 1 ? "order" : "orders"}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <Field label="Note for the partner" htmlFor="of-note" hint="Optional. Added to the email.">
            <Textarea id="of-note" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <ErrorNote>{error}</ErrorNote>
          <button type="submit" disabled={pending || !partnerId} aria-busy={pending} className={buttonClass(same ? "secondary" : "primary", "md")}>
            <Send className="h-4 w-4" aria-hidden="true" />
            {pending ? "Sending…" : same ? "Resend the email" : f.partnerId ? "Move to this partner" : "Forward order"}
          </button>
        </form>
      )}
    </div>
  );
}

/** What the partner told us: their reference and a status note. Courier and tracking are kept as they are. */
export function PartnerUpdateForm({
  orderId,
  partnerRef,
  partnerStatusNote,
  courier,
  trackingNumber,
}: {
  orderId: string;
  partnerRef: string | null;
  partnerStatusNote: string | null;
  courier: string | null;
  trackingNumber: string | null;
}) {
  const { pending, error, run } = useStoreAction();
  const [ref, setRef] = useState(partnerRef ?? "");
  const [status, setStatus] = useState(partnerStatusNote ?? "");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => updateStoreOrderFulfilment({ orderId, partnerRef: ref, partnerStatusNote: status, courier: courier ?? "", trackingNumber: trackingNumber ?? "" }),
          { success: "Partner update saved" }
        );
      }}
    >
      <Field label="Partner's reference" htmlFor="pf-ref" hint="Their order number or AWB.">
        <Input id="pf-ref" maxLength={80} value={ref} onChange={(e) => setRef(e.target.value)} />
      </Field>
      <Field label="Latest update from the partner" htmlFor="pf-status" hint="Only the team sees this.">
        <Textarea id="pf-status" rows={2} maxLength={500} value={status} onChange={(e) => setStatus(e.target.value)} />
      </Field>
      <ErrorNote>{error}</ErrorNote>
      <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass("secondary", "md")}>
        {pending ? "Saving…" : "Save partner update"}
      </button>
    </form>
  );
}
