"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Select, Toggle } from "@/components/ui/field";
import { formatINR, rupeesToPaise } from "@/core/money";
import { normalizeCouponCode } from "@/core/store";
import { AdminDialog } from "@/features/admin/components/admin-dialog";
import { deleteStoreCoupon, saveStoreCoupon } from "../admin-actions";
import type { AdminStoreCoupon } from "../types";
import { DialogButtons, EmptyNote, ErrorNote, iconButton } from "./seller-ui";
import { CouponStateBadge, istDateTime, istInputToIso, istInputValue, paiseToInput } from "./store-labels";
import { useStoreAction } from "./use-store-action";

interface Draft {
  id?: string;
  code: string;
  description: string;
  kind: "percent" | "flat";
  /** Percent as typed ("10") or rupees ("150"). */
  value: string;
  minOrder: string;
  maxDiscount: string;
  usageLimit: string;
  perUserLimit: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const blank: Draft = { code: "", description: "", kind: "percent", value: "", minOrder: "", maxDiscount: "", usageLimit: "", perUserLimit: "1", startsAt: "", endsAt: "", isActive: true };

const toDraft = (c: AdminStoreCoupon): Draft => ({
  id: c.id,
  code: c.code,
  description: c.description,
  kind: c.kind,
  value: c.kind === "percent" ? String(c.value / 100) : paiseToInput(c.value),
  minOrder: c.minOrderPaise ? paiseToInput(c.minOrderPaise) : "",
  maxDiscount: paiseToInput(c.maxDiscountPaise),
  usageLimit: c.usageLimit == null ? "" : String(c.usageLimit),
  perUserLimit: c.perUserLimit == null ? "" : String(c.perUserLimit),
  startsAt: istInputValue(c.startsAt),
  endsAt: istInputValue(c.endsAt),
  isActive: c.isActive,
});

const optionalInt = (v: string) => (v.trim() === "" ? null : Math.round(Number(v)));

function toInput(d: Draft) {
  return {
    id: d.id,
    code: d.code,
    description: d.description,
    kind: d.kind,
    // Percent is stored as basis points (10% = 1000); a flat discount as integer paise.
    value: d.kind === "percent" ? Math.round(Number(d.value) * 100) : rupeesToPaise(d.value || "0"),
    minOrderPaise: rupeesToPaise(d.minOrder || "0"),
    maxDiscountPaise: d.kind === "percent" && d.maxDiscount.trim() ? rupeesToPaise(d.maxDiscount) : null,
    usageLimit: optionalInt(d.usageLimit),
    perUserLimit: optionalInt(d.perUserLimit),
    startsAt: istInputToIso(d.startsAt),
    endsAt: istInputToIso(d.endsAt),
    isActive: d.isActive,
  };
}

export function couponOffer(c: Pick<AdminStoreCoupon, "kind" | "value" | "maxDiscountPaise" | "minOrderPaise">): string {
  const off = c.kind === "percent" ? `${c.value / 100}% off` : `${formatINR(c.value)} off`;
  const cap = c.kind === "percent" && c.maxDiscountPaise != null ? `, up to ${formatINR(c.maxDiscountPaise)}` : "";
  const min = c.minOrderPaise > 0 ? ` on orders of ${formatINR(c.minOrderPaise)} or more` : "";
  return `${off}${cap}${min}`;
}

/** Coupon codes: create, edit, switch off and remove, with how often each was used. */
export function CouponManager({ coupons }: { coupons: AdminStoreCoupon[] }) {
  const { pending, error, setError, run } = useStoreAction();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<AdminStoreCoupon | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const money = { inputMode: "decimal" as const, type: "number", min: 0, step: "0.01", className: "tabular-nums" };
  const whole = { inputMode: "numeric" as const, type: "number", min: 1, step: 1, className: "tabular-nums" };

  if (draft) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!(Number(draft.value) > 0)) return setError("Enter the discount");
          run(() => saveStoreCoupon(toInput(draft)), { success: (r) => `Coupon ${r.code} saved`, onOk: () => setDraft(null) });
        }}
        className="max-w-2xl space-y-4 rounded-card border border-line bg-surface p-4 sm:p-6"
      >
        <h2 className="text-base font-semibold text-ink">{draft.id ? `Edit ${draft.code}` : "New coupon"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" htmlFor="cp-code" hint="3 to 24 characters: letters, numbers, - and _.">
            <Input
              id="cp-code"
              required
              minLength={3}
              maxLength={24}
              autoFocus={!draft.id}
              autoCapitalize="characters"
              spellCheck={false}
              value={draft.code}
              onChange={(e) => set("code", normalizeCouponCode(e.target.value))}
              placeholder="WELCOME10"
              className="font-mono uppercase"
            />
          </Field>
          <Field label="Description" htmlFor="cp-desc" hint="Optional. Households see it when the code applies.">
            <Input id="cp-desc" maxLength={160} value={draft.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Discount type" htmlFor="cp-kind">
            <Select id="cp-kind" value={draft.kind} onChange={(e) => set("kind", e.target.value as Draft["kind"])}>
              <option value="percent">Percent off the items</option>
              <option value="flat">Fixed amount off the items</option>
            </Select>
          </Field>
          <Field label={draft.kind === "percent" ? "Percent off (%)" : "Amount off (₹)"} htmlFor="cp-value" hint="Taken off the items, never off delivery.">
            <Input
              id="cp-value"
              required
              inputMode="decimal"
              type="number"
              min={draft.kind === "percent" ? 0.01 : 1}
              max={draft.kind === "percent" ? 100 : undefined}
              step="0.01"
              value={draft.value}
              onChange={(e) => set("value", e.target.value)}
              className="tabular-nums"
            />
          </Field>
          <Field label="Minimum order (₹)" htmlFor="cp-min" hint="Blank = any order.">
            <Input id="cp-min" {...money} value={draft.minOrder} onChange={(e) => set("minOrder", e.target.value)} />
          </Field>
          {draft.kind === "percent" && (
            <Field label="Most it can take off (₹)" htmlFor="cp-max" hint="Blank = no cap.">
              <Input id="cp-max" {...money} value={draft.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} />
            </Field>
          )}
          <Field label="Total uses allowed" htmlFor="cp-limit" hint="Blank = no limit. Cancelled orders don't count.">
            <Input id="cp-limit" {...whole} value={draft.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} />
          </Field>
          <Field label="Uses per household" htmlFor="cp-per" hint="Blank = no limit.">
            <Input id="cp-per" {...whole} value={draft.perUserLimit} onChange={(e) => set("perUserLimit", e.target.value)} />
          </Field>
          <Field label="Starts" htmlFor="cp-start" hint="India time. Blank = right away.">
            <Input id="cp-start" type="datetime-local" value={draft.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
          </Field>
          <Field label="Ends" htmlFor="cp-end" hint="India time. Blank = no end date.">
            <Input id="cp-end" type="datetime-local" value={draft.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
          </Field>
        </div>
        <Toggle id="cp-active" label="Coupon is on" checked={draft.isActive} onChange={(v) => set("isActive", v)} />
        <ErrorNote>{error}</ErrorNote>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass("primary", "lg")}>
            {pending ? "Saving…" : draft.id ? "Save coupon" : "Add coupon"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setDraft(null);
              setError(null);
            }}
            className={buttonClass("secondary", "lg")}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setDraft(blank)} className={buttonClass("primary", "md")}>
        <Plus className="h-4 w-4" aria-hidden="true" /> Add coupon
      </button>

      {coupons.length === 0 ? (
        <EmptyNote title="No coupons yet" body="Add a code households can type at checkout, like WELCOME10 for 10% off a first order." />
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface" aria-busy={pending}>
          {coupons.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
              <div className="min-w-0 flex-1 basis-56">
                <p className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-sm font-semibold text-ink">{c.code}</span>
                  <CouponStateBadge state={c.state} />
                </p>
                <p className="text-sm text-ink">{couponOffer(c)}</p>
                <p className="text-xs text-muted">
                  {c.startsAt ? `From ${istDateTime(c.startsAt)}` : "No start date"} · {c.endsAt ? `until ${istDateTime(c.endsAt)}` : "no end date"}
                </p>
              </div>
              <dl className="flex gap-5 text-right">
                <div>
                  <dt className="text-xs text-muted">Used</dt>
                  <dd className="text-sm font-semibold tabular-nums text-ink">
                    {c.uses}
                    {c.usageLimit != null ? ` of ${c.usageLimit}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Discount given</dt>
                  <dd className="text-sm font-semibold tabular-nums text-ink">{formatINR(c.discountGivenPaise)}</dd>
                </div>
              </dl>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => saveStoreCoupon({ ...toInput(toDraft(c)), isActive: !c.isActive }), { toastError: true, success: c.isActive ? `${c.code} switched off` : `${c.code} switched on` })}
                  className={buttonClass("secondary", "sm")}
                >
                  {c.isActive ? "Switch off" : "Switch on"}
                </button>
                <button type="button" disabled={pending} onClick={() => setDraft(toDraft(c))} className={buttonClass("secondary", "sm")}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                </button>
                <button type="button" disabled={pending} onClick={() => setRemoving(c)} className={iconButton} aria-label={`Remove ${c.code}`}>
                  <Trash2 className="h-4 w-4 text-bad" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminDialog
        open={!!removing}
        onClose={() => !pending && setRemoving(null)}
        busy={pending}
        icon={<Trash2 className="h-5 w-5" />}
        title={`Remove ${removing?.code ?? "coupon"}?`}
        description="Households can no longer use the code. If an order already used it, it is switched off and kept for the records."
      >
        <DialogButtons
          pending={pending}
          danger
          dismiss="Keep it"
          confirm="Remove coupon"
          busyText="Removing…"
          onCancel={() => setRemoving(null)}
          onConfirm={() =>
            removing &&
            run(() => deleteStoreCoupon({ couponId: removing.id }), {
              toastError: true,
              success: (r) => (r.deactivated ? `${removing.code} was used on orders, so it was switched off instead` : `${removing.code} removed`),
              onOk: () => setRemoving(null),
            })
          }
        />
      </AdminDialog>
    </div>
  );
}
