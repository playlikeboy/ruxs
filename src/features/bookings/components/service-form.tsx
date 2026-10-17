"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { archiveService, saveService } from "@/features/bookings/actions";

export interface ServiceCategory {
  id: string;
  emoji: string;
  label: string;
}

export interface EditableService {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  durationMinutes: number;
  pricePaise: number;
  modes: string[];
  isActive: boolean;
}

const input = "w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent";
const label = "mb-1 block text-xs font-medium text-ink";
const MODES = [
  { id: "home", label: "Home visit" },
  { id: "studio", label: "At gym / clinic" },
  { id: "online", label: "Online" },
];

export function ServiceForm({
  slug,
  categories,
  service,
  triggerLabel = "+ Add service",
  triggerClassName = "shrink-0 whitespace-nowrap rounded-[10px] bg-accent px-3.5 py-2 text-sm font-semibold text-white",
}: {
  slug: string;
  categories: ServiceCategory[];
  service?: EditableService;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    categoryId: service?.categoryId ?? categories[0]?.id ?? "",
    name: service?.name ?? "",
    description: service?.description ?? "",
    imageUrl: service?.imageUrl ?? "",
    durationMinutes: String(service?.durationMinutes ?? 60),
    price: service ? String(service.pricePaise / 100) : "",
    modes: service?.modes ?? ["home"],
    isActive: service?.isActive ?? true,
  });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {triggerLabel}
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="service-title">
            <form
              className="max-h-[92dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-[20px] bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-[16px]"
              onSubmit={(e) => {
                e.preventDefault();
                const priceRupees = Number(f.price);
                if (!Number.isFinite(priceRupees) || priceRupees < 0) return toast.error("Enter a valid price");
                startTransition(async () => {
                  const res = await saveService({
                    slug,
                    id: service?.id,
                    categoryId: f.categoryId,
                    name: f.name,
                    description: f.description,
                    imageUrl: f.imageUrl,
                    durationMinutes: Number(f.durationMinutes),
                    priceRupees,
                    modes: f.modes,
                    isActive: f.isActive,
                  });
                  if (!res.ok) toast.error(res.error);
                  else {
                    toast.success(service ? "Service updated" : "Service added");
                    setOpen(false);
                    router.refresh();
                  }
                });
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 id="service-title" className="text-lg font-semibold text-ink">{service ? "Edit service" : "New service"}</h3>
                  <p className="text-xs text-muted">Clients book this as a timed session from your free hours.</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1.5 text-muted hover:bg-bg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button key={c.id} type="button" onClick={() => setF({ ...f, categoryId: c.id })} aria-pressed={f.categoryId === c.id} className={"rounded-[10px] border px-3 py-2 text-xs font-semibold " + (f.categoryId === c.id ? "border-accent bg-peach text-accent" : "border-line text-muted")}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label htmlFor="sv-name" className={label}>Service name</label>
                <input id="sv-name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Personal training (60 min)" className={input} />
              </div>
              <div>
                <label htmlFor="sv-desc" className={label}>What&apos;s included</label>
                <textarea id="sv-desc" rows={2} maxLength={400} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Assessment, workout plan, equipment brought along" className={input} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sv-dur" className={label}>Session length</label>
                  <select id="sv-dur" value={f.durationMinutes} onChange={(e) => setF({ ...f, durationMinutes: e.target.value })} className={input}>
                    {[30, 45, 60, 75, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="sv-price" className={label}>Price (₹)</label>
                  <input id="sv-price" required inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="599" className={input + " tabular-nums"} />
                </div>
              </div>
              <fieldset>
                <legend className={label}>Where you offer it</legend>
                <div className="flex flex-wrap gap-2">
                  {MODES.map((m) => {
                    const on = f.modes.includes(m.id);
                    return (
                      <label key={m.id} className={"flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2 text-sm " + (on ? "border-ink bg-bg font-semibold" : "border-line")}>
                        <input type="checkbox" checked={on} onChange={() => setF({ ...f, modes: on ? f.modes.filter((x) => x !== m.id) : [...f.modes, m.id] })} className="h-4 w-4 accent-[#BD4B2A]" />
                        {m.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div>
                <label htmlFor="sv-img" className={label}>Photo link (optional)</label>
                <input id="sv-img" type="url" value={f.imageUrl} onChange={(e) => setF({ ...f, imageUrl: e.target.value })} placeholder="https://…" className={input} />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} className="h-4 w-4 accent-[#BD4B2A]" />
                Bookable now
              </label>
              <button type="submit" disabled={pending} className="w-full rounded-[12px] bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60">
                {pending ? "Saving…" : service ? "Save changes" : "Add service"}
              </button>
            </form>
          </div>,
          document.body
        )}
    </>
  );
}

export function ArchiveServiceButton({ slug, id, name }: { slug: string; id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Remove “${name}”? Existing bookings stay.`)) return;
        startTransition(async () => {
          const res = await archiveService({ slug, id });
          if (!res.ok) toast.error(res.error);
          else {
            toast.success("Service removed");
            router.refresh();
          }
        });
      }}
      className="text-xs font-semibold text-bad disabled:opacity-60"
    >
      Remove
    </button>
  );
}
