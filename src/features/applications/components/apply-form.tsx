"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { submitVendorApplication } from "@/features/applications/actions";

type Category = { id: string; label: string; blurb: string };

const input = "min-h-12 w-full rounded-[12px] border border-line bg-surface px-3.5 text-base text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
const label = "mb-1.5 block text-sm font-medium text-ink";

/** One short form. No account: we call to verify, then send your login. */
export function ApplyForm({ categories }: { categories: Category[] }) {
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | { duplicate: boolean }>(null);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div role="status" className="rounded-[16px] border border-line bg-surface p-6">
        <CheckCircle2 className="h-8 w-8 text-good" aria-hidden="true" />
        <h2 className="mt-3 text-xl font-semibold text-ink">{done.duplicate ? "We already have your application" : "Application received"}</h2>
        <p className="mt-2 text-base leading-relaxed text-[#4A463F]">
          Our team will call you within two working days to verify your business. Once verified, you get a login ID and password for the merchant panel.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const get = (k: string) => String(fd.get(k) ?? "");
        setError(null);
        startTransition(async () => {
          const res = await submitVendorApplication({
            businessName: get("businessName"),
            ownerName: get("ownerName"),
            phone: get("phone"),
            email: get("email"),
            categoryId,
            area: get("area"),
            city: get("city"),
            details: get("details"),
            website: get("website"),
          });
          if (!res.ok) setError(res.error);
          else setDone({ duplicate: res.duplicate });
        });
      }}
    >
      <fieldset>
        <legend className={label}>What do you offer?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories.map((c) => (
            <label
              key={c.id}
              className={cn(
                "flex min-h-12 cursor-pointer items-center rounded-[12px] border px-3 py-2 text-sm font-medium transition-colors",
                categoryId === c.id ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink hover:border-ink/40"
              )}
            >
              <input type="radio" name="categoryId" value={c.id} checked={categoryId === c.id} onChange={() => setCategoryId(c.id)} className="sr-only" required />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="businessName" className={label}>Business name</label><input id="businessName" name="businessName" required maxLength={80} className={input} autoComplete="organization" /></div>
        <div><label htmlFor="ownerName" className={label}>Your name</label><input id="ownerName" name="ownerName" required maxLength={60} className={input} autoComplete="name" /></div>
        <div><label htmlFor="phone" className={label}>Mobile number</label><input id="phone" name="phone" required inputMode="tel" placeholder="98765 43210" className={input} autoComplete="tel" /></div>
        <div><label htmlFor="email" className={label}>Email <span className="text-muted">(optional)</span></label><input id="email" name="email" type="email" maxLength={120} className={input} autoComplete="email" /></div>
        <div><label htmlFor="area" className={label}>Area / locality</label><input id="area" name="area" required maxLength={60} className={input} /></div>
        <div><label htmlFor="city" className={label}>City</label><input id="city" name="city" required maxLength={40} className={input} autoComplete="address-level2" /></div>
      </div>
      <div>
        <label htmlFor="details" className={label}>Anything we should know? <span className="text-muted">(optional)</span></label>
        <textarea id="details" name="details" rows={3} maxLength={600} placeholder="What you sell or teach, timings, how many homes you serve" className={input + " py-3"} />
      </div>
      {/* Honeypot: hidden from people, filled by bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {error && <p role="alert" className="rounded-[12px] bg-blush px-3.5 py-2.5 text-sm font-medium text-bad">{error}</p>}
      <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center rounded-[12px] bg-accent px-6 text-base font-semibold text-white transition-colors hover:bg-[#A53F22] disabled:opacity-60 sm:w-auto">
        {pending ? "Sending…" : "Send application"}
      </button>
      <p className="text-sm text-muted">No account needed. We call you to verify, then send your login.</p>
    </form>
  );
}
