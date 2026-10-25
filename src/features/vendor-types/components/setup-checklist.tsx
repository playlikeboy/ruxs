import { AppIcon } from "@/components/ui/app-icon";
import Link from "next/link";
import { and, count, eq, isNull } from "drizzle-orm";
import { Check } from "lucide-react";
import { getDb } from "@/db";
import { availabilityRules, kidsServices, products, services } from "@/db/schema";
import { requireVendorModule } from "@/lib/auth/session";
import { canUseModule, VENDOR_TYPE_INFO } from "@/core/vendor-types";
import { PROFILE_FIELDS } from "../fields";
import { readTypeProfile } from "../tables";

/**
 * "Get ready to sell" card on Today. Disappears once every step is done, so a
 * newly onboarded merchant knows exactly what is missing before going live.
 */
export async function SetupChecklist({ slug }: { slug: string }) {
  const access = await requireVendorModule(slug, "today");
  if (access.role !== "owner") return null;
  const type = access.vendorType;
  const info = VENDOR_TYPE_INFO[type];
  const v = access.vendor;
  const db = getDb();
  const booking = info.fulfilment === "booking";
  const kidsClasses = canUseModule(type, "kids");

  const catalogueQuery =
    kidsClasses
      ? db.select({ n: count() }).from(kidsServices).where(and(eq(kidsServices.vendorId, v.id), isNull(kidsServices.archivedAt)))
      : booking
        ? db.select({ n: count() }).from(services).where(and(eq(services.vendorId, v.id), isNull(services.archivedAt)))
        : db.select({ n: count() }).from(products).where(and(eq(products.vendorId, v.id), isNull(products.archivedAt)));

  const [[catalogue], [hours], profile] = await Promise.all([
    catalogueQuery,
    booking ? db.select({ n: count() }).from(availabilityRules).where(eq(availabilityRules.vendorId, v.id)) : Promise.resolve([{ n: 1 }]),
    readTypeProfile(db, v.id, type),
  ]);

  const fields = PROFILE_FIELDS[type].filter((f) => f.kind !== "bool");
  const filled = fields.filter((f) => {
    const value = profile?.[f.key];
    return value != null && value !== "" && !(Array.isArray(value) && value.length === 0);
  }).length;

  const base = `/merchant-panel/${slug}`;
  const steps = [
    { done: v.latitude != null && v.longitude != null, label: "Pin your exact location", hint: "Households within reach find you by distance.", href: `${base}/settings` },
    { done: filled >= Math.ceil(fields.length / 2), label: `Complete your ${info.label.toLowerCase()} profile`, hint: `${filled} of ${fields.length} details filled.`, href: `${base}/settings` },
    {
      done: (catalogue?.n ?? 0) > 0,
      label: `Add your first ${info.nouns.catalogueShort.toLowerCase().replace(/s$/, "")}`,
      hint: "Nothing shows in the app until you list something.",
      href: `${base}/${kidsClasses ? "kids" : booking ? "services" : "products"}`,
    },
    ...(booking ? [{ done: (hours?.n ?? 0) > 0, label: "Set your weekly hours", hint: "Clients can only book open slots.", href: `${base}/availability` }] : []),
    { done: !!v.upiVpa, label: "Add your UPI ID", hint: "Where RUXs sends your online earnings.", href: `${base}/settings` },
    { done: !!v.description && v.description.length >= 20, label: "Write a short description", hint: "One or two lines about what makes you good.", href: `${base}/settings` },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length && v.status === "active") return null;

  return (
    <section aria-labelledby="setup-heading" className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="setup-heading" className="text-base font-semibold text-ink">
            {v.status === "pending" ? "Get ready while we review you" : "Finish setting up"}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {done} of {steps.length} done{v.status === "pending" ? " · RUXs approves new merchants within a day" : ""}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-peach text-accent"><AppIcon name={type} /></span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg" aria-hidden="true">
        <div className="h-full rounded-full bg-good transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-3 divide-y divide-line">
        {steps.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="flex items-center gap-3 py-2.5">
              <span className={"flex h-6 w-6 shrink-0 items-center justify-center rounded-full border " + (s.done ? "border-good bg-good text-white" : "border-line text-transparent")}>
                <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={"block text-sm font-medium " + (s.done ? "text-muted line-through" : "text-ink")}>{s.label}</span>
                {!s.done && <span className="block text-xs text-muted">{s.hint}</span>}
              </span>
              {!s.done && <span className="text-xs font-semibold text-accent">Do it →</span>}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
