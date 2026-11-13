"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Textarea, Toggle } from "@/components/ui/field";
import { storeSlug } from "@/core/store";
import { saveStoreCategory } from "../actions";
import type { AdminStoreCategory } from "../types";

interface Draft {
  isNew: boolean;
  id: string;
  name: string;
  description: string;
  icon: string;
  sort: number;
  isActive: boolean;
}

const toDraft = (c: AdminStoreCategory): Draft => ({
  isNew: false,
  id: c.id,
  name: c.name,
  description: c.description,
  icon: c.icon,
  sort: c.sort,
  isActive: c.isActive,
});

const iconBtn =
  "inline-flex h-10 w-10 items-center justify-center rounded-control border border-line bg-surface text-ink transition hover:border-ink/30 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Create, edit, hide and reorder store categories. Categories are never deleted: products point at them. */
export function StoreCategoryEditor({ categories }: { categories: AdminStoreCategory[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const payload = (d: Omit<Draft, "isNew">) => ({ id: d.id, name: d.name, description: d.description, icon: d.icon || "Package", sort: d.sort, isActive: d.isActive });

  function save(d: Draft) {
    setError(null);
    if (d.isNew && categories.some((c) => c.id === d.id)) return setError("That web address is taken by another category");
    start(async () => {
      const res = await saveStoreCategory(payload(d));
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(d.isNew ? "Category added" : "Category saved");
      setDraft(null);
      router.refresh();
    });
  }

  function toggle(c: AdminStoreCategory) {
    start(async () => {
      const res = await saveStoreCategory(payload({ ...toDraft(c), isActive: !c.isActive }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(c.isActive ? `${c.name} hidden` : `${c.name} showing`);
      router.refresh();
    });
  }

  /** Moves one row and renumbers every row that changed, in steps of 10. */
  function moveBy(index: number, step: -1 | 1) {
    const order = [...categories];
    const [row] = order.splice(index, 1);
    order.splice(index + step, 0, row!);
    const changed = order.map((c, i) => ({ c, sort: (i + 1) * 10 })).filter(({ c, sort }) => c.sort !== sort);
    start(async () => {
      for (const { c, sort } of changed) {
        const res = await saveStoreCategory(payload({ ...toDraft(c), sort }));
        if (!res.ok) {
          toast.error(res.error);
          break;
        }
      }
      router.refresh();
    });
  }

  if (draft) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(draft);
        }}
        className="max-w-xl space-y-4 rounded-card border border-line bg-surface p-4 sm:p-6"
      >
        <h2 className="text-base font-semibold text-ink">{draft.isNew ? "New category" : `Edit ${draft.name}`}</h2>
        <Field label="Name" htmlFor="sc-name">
          <Input
            id="sc-name"
            required
            minLength={2}
            maxLength={60}
            autoFocus
            value={draft.name}
            onChange={(e) => {
              const name = e.target.value;
              setDraft((d) => (d ? { ...d, name, id: d.isNew ? storeSlug(name) : d.id } : d));
            }}
            placeholder="Robotics & electronics"
          />
        </Field>
        <Field label="Web address" htmlFor="sc-id" hint={draft.isNew ? "Lowercase letters, numbers and dashes. Can't be changed later." : "Fixed once created."}>
          <Input id="sc-id" required minLength={2} maxLength={80} readOnly={!draft.isNew} value={draft.id} onChange={(e) => set("id", e.target.value.toLowerCase())} />
        </Field>
        <Field label="Short description" htmlFor="sc-desc" hint="Optional, up to 200 characters.">
          <Textarea id="sc-desc" rows={2} maxLength={200} value={draft.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Icon" htmlFor="sc-icon" hint="A Lucide icon name, e.g. Bot, Palette, Puzzle.">
            <Input id="sc-icon" maxLength={40} value={draft.icon} onChange={(e) => set("icon", e.target.value.trim())} placeholder="Package" />
          </Field>
          <Field label="Position" htmlFor="sc-sort" hint="Lower shows first.">
            <Input id="sc-sort" type="number" inputMode="numeric" min={0} max={999} value={draft.sort} onChange={(e) => set("sort", Number(e.target.value) || 0)} className="tabular-nums" />
          </Field>
        </div>
        <Toggle id="sc-active" label="Show in the store" checked={draft.isActive} onChange={(v) => set("isActive", v)} />
        {error && (
          <p role="alert" className="rounded-[10px] bg-blush px-3 py-2 text-sm font-medium text-bad">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass("primary", "lg")}>
            {pending ? "Saving…" : draft.isNew ? "Add category" : "Save category"}
          </button>
          <button type="button" disabled={pending} onClick={() => setDraft(null)} className={buttonClass("secondary", "lg")}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  const nextSort = (categories.at(-1)?.sort ?? 0) + 10;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setDraft({ isNew: true, id: "", name: "", description: "", icon: "Package", sort: nextSort, isActive: true })}
        className={buttonClass("primary", "md")}
      >
        <Plus className="h-4 w-4" aria-hidden="true" /> Add category
      </button>

      {categories.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-6 text-sm text-muted">No categories yet. Add one before adding products.</p>
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface" aria-busy={pending}>
          {categories.map((c, i) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="flex gap-1">
                <button type="button" disabled={pending || i === 0} onClick={() => moveBy(i, -1)} className={iconBtn} aria-label={`Move ${c.name} up`}>
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" disabled={pending || i === categories.length - 1} onClick={() => moveBy(i, 1)} className={iconBtn} aria-label={`Move ${c.name} down`}>
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink">{c.name}</span>
                  <Badge tone={c.isActive ? "good" : "neutral"}>{c.isActive ? "Showing" : "Hidden"}</Badge>
                </span>
                <span className="block truncate text-xs text-muted">
                  /{c.id} · {c.icon} · <span className="tabular-nums">{c.productCount}</span> live of <span className="tabular-nums">{c.totalProducts}</span> products
                </span>
              </span>
              <span className="flex gap-2">
                <button type="button" disabled={pending} onClick={() => toggle(c)} className={buttonClass("secondary", "sm")}>
                  {c.isActive ? "Hide" : "Show"}
                </button>
                <button type="button" disabled={pending} onClick={() => setDraft(toDraft(c))} className={buttonClass("secondary", "sm")}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
