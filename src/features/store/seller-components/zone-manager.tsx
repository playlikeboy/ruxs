"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Textarea, Toggle } from "@/components/ui/field";
import { formatINR, rupeesToPaise } from "@/core/money";
import { etaLabel } from "@/core/store";
import { AdminDialog } from "@/features/admin/components/admin-dialog";
import { deleteStoreShippingZone, saveStoreShippingZone } from "../admin-actions";
import type { AdminShippingZone } from "../types";
import { DialogButtons, EmptyNote, ErrorNote, iconButton } from "./seller-ui";
import { StatePicker, parsePinPrefixes } from "./state-picker";
import { paiseToInput } from "./store-labels";
import { useStoreAction } from "./use-store-action";

interface Draft {
  id?: string;
  name: string;
  pinPrefixes: string;
  states: string[];
  fee: string;
  freeAbove: string;
  etaMin: string;
  etaMax: string;
  codAllowed: boolean;
  isActive: boolean;
  sort: string;
}

const toDraft = (z: AdminShippingZone): Draft => ({
  id: z.id,
  name: z.name,
  pinPrefixes: z.pinPrefixes.join(", "),
  states: z.states,
  fee: paiseToInput(z.feePaise),
  freeAbove: paiseToInput(z.freeAbovePaise),
  etaMin: String(z.etaMinDays),
  etaMax: String(z.etaMaxDays),
  codAllowed: z.codAllowed,
  isActive: z.isActive,
  sort: String(z.sort),
});

const toInput = (d: Draft) => ({
  id: d.id,
  name: d.name,
  pinPrefixes: parsePinPrefixes(d.pinPrefixes),
  states: d.states,
  feePaise: rupeesToPaise(d.fee || "0"),
  freeAbovePaise: d.freeAbove.trim() ? rupeesToPaise(d.freeAbove) : null,
  etaMinDays: Math.round(Number(d.etaMin || 0)),
  etaMaxDays: Math.round(Number(d.etaMax || 0)),
  codAllowed: d.codAllowed,
  isActive: d.isActive,
  sort: Math.round(Number(d.sort || 0)),
});

function coverage(z: AdminShippingZone): string {
  const pins = z.pinPrefixes.length ? `PIN ${z.pinPrefixes.slice(0, 6).join(", ")}${z.pinPrefixes.length > 6 ? ` +${z.pinPrefixes.length - 6} more` : ""}` : "";
  const states = z.states.length ? `${z.states.slice(0, 3).join(", ")}${z.states.length > 3 ? ` +${z.states.length - 3} more` : ""}` : "";
  return [pins, states].filter(Boolean).join(" · ");
}

