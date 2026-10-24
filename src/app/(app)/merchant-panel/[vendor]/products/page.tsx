import { formatINR } from "@/core/money";
import { requireVendorModule } from "@/lib/auth/session";
import { VENDOR_TYPE_INFO, allowedCategoryIds } from "@/core/vendor-types";
import { getMyItemDetails } from "@/features/vendor-types/queries";
import { ITEM_FIELDS, chipsFor } from "@/features/vendor-types/fields";
import { TypeFieldsForm } from "@/features/vendor-types/components/type-fields-form";
import { getCategories, getCategoryMap } from "@/features/platform/queries";
import { getMenuForVendor } from "@/features/products/queries";
import { ProductFormDialog } from "@/features/products/components/product-form-dialog";
import { ArchiveButton, AvailabilitySwitch } from "@/features/products/components/menu-item-actions";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Catalogue" };

export default async function MenuPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const access = await requireVendorModule(slug, "products");
  const type = access.vendorType;
  const info = VENDOR_TYPE_INFO[type];
  const allowed = allowedCategoryIds(type, access.vendor.categoryId);
  const [{ rows, role }, categoryList, category] = await Promise.all([getMenuForVendor(slug), getCategories(), getCategoryMap()]);
  // Only the vendor's own category: a tiffin kitchen never sees "Water" in its form.
  const categories = categoryList.filter((c) => allowed.includes(c.id)).map((c) => ({ id: c.id, emoji: c.emoji, shortLabel: c.shortLabel }));
  const { details } = await getMyItemDetails(slug, rows.map((r) => r.id));
  const itemFields = ITEM_FIELDS[type];
  const isOwner = role === "owner";

  const groups = new Map<string, typeof rows>();
  for (const p of rows) {
    const key = category(p.kind).label;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">{info.label}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{info.nouns.catalogue}</h1>
          <p className="mt-0.5 text-sm text-muted">{rows.length} items · what households see on your store</p>
        </div>
        {isOwner && <ProductFormDialog slug={slug} categories={categories} />}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={`Your ${info.nouns.catalogue.toLowerCase()} is empty`}
          description="Add your first item. You can offer it for one-time orders, subscriptions, or both."
          action={isOwner ? <ProductFormDialog slug={slug} categories={categories} triggerLabel="Add first item" /> : undefined}
        />
      ) : (
        Array.from(groups.entries()).map(([title, items]) => (
          <section key={title} className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{title}</h2>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((p) => (
                <li key={p.id} className={"flex flex-col justify-between space-y-2.5 rounded-[14px] border border-line p-4 " + (p.isAvailable ? "bg-surface" : "bg-bg opacity-80")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-semibold text-ink">
                        {p.isVeg != null && <span className={"h-2.5 w-2.5 shrink-0 rounded-full " + (p.isVeg ? "bg-good" : "bg-bad")} aria-label={p.isVeg ? "Veg" : "Non-veg"} />}
                        <span className="truncate">{p.name}</span>
                      </p>
                      {p.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{p.description}</p>}
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-medium">
                        {p.section && <span className="rounded-full bg-bg px-2 py-0.5 text-muted">{p.section}</span>}
                        {p.allowOneTime && <span className="rounded-full bg-sky px-2 py-0.5 text-[#1F5C99]">Order</span>}
                        {p.allowSubscription && <span className="rounded-full bg-mint px-2 py-0.5 text-good">Subscribe</span>}
                        <span className="rounded-full bg-bg px-2 py-0.5 capitalize text-muted">{p.shift} · cutoff {p.cutoffAt}</span>
                        {p.assetName && <span className="rounded-full bg-bg px-2 py-0.5 text-muted">{p.assetName}{p.depositPaise > 0 ? ` · ${formatINR(p.depositPaise)} dep.` : ""}</span>}
                        {itemFields && chipsFor(itemFields, details.get(p.id)).map((c) => (
                          <span key={c} className="rounded-full bg-butter/70 px-2 py-0.5 text-warn">{c}</span>
                        ))}
                      </div>
                    </div>
                    <p className="shrink-0 font-mono text-base font-bold tabular-nums text-ink">{formatINR(p.pricePaise)}</p>
                  </div>
                  {isOwner && itemFields && (
                    <details className="group rounded-control border border-line bg-bg/60 px-3 py-2">
                      <summary className="cursor-pointer list-none text-xs font-semibold text-ink">
                        {info.label} details <span className="text-muted group-open:hidden">· edit</span>
                      </summary>
                      <div className="pt-3">
                        <TypeFieldsForm slug={slug} type={type} itemId={p.id} initial={details.get(p.id) ?? {}} submitLabel="Save details" compact />
                      </div>
                    </details>
                  )}
                  <div className="flex items-center justify-between">
                    <AvailabilitySwitch slug={slug} id={p.id} isAvailable={p.isAvailable} />
                    {isOwner && (
                      <div className="flex items-center gap-4">
                        <ArchiveButton slug={slug} id={p.id} name={p.name} />
                        <ProductFormDialog slug={slug} categories={categories} product={p} triggerLabel="Edit" triggerClassName="text-xs font-semibold text-accent" />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
