"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ImageOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Toggle } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import { storeSlug } from "@/core/store";
import { AdminDialog } from "@/features/admin/components/admin-dialog";
import { deleteStoreCollection, saveStoreCollection } from "../admin-actions";
import type { AdminStoreCollection, AdminStoreCollectionDetail, AdminStoreProductRow } from "../types";
import { DialogButtons, EmptyNote, ErrorNote, iconButton } from "./seller-ui";
import { ProductStateBadge, StockBadge } from "./store-labels";
import { useStoreAction } from "./use-store-action";

const MAX_PRODUCTS = 60;

interface Draft {
  id?: string;
  title: string;
  slug: string;
  subtitle: string;
  image: string | null;
  isActive: boolean;
  sort: number;
}

const toDraft = (c: AdminStoreCollection): Draft => ({ id: c.id, title: c.title, slug: c.slug, subtitle: c.subtitle, image: c.image, isActive: c.isActive, sort: c.sort });

/** Curated rails on the store home: create, rename, show or hide, reorder and remove. */
export function CollectionManager({ collections }: { collections: AdminStoreCollection[] }) {
  const { pending, error, setError, run } = useStoreAction();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<AdminStoreCollection | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  function save(d: Draft) {
    run(() => saveStoreCollection(d), { success: d.id ? "Collection saved" : "Collection added. Now add its products.", onOk: () => setDraft(null) });
  }

  /** Moves one row and renumbers every row that changed, in steps of 10. */
  function moveBy(index: number, step: -1 | 1) {
    const order = [...collections];
    const [row] = order.splice(index, 1);
    order.splice(index + step, 0, row!);
    const changed = order.map((c, i) => ({ c, sort: (i + 1) * 10 })).filter(({ c, sort }) => c.sort !== sort);
    run(
      async () => {
        for (const { c, sort } of changed) {
          const res = await saveStoreCollection({ ...toDraft(c), sort });
          if (!res.ok) return res;
        }
        return { ok: true as const };
      },
      { toastError: true }
    );
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
        <h2 className="text-base font-semibold text-ink">{draft.id ? `Edit ${draft.title}` : "New collection"}</h2>
        <Field label="Title" htmlFor="co-title" hint="Shown above the rail, e.g. Rainy-day builds.">
          <Input id="co-title" required minLength={2} maxLength={60} autoFocus value={draft.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Subtitle" htmlFor="co-sub" hint="Optional, up to 140 characters.">
          <Input id="co-sub" maxLength={140} value={draft.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
        </Field>
        <Field label="Web address" htmlFor="co-slug" hint={`Leave blank to make one from the title. Page: /app/kids/shop/c/${draft.slug || storeSlug(draft.title) || "…"}`}>
          <Input
            id="co-slug"
            maxLength={80}
            autoCapitalize="none"
            spellCheck={false}
            value={draft.slug}
            onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
            placeholder={storeSlug(draft.title)}
          />
        </Field>
        <ImageUpload label="Cover image" hint="Optional. Wide images work best." value={draft.image} onChange={(url) => set("image", url)} />
        <Toggle id="co-active" label="Show on the store home" checked={draft.isActive} onChange={(v) => set("isActive", v)} />
        <ErrorNote>{error}</ErrorNote>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass("primary", "lg")}>
            {pending ? "Saving…" : draft.id ? "Save collection" : "Add collection"}
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
        onClick={() => setDraft({ title: "", slug: "", subtitle: "", image: null, isActive: true, sort: (collections.at(-1)?.sort ?? 0) + 10 })}
        className={buttonClass("primary", "md")}
      >
        <Plus className="h-4 w-4" aria-hidden="true" /> Add collection
      </button>

      {collections.length === 0 ? (
        <EmptyNote title="No collections yet" body="A collection is a hand-picked row of products on the store home, like Gifts under ₹500. Add one, then pick its products." />
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface" aria-busy={pending}>
          {collections.map((c, i) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="flex gap-1">
                <button type="button" disabled={pending || i === 0} onClick={() => moveBy(i, -1)} className={iconButton} aria-label={`Move ${c.title} up`}>
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" disabled={pending || i === collections.length - 1} onClick={() => moveBy(i, 1)} className={iconButton} aria-label={`Move ${c.title} down`}>
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
              <span className="min-w-0 flex-1 basis-48">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink">{c.title}</span>
                  <Badge tone={c.isActive ? "good" : "neutral"}>{c.isActive ? "Showing" : "Hidden"}</Badge>
                  {c.productCount === 0 && <Badge tone="warn">Empty: not shown</Badge>}
                </span>
                <span className="block truncate text-xs text-muted">
                  /c/{c.slug} · <span className="tabular-nums">{c.productCount}</span> {c.productCount === 1 ? "product" : "products"}
                </span>
              </span>
              <span className="flex flex-wrap gap-2">
                <Link href={`/seller-portal/collections/${c.id}`} className={buttonClass("secondary", "sm")}>
                  Products
                </Link>
                <button type="button" disabled={pending} onClick={() => setDraft(toDraft(c))} className={buttonClass("secondary", "sm")}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                </button>
                <button type="button" disabled={pending} onClick={() => setRemoving(c)} className={iconButton} aria-label={`Remove ${c.title}`}>
                  <Trash2 className="h-4 w-4 text-bad" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <AdminDialog
        open={!!removing}
        onClose={() => !pending && setRemoving(null)}
        busy={pending}
        icon={<Trash2 className="h-5 w-5" />}
        title={`Remove ${removing?.title ?? "collection"}?`}
        description="The rail disappears from the store. Its products stay in the catalogue."
      >
        <DialogButtons
          pending={pending}
          danger
          dismiss="Keep it"
          confirm="Remove collection"
          busyText="Removing…"
          onCancel={() => setRemoving(null)}
          onConfirm={() =>
            removing && run(() => deleteStoreCollection({ collectionId: removing.id }), { toastError: true, success: "Collection removed", onOk: () => setRemoving(null) })
          }
        />
      </AdminDialog>
    </div>
  );
}

function Thumb({ src }: { src: string | null }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- admin uploads from any host
    <img src={src} alt="" className="h-12 w-12 shrink-0 rounded-[10px] border border-line object-cover" />
  ) : (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-app-canvas text-muted" aria-hidden="true">
      <ImageOff className="h-4 w-4" />
    </span>
  );
}

/**
 * The products in one rail, in the order households see them. Every move, add
 * and remove saves straight away, so there is no unsaved state to lose.
 */
export function CollectionProducts({ collection, candidates }: { collection: AdminStoreCollectionDetail; candidates: AdminStoreProductRow[] }) {
  const { pending, run } = useStoreAction();
  const ids = collection.products.map((p) => p.id);
  const full = ids.length >= MAX_PRODUCTS;

  function saveOrder(productIds: string[], success: string | undefined) {
    run(
      () =>
        saveStoreCollection({
          id: collection.id,
          title: collection.title,
          slug: collection.slug,
          subtitle: collection.subtitle,
          image: collection.image,
          isActive: collection.isActive,
          sort: collection.sort,
          productIds,
        }),
      { toastError: true, success }
    );
  }

  function move(index: number, step: -1 | 1) {
    const next = [...ids];
    const [id] = next.splice(index, 1);
    next.splice(index + step, 0, id!);
    saveOrder(next, undefined);
  }

  const addable = candidates.filter((p) => !ids.includes(p.id));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section aria-labelledby="rail-h" className="min-w-0 rounded-card border border-line bg-surface">
        <h2 id="rail-h" className="border-b border-line px-4 py-3 text-base font-semibold text-ink">
          In this collection <span className="tabular-nums text-muted">({ids.length} of {MAX_PRODUCTS})</span>
        </h2>
        {collection.products.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">No products yet. Search on the right and add the first one.</p>
        ) : (
          <ol className="divide-y divide-line" aria-busy={pending}>
            {collection.products.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted">{i + 1}</span>
                <Thumb src={p.image} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                  <span className="mt-0.5 flex flex-wrap gap-1">
                    <ProductStateBadge isActive={p.isActive} archivedAt={p.archivedAt} />
                    <StockBadge kind={p.stockKind} stock={p.stock} />
                  </span>
                </span>
                <span className="flex shrink-0 gap-1">
                  <button type="button" disabled={pending || i === 0} onClick={() => move(i, -1)} className={iconButton} aria-label={`Move ${p.name} earlier`}>
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" disabled={pending || i === ids.length - 1} onClick={() => move(i, 1)} className={iconButton} aria-label={`Move ${p.name} later`}>
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => saveOrder(ids.filter((id) => id !== p.id), `${p.name} removed`)}
                    className={iconButton}
                    aria-label={`Remove ${p.name} from the collection`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="add-h" className="min-w-0 rounded-card border border-line bg-surface">
        <h2 id="add-h" className="border-b border-line px-4 py-3 text-base font-semibold text-ink">Add products</h2>
        <form role="search" action={`/seller-portal/collections/${collection.id}`} className="flex gap-2 border-b border-line p-3">
          <label htmlFor="cp-q" className="sr-only">
            Search products
          </label>
          <Input id="cp-q" name="q" type="search" placeholder="Name, SKU or brand" />
          <button type="submit" className={buttonClass("secondary", "md")}>
            Search
          </button>
        </form>
        {full ? (
          <p className="px-4 py-6 text-sm text-muted">This collection is full. Remove a product to add another.</p>
        ) : addable.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">No other products match. Try another search.</p>
        ) : (
          <ul className="divide-y divide-line">
            {addable.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <Thumb src={p.image} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {p.sku} · {p.categoryName}
                  </span>
                </span>
                <button type="button" disabled={pending} onClick={() => saveOrder([...ids, p.id], `${p.name} added`)} className={buttonClass("secondary", "sm")}>
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
