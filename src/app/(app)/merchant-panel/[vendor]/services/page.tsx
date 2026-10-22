import { requireVendorModule } from "@/lib/auth/session";
import { VENDOR_TYPE_INFO, allowedCategoryIds } from "@/core/vendor-types";
import { getMyItemDetails } from "@/features/vendor-types/queries";
import { ITEM_FIELDS, chipsFor } from "@/features/vendor-types/fields";
import { TypeFieldsForm } from "@/features/vendor-types/components/type-fields-form";
import { CalendarClock } from "lucide-react";
import { formatINR } from "@/core/money";
import { MODE_LABEL } from "@/core/booking";
import { getProviderServices } from "@/features/bookings/queries";
import { getCategories } from "@/features/platform/queries";
import { ArchiveServiceButton, ServiceForm } from "@/features/bookings/components/service-form";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Services" };

export default async function ServicesPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const { vendorType: type } = await requireVendorModule(slug, "services");
  const info = VENDOR_TYPE_INFO[type];
  const [{ access, rows }, all] = await Promise.all([getProviderServices(slug), getCategories()]);
  const allowed = allowedCategoryIds(type, access.vendor.categoryId);
  const categories = all.filter((c) => allowed.includes(c.id)).map((c) => ({ id: c.id, emoji: c.emoji, label: c.label }));
  const { details } = await getMyItemDetails(slug, rows.map((r) => r.service.id));
  const itemFields = ITEM_FIELDS[type];
  const isOwner = access.role === "owner";

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">{info.emoji} {info.label}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{info.nouns.catalogue}</h1>
          <p className="mt-0.5 text-sm text-muted">The sessions clients can book with you. Times come from your Availability.</p>
        </div>
        {isOwner && <ServiceForm slug={slug} categories={categories} />}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No services yet" description={`Add your first ${info.nouns.catalogueShort.toLowerCase().replace(/s$/, "")}. Clients book it in open slots from your hours.`} action={isOwner ? <ServiceForm slug={slug} categories={categories} triggerLabel="Add first service" /> : undefined} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ service: s, category: c }) => (
            <li key={s.id} className={"flex flex-col justify-between rounded-[14px] border border-line p-4 " + (s.isActive ? "bg-surface" : "bg-bg opacity-80")}>
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted">{c.emoji} {c.label}</p>
                    <p className="mt-0.5 font-semibold text-ink">{s.name}</p>
                  </div>
                  <p className="shrink-0 font-mono text-base font-bold tabular-nums">{formatINR(s.pricePaise)}</p>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted"><CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> {s.durationMinutes} min</p>
                {s.description && <p className="mt-2 line-clamp-2 text-xs text-muted">{s.description}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium">
                  {s.modes.map((m) => <span key={m} className="rounded-full bg-bg px-2 py-0.5 text-muted">{MODE_LABEL[m] ?? m}</span>)}
                  {!s.isActive && <span className="rounded-full bg-blush px-2 py-0.5 text-bad">Paused</span>}
                  {itemFields && chipsFor(itemFields, details.get(s.id)).map((chip) => (
                    <span key={chip} className="rounded-full bg-butter/70 px-2 py-0.5 text-warn">{chip}</span>
                  ))}
                </div>
                {isOwner && itemFields && (
                  <details className="group mt-3 rounded-control border border-line bg-bg/60 px-3 py-2">
                    <summary className="cursor-pointer list-none text-xs font-semibold text-ink">
                      {info.emoji} {info.label} details <span className="text-muted group-open:hidden">· edit</span>
                    </summary>
                    <div className="pt-3">
                      <TypeFieldsForm slug={slug} type={type} itemId={s.id} initial={details.get(s.id) ?? {}} submitLabel="Save details" compact />
                    </div>
                  </details>
                )}
              </div>
              {isOwner && (
                <div className="mt-3 flex items-center justify-end gap-4">
                  <ArchiveServiceButton slug={slug} id={s.id} name={s.name} />
                  <ServiceForm slug={slug} categories={categories} service={s} triggerLabel="Edit" triggerClassName="text-xs font-semibold text-accent" />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
