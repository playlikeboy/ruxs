"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createVendorForAdmin } from "@/features/admin/actions";

type CreatedVendor = {
  slug: string;
  ownerEmail: string;
  inviteText: string;
};

const inputClass =
  "mt-1 w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15";

export function CreateVendorForm() {
  const [isPending, startTransition] = useTransition();
  const [created, setCreated] = useState<CreatedVendor | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    ownerEmail: "",
    phone: "",
    upiVpa: "",
    city: "Bengaluru",
    area: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: field === "slug"
        ? value.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-")
        : value,
    }));
    setCreated(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createVendorForAdmin(form);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCreated({
        slug: result.slug,
        ownerEmail: result.ownerEmail,
        inviteText: result.inviteText,
      });
      toast.success("Vendor created and owner invite prepared");
      setForm({
        name: "",
        slug: "",
        ownerEmail: "",
        phone: "",
        upiVpa: "",
        city: "Bengaluru",
        area: "",
      });
    });
  }

  async function copyInvite() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.inviteText);
      toast.success("Merchant onboarding instructions copied");
    } catch {
      toast.error("Clipboard permission was blocked. Select and copy the instructions below.");
    }
  }

  return (
    <section className="space-y-4 rounded-[14px] border border-line bg-surface p-4 sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Merchant onboarding</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">Create a vendor and owner login</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
          Create the business portal and invite its owner by email. The owner uses that email to sign in or sign up, verifies it, and sets their own password with the hosted authentication flow.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-ink">
          Business name
          <input className={inputClass} required minLength={2} value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Annapurna Tiffin" />
        </label>
        <label className="text-sm font-medium text-ink">
          Portal URL slug
          <input className={inputClass} required minLength={2} pattern="[a-z0-9-]+" value={form.slug} onChange={(event) => update("slug", event.target.value)} placeholder="annapurna-tiffin" />
          <span className="mt-1 block text-xs font-normal text-muted">ruxs.in/app/{form.slug || "your-business"}/today</span>
        </label>
        <label className="text-sm font-medium text-ink">
          Owner login email
          <input className={inputClass} type="email" required value={form.ownerEmail} onChange={(event) => update("ownerEmail", event.target.value)} placeholder="owner@example.com" />
        </label>
        <label className="text-sm font-medium text-ink">
          Business mobile
          <input className={inputClass} type="tel" required pattern="\\+91[6-9][0-9]{9}" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+919876543210" />
        </label>
        <label className="text-sm font-medium text-ink">
          Business UPI ID
          <input className={inputClass} required value={form.upiVpa} onChange={(event) => update("upiVpa", event.target.value)} placeholder="business@upi" />
        </label>
        <label className="text-sm font-medium text-ink">
          City
          <input className={inputClass} required minLength={2} value={form.city} onChange={(event) => update("city", event.target.value)} />
        </label>
        <label className="text-sm font-medium text-ink sm:col-span-2">
          Area or locality
          <input className={inputClass} required minLength={2} value={form.area} onChange={(event) => update("area", event.target.value)} placeholder="HSR Layout, Sector 2" />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Creating vendor…" : "Create vendor and owner invite"}
          </button>
        </div>
      </form>

      {created && (
        <div className="space-y-3 rounded-[12px] border border-good/30 bg-mint p-4">
          <div>
            <p className="text-sm font-semibold text-ink">Vendor created successfully</p>
            <p className="mt-1 text-sm text-muted">Login ID: <span className="font-semibold text-ink">{created.ownerEmail}</span></p>
            <p className="text-sm text-muted">Portal: <span className="font-semibold text-ink">/app/{created.slug}/today</span></p>
          </div>
          <label className="block text-sm font-medium text-ink">
            Copyable onboarding instructions
            <textarea readOnly rows={6} className="mt-1 w-full rounded-[10px] border border-line bg-white p-3 text-sm leading-6 text-ink" value={created.inviteText} />
          </label>
          <button type="button" onClick={copyInvite} className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-bg">
            Copy owner instructions
          </button>
          <p className="text-xs leading-5 text-muted">RUXS never displays or stores a merchant password. The owner sets it through the secure hosted sign-in flow.</p>
        </div>
      )}
    </section>
  );
}
