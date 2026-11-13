"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Textarea, Toggle } from "@/components/ui/field";
import { AdminDialog } from "@/features/admin/components/admin-dialog";
import { deleteStorePartner, saveStorePartner } from "../admin-actions";
import type { AdminFulfilmentPartner } from "../types";
import { DialogButtons, EmptyNote, ErrorNote, iconButton } from "./seller-ui";
import { StatePicker, parsePinPrefixes } from "./state-picker";
import { useStoreAction } from "./use-store-action";

interface Draft {
  id?: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  coverageStates: string[];
  pinPrefixes: string;
  isActive: boolean;
  notes: string;
}

const toDraft = (p: AdminFulfilmentPartner): Draft => ({
  id: p.id,
  name: p.name,
  contactName: p.contactName,
  email: p.email,
  phone: p.phone,
  coverageStates: p.coverageStates,
  pinPrefixes: p.coveragePinPrefixes.join(", "),
  isActive: p.isActive,
  notes: p.notes,
});

const toInput = (d: Draft) => ({
  id: d.id,
  name: d.name,
  contactName: d.contactName,
  email: d.email,
  phone: d.phone,
  coverageStates: d.coverageStates,
  coveragePinPrefixes: parsePinPrefixes(d.pinPrefixes),
  isActive: d.isActive,
  notes: d.notes,
});

function coverage(p: AdminFulfilmentPartner): string {
  if (p.coverageStates.length === 0 && p.coveragePinPrefixes.length === 0) return "Takes orders from anywhere (used last)";
  const pins = p.coveragePinPrefixes.length ? `PIN ${p.coveragePinPrefixes.slice(0, 6).join(", ")}${p.coveragePinPrefixes.length > 6 ? ` +${p.coveragePinPrefixes.length - 6} more` : ""}` : "";
  const states = p.coverageStates.length ? `${p.coverageStates.slice(0, 3).join(", ")}${p.coverageStates.length > 3 ? ` +${p.coverageStates.length - 3} more` : ""}` : "";
  return [pins, states].filter(Boolean).join(" · ");
}

/** The companies that pack and ship forwarded orders. Internal: nothing here reaches a household. */
export function PartnerManager({ partners }: { partners: AdminFulfilmentPartner[] }) {
  const { pending, error, setError, run } = useStoreAction();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<AdminFulfilmentPartner | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  if (draft) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveStorePartner(toInput(draft)), { success: draft.id ? "Partner saved" : "Partner added", onOk: () => setDraft(null) });
        }}
        className="max-w-2xl space-y-4 rounded-card border border-line bg-surface p-4 sm:p-6"
      >
        <h2 className="text-base font-semibold text-ink">{draft.id ? `Edit ${draft.name}` : "New partner"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" htmlFor="pt-name">
            <Input id="pt-name" required minLength={2} maxLength={80} autoFocus={!draft.id} value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Contact person" htmlFor="pt-contact" hint="Optional.">
            <Input id="pt-contact" maxLength={80} autoComplete="off" value={draft.contactName} onChange={(e) => set("contactName", e.target.value)} />
          </Field>
          <Field label="Order email" htmlFor="pt-email" hint="Forwarded orders are emailed here.">
            <Input id="pt-email" required type="email" maxLength={200} autoComplete="off" value={draft.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Phone" htmlFor="pt-phone" hint="Optional.">
            <Input id="pt-phone" type="tel" maxLength={20} autoComplete="off" value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
        </div>
        <Field label="PIN code prefixes they cover" htmlFor="pt-pins" hint="1 to 6 digits each, separated by commas or spaces. Optional.">
          <Textarea id="pt-pins" rows={2} inputMode="numeric" value={draft.pinPrefixes} onChange={(e) => set("pinPrefixes", e.target.value)} placeholder="834, 835" className="tabular-nums" />
        </Field>
        <StatePicker
          name="pt-state"
          legend="States they cover"
          hint="Leave both empty for a partner that takes orders from anywhere. Such a partner is suggested last."
          value={draft.coverageStates}
          onChange={(v) => set("coverageStates", v)}
        />
        <Field label="Notes" htmlFor="pt-notes" hint="Rates, pickup days, anything the team should know.">
          <Textarea id="pt-notes" rows={3} maxLength={1000} value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
        <Toggle id="pt-active" label="Taking orders" checked={draft.isActive} onChange={(v) => set("isActive", v)} />
        <ErrorNote>{error}</ErrorNote>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass("primary", "lg")}>
            {pending ? "Saving…" : draft.id ? "Save partner" : "Add partner"}
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
        onClick={() => setDraft({ name: "", contactName: "", email: "", phone: "", coverageStates: [], pinPrefixes: "", isActive: true, notes: "" })}
        className={buttonClass("primary", "md")}
      >
        <Plus className="h-4 w-4" aria-hidden="true" /> Add partner
      </button>

      {partners.length === 0 ? (
        <EmptyNote title="No partners yet" body="RUXs packs and ships every order itself. Add a partner to forward orders to them by email." />
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface" aria-busy={pending}>
          {partners.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
              <div className="min-w-0 flex-1 basis-56">
                <p className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink">{p.name}</span>
                  <Badge tone={p.isActive ? "good" : "neutral"}>{p.isActive ? "Taking orders" : "Off"}</Badge>
                </p>
                <p className="break-all text-xs text-muted">
                  {[p.contactName, p.email, p.phone].filter(Boolean).join(" · ")}
                </p>
                <p className="break-words text-xs tabular-nums text-muted">{coverage(p)}</p>
              </div>
              <dl className="flex gap-5 text-right">
                <div>
                  <dt className="text-xs text-muted">Open</dt>
                  <dd className="text-sm font-semibold tabular-nums text-ink">{p.openOrders}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">All time</dt>
                  <dd className="text-sm font-semibold tabular-nums text-ink">{p.totalOrders}</dd>
                </div>
              </dl>
              <div className="flex gap-2">
                <Link href={`/seller-portal/audit?entity=partner&id=${p.id}`} className={buttonClass("ghost", "sm")}>
                  History
                </Link>
                <button type="button" disabled={pending} onClick={() => setDraft(toDraft(p))} className={buttonClass("secondary", "sm")}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                </button>
                <button type="button" disabled={pending} onClick={() => setRemoving(p)} className={iconButton} aria-label={`Remove ${p.name}`}>
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
        title={`Remove ${removing?.name ?? "partner"}?`}
        description="They stop getting new orders. If they already handled an order, they are switched off and kept for the records."
      >
        <DialogButtons
          pending={pending}
          danger
          dismiss="Keep them"
          confirm="Remove partner"
          busyText="Removing…"
          onCancel={() => setRemoving(null)}
          onConfirm={() =>
            removing &&
            run(() => deleteStorePartner({ partnerId: removing.id }), {
              toastError: true,
              success: (r) => (r.deactivated ? `${removing.name} has past orders, so they were switched off instead` : `${removing.name} removed`),
              onOk: () => setRemoving(null),
            })
          }
        />
      </AdminDialog>
    </div>
  );
}
