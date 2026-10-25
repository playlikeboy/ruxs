import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { formatINR } from "@/core/money";
import { requireVendorModule } from "@/lib/auth/session";
import { VENDOR_TYPE_INFO } from "@/core/vendor-types";
import { getMenuForVendor } from "@/features/products/queries";
import { AvailabilitySwitch } from "@/features/products/components/menu-item-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "Catalogue" };

const OTHER = "Other items";

export default async function MenuPage({ params, searchParams }: { params: Promise<{ vendor: string }>; searchParams: Promise<{ section?: string }> }) {
  const [{ vendor: slug }, { section: picked }] = await Promise.all([params, searchParams]);
  const access = await requireVendorModule(slug, "products");
  const info = VENDOR_TYPE_INFO[access.vendorType];
  const { rows, role } = await getMenuForVendor(slug);
  const isOwner = role === "owner";
  const base = `/merchant-panel/${slug}/products`;

  const groups = new Map<string, typeof rows>();
  for (const p of rows) {
    const key = p.section || OTHER;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  const sections = Array.from(groups.keys());
  const active = picked && groups.has(picked) ? picked : null;
  const shown = active ? [[active, groups.get(active)!] as const] : Array.from(groups.entries());
  const newHref = `${base}/new${active && active !== OTHER ? `?section=${encodeURIComponent(active)}` : ""}`;
  const chip = (on: boolean) => "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium " + (on ? "bg-ink text-white" : "border border-line bg-surface text-ink/80 hover:border-ink/30");

  return (
    <div className="space-y-5 px-4 py-5 sm:px-6">
      <PageHeader
        eyebrow={info.label}
        title={info.nouns.catalogue}
        description={`${rows.length} items on your store`}
        action={isOwner ? <Link href={newHref} className={buttonClass("primary", "md")}><Plus className="h-4 w-4" aria-hidden="true" /> New item</Link> : undefined}
      />

      {rows.length === 0 ? (
        <EmptyState
          title={`Your ${info.nouns.catalogue.toLowerCase()} is empty`}
          description="Add your first item. Offer it for one-time orders, subscriptions, or both."
          action={isOwner ? <Link href={`${base}/new`} className={buttonClass("primary", "md")}>Add first item</Link> : undefined}
        />
      ) : (
        <>
          {sections.length > 1 && (
            <nav aria-label="Menu sections" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              <Link href={base} className={chip(!active)} aria-current={!active ? "page" : undefined}>All ({rows.length})</Link>
              {sections.map((s) => (
                <Link key={s} href={`${base}?section=${encodeURIComponent(s)}`} className={chip(active === s)} aria-current={active === s ? "page" : undefined}>
                  {s} ({groups.get(s)!.length})
                </Link>
              ))}
            </nav>
          )}
          {shown.map(([title, items]) => (
            <section key={title} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted">{title}</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface">
                {items.map((p) => (
                  <li key={p.id} className={"flex items-center gap-3 p-3 " + (p.isAvailable ? "" : "bg-bg")}>
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- merchant-uploaded image host
                      <img src={p.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-[10px] object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-app-canvas text-xs text-muted" aria-hidden="true">{p.name.slice(0, 1)}</span>
                    )}
                    <Link href={isOwner ? `${base}/${p.id}` : base} className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                        {p.isVeg != null && <span className={"h-2 w-2 shrink-0 rounded-full " + (p.isVeg ? "bg-good" : "bg-bad")} aria-label={p.isVeg ? "Veg" : "Non-veg"} />}
                        <span className="truncate">{p.name}</span>
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {formatINR(p.pricePaise)} · {[p.allowOneTime && "Order", p.allowSubscription && "Subscribe"].filter(Boolean).join(" + ")} · {p.shift}, by {p.cutoffAt}
                      </span>
                    </Link>
                    <AvailabilitySwitch slug={slug} id={p.id} isAvailable={p.isAvailable} />
                    {isOwner && <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