/** Delivery fee, time and COD by PIN prefix or state. The longest matching PIN prefix wins, then a state match. */
export function ZoneManager({ zones }: { zones: AdminShippingZone[] }) {
  const { pending, error, setError, run } = useStoreAction();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<AdminShippingZone | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const money = { inputMode: "decimal" as const, type: "number", min: 0, step: "0.01", className: "tabular-nums" };
  const days = { inputMode: "numeric" as const, type: "number", min: 0, max: 60, step: 1, className: "tabular-nums" };

  if (draft) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveStoreShippingZone(toInput(draft)), { success: draft.id ? "Zone saved" : "Zone added", onOk: () => setDraft(null) });
        }}
        className="max-w-2xl space-y-4 rounded-card border border-line bg-surface p-4 sm:p-6"
      >
        <h2 className="text-base font-semibold text-ink">{draft.id ? `Edit ${draft.name}` : "New shipping zone"}</h2>
        <Field label="Zone name" htmlFor="zn-name" hint="For the team only. Households never see it.">
          <Input id="zn-name" required minLength={2} maxLength={60} autoFocus={!draft.id} value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Ranchi city" />
        </Field>
        <Field label="PIN code prefixes" htmlFor="zn-pins" hint="1 to 6 digits each, separated by commas or spaces. 834 covers every PIN starting 834; 834001 covers one PIN.">
          <Textarea id="zn-pins" rows={2} inputMode="numeric" value={draft.pinPrefixes} onChange={(e) => set("pinPrefixes", e.target.value)} placeholder="834, 835" className="tabular-nums" />
        </Field>
        <StatePicker name="zn-state" legend="States" hint="A zone needs at least one PIN prefix or one state. A PIN match beats a state match." value={draft.states} onChange={(v) => set("states", v)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Delivery fee (₹)" htmlFor="zn-fee">
            <Input id="zn-fee" required {...money} value={draft.fee} onChange={(e) => set("fee", e.target.value)} />
          </Field>
          <Field label="Free above (₹)" htmlFor="zn-free" hint="Blank = never free.">
            <Input id="zn-free" {...money} value={draft.freeAbove} onChange={(e) => set("freeAbove", e.target.value)} />
          </Field>
          <Field label="Fastest delivery (days)" htmlFor="zn-min">
            <Input id="zn-min" required {...days} value={draft.etaMin} onChange={(e) => set("etaMin", e.target.value)} />
          </Field>
          <Field label="Slowest delivery (days)" htmlFor="zn-max">
            <Input id="zn-max" required {...days} value={draft.etaMax} onChange={(e) => set("etaMax", e.target.value)} />
          </Field>
          <Field label="Position" htmlFor="zn-sort" hint="Lower is checked first when two zones tie.">
            <Input id="zn-sort" inputMode="numeric" type="number" min={0} max={999} step={1} value={draft.sort} onChange={(e) => set("sort", e.target.value)} className="tabular-nums" />
          </Field>
        </div>
        <Toggle id="zn-cod" label="Cash on delivery allowed here" checked={draft.codAllowed} onChange={(v) => set("codAllowed", v)} />
        <Toggle id="zn-active" label="Zone is on" checked={draft.isActive} onChange={(v) => set("isActive", v)} />
        <ErrorNote>{error}</ErrorNote>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass("primary", "lg")}>
            {pending ? "Saving…" : draft.id ? "Save zone" : "Add zone"}
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
      <button
        type="button"
        onClick={() =>
          setDraft({ name: "", pinPrefixes: "", states: [], fee: "", freeAbove: "", etaMin: "2", etaMax: "5", codAllowed: true, isActive: true, sort: String((zones.at(-1)?.sort ?? 0) + 10) })
        }
        className={buttonClass("primary", "md")}
      >
        <Plus className="h-4 w-4" aria-hidden="true" /> Add zone
      </button>

      {zones.length === 0 ? (
        <EmptyNote title="No shipping zones yet" body="Every PIN code uses the store-wide fee and delivery time below. Add a zone to charge or promise something different for a city or state." />
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface" aria-busy={pending}>
          {zones.map((z) => (
            <li key={z.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
              <div className="min-w-0 flex-1 basis-56">
                <p className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink">{z.name}</span>
                  <Badge tone={z.isActive ? "good" : "neutral"}>{z.isActive ? "On" : "Off"}</Badge>
                  <Badge tone={z.codAllowed ? "info" : "neutral"}>{z.codAllowed ? "COD allowed" : "No COD"}</Badge>
                </p>
                <p className="break-words text-xs tabular-nums text-muted">{coverage(z)}</p>
              </div>
              <p className="text-right text-sm tabular-nums text-ink">
                {z.feePaise === 0 ? "Free delivery" : formatINR(z.feePaise)}
                {z.feePaise > 0 && z.freeAbovePaise != null ? <span className="block text-xs text-muted">free above {formatINR(z.freeAbovePaise)}</span> : null}
                <span className="block text-xs text-muted">{etaLabel(z.etaMinDays, z.etaMaxDays)}</span>
              </p>
              <div className="flex gap-2">
                <button type="button" disabled={pending} onClick={() => setDraft(toDraft(z))} className={buttonClass("secondary", "sm")}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                </button>
                <button type="button" disabled={pending} onClick={() => setRemoving(z)} className={iconButton} aria-label={`Remove ${z.name}`}>
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
        title={`Remove ${removing?.name ?? "zone"}?`}
        description="Its PIN codes fall back to the next matching zone or the store-wide defaults. If an order was priced by this zone, it is switched off and kept for the records."
      >
        <DialogButtons
          pending={pending}
          danger
          dismiss="Keep it"
          confirm="Remove zone"
          busyText="Removing…"
          onCancel={() => setRemoving(null)}
          onConfirm={() =>
            removing &&
            run(() => deleteStoreShippingZone({ zoneId: removing.id }), {
              toastError: true,
              success: (r) => (r.deactivated ? `${removing.name} priced past orders, so it was switched off instead` : `${removing.name} removed`),
              onOk: () => setRemoving(null),
            })
          }
        />
      </AdminDialog>
    </div>
  );
}
