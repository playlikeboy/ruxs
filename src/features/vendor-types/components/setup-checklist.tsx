import Link from "next/link";
import { Check } from "lucide-react";
import { AppIcon } from "@/components/ui/app-icon";
import { getSetupChecklist } from "../queries";

/**
 * "Get ready to sell" card on Today. Disappears once every step is done, so a
 * newly onboarded merchant knows exactly what is missing before going live.
 */
export async function SetupChecklist({ slug }: { slug: string }) {
  const data = await getSetupChecklist(slug);
  if (!data) return null;
  const { type, info, vendor: v, booking, kidsClasses, catalogueCount, hoursCount, profileFieldCount, filledFields: filled } = data;

  const base = `/merchant-panel/${slug}`;
  const steps = [
    { done: v.latitude != null && v.longitude != null, label: "Pin your exact location", hint: "Households within reach find you by distance.", href: `${base}/settings` },
    { done: filled >= Math.ceil(profileFieldCount / 2), label: `Complete your ${info.label.toLowerCase()} profile`, hint: `${filled} of ${profileFieldCount} details filled.`, href: `${base}/settings` },
    {
      done: catalogueCount > 0,
      label: `Add your first ${info.nouns.catalogueShort.toLowerCase().replace(/s$/, "")}`,
      hint: "Nothing shows in the app until you list something.",
      href: `${base}/${kidsClasses ? "kids" : booking ? "services" : "products"}`,
    },
    ...(booking ? [{ done: hoursCount > 0, label: "Set your weekly hours", hint: "Clients can only book open slots.", href: `${base}/availability` }] : []),
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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-peach text-accent" aria-hidden="true"><AppIcon name={type} /></span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg" aria-hidden="true">
        <div className="h-full rounded-full bg-good transition-all motion-reduce:transition-none" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-3 divide-y divide-line">
        {steps.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="flex items-center gap-3 rounded-[8px] py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              <span className={"flex h-6 w-6 shrink-0 items-center justify-center rounded-full border " + (s.done ? "border-good bg-good text-white" : "border-line text-transparent")}>
                <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="sr-only">{s.done ? "Done: " : "To do: "}</span>
                <span className={"block text-sm font-medium " + (s.done ? "text-muted line-through" : "text-ink")}>{s.label}</span>
                {!s.done && <span className="block text-xs text-muted">{s.hint}</span>}
              </span>
              {!s.done && (
                <span className="text-xs font-semibold text-accent" aria-hidden="true">
                  Do it →
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
