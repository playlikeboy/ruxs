"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createVendorForAdmin } from "@/features/admin/actions";

type CreatedVendor = {
  slug: string;
  name: string;
  ownerEmail: string;
  password?: string;
  portalUrl: string;
  loginUrl: string;
  inviteText: string;
};

const inputClass =
  "mt-1 w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15";

export function CreateVendorForm() {
  const [isPending, startTransition] = useTransition();
  const [created, setCreated] = useState<CreatedVendor | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    ownerEmail: "",
    password: "",
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

  function generatePassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*";
    let pwd = "Ruxs!";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    update("password", pwd);
    toast.success("Generated secure password");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createVendorForAdmin({
        ...form,
        password: form.password || undefined,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setCreated({
        slug: result.slug,
        name: result.name,
        ownerEmail: result.ownerEmail,
        password: result.password,
        portalUrl: result.portalUrl,
        loginUrl: result.loginUrl,
        inviteText: result.inviteText,
      });

      toast.success("Vendor created and login credentials generated!");
      setForm({
        name: "",
        slug: "",
        ownerEmail: "",
        password: "",
        phone: "",
        upiVpa: "",
        city: "Bengaluru",
        area: "",
      });
    });
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error("Clipboard permission blocked.");
    }
  }

  return (
    <section className="space-y-4 rounded-[14px] border border-line bg-surface p-4 sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Merchant onboarding</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">Create a vendor and login credentials</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
          Provision the business portal and generate its owner login ID and password. The vendor can log in directly at <span className="font-mono text-ink">ruxs.in/sign-in</span> and start managing orders, inventory, and analytics immediately.
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
          <span className="mt-1 block text-xs font-normal text-muted">ruxs.in/merchant/{form.slug || "your-business"}/today</span>
        </label>

        <label className="text-sm font-medium text-ink">
          Owner login ID (Email)
          <input className={inputClass} type="email" required value={form.ownerEmail} onChange={(event) => update("ownerEmail", event.target.value)} placeholder="owner@example.com" />
        </label>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ink">Owner password</label>
            <button
              type="button"
              onClick={generatePassword}
              className="text-xs font-semibold text-accent hover:underline"
            >
              ⚡ Auto-generate
            </button>
          </div>
          <div className="relative">
            <input
              className={inputClass}
              type={showPassword ? "text" : "password"}
              minLength={8}
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              placeholder="Leave blank to auto-generate"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted hover:text-ink"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <span className="mt-1 block text-xs text-muted">Leave empty to generate a secure random password.</span>
        </div>

        <label className="text-sm font-medium text-ink">
          Business mobile
          <input className={inputClass} type="tel" required pattern="\+91[6-9][0-9]{9}" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+919876543210" />
        </label>
        <label className="text-sm font-medium text-ink">
          Business UPI ID
          <input className={inputClass} required value={form.upiVpa} onChange={(event) => update("upiVpa", event.target.value)} placeholder="business@upi" />
        </label>
        <label className="text-sm font-medium text-ink">
          City
          <input className={inputClass} required minLength={2} value={form.city} onChange={(event) => update("city", event.target.value)} />
        </label>
        <label className="text-sm font-medium text-ink">
          Area or locality
          <input className={inputClass} required minLength={2} value={form.area} onChange={(event) => update("area", event.target.value)} placeholder="HSR Layout, Sector 2" />
        </label>

        <div className="sm:col-span-2 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Provisioning vendor & credentials…" : "Create vendor & generate login credentials"}
          </button>
        </div>
      </form>

      {created && (
        <div className="space-y-4 rounded-[12px] border border-good/40 bg-good/5 p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-good/20 pb-3">
            <div>
              <span className="inline-block rounded-full bg-good/20 px-2.5 py-0.5 text-xs font-bold text-good">
                Active & Provisioned
              </span>
              <h3 className="mt-1 text-base font-semibold text-ink">{created.name}</h3>
            </div>
            <Link
              href={created.portalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              <span>Open Merchant Portal as Admin</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 rounded-[10px] bg-white p-4 border border-line">
            <div>
              <span className="text-xs text-muted block">Merchant Login URL</span>
              <div className="flex items-center justify-between mt-0.5 font-mono text-xs font-semibold text-ink">
                <span>{created.loginUrl}</span>
                <button
                  type="button"
                  onClick={() => copyText(created.loginUrl, "Login URL")}
                  className="text-xs text-accent hover:underline"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs text-muted block">Direct Dashboard</span>
              <div className="flex items-center justify-between mt-0.5 font-mono text-xs font-semibold text-ink">
                <span className="truncate max-w-[200px]">{created.portalUrl}</span>
                <button
                  type="button"
                  onClick={() => copyText(created.portalUrl, "Portal URL")}
                  className="text-xs text-accent hover:underline"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs text-muted block">Login ID / Username</span>
              <div className="flex items-center justify-between mt-0.5 font-mono text-xs font-semibold text-ink">
                <span>{created.ownerEmail}</span>
                <button
                  type="button"
                  onClick={() => copyText(created.ownerEmail, "Login ID")}
                  className="text-xs text-accent hover:underline"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs text-muted block">Initial Password</span>
              <div className="flex items-center justify-between mt-0.5 font-mono text-xs font-semibold text-ink">
                <span>{created.password || "••••••••"}</span>
                {created.password && (
                  <button
                    type="button"
                    onClick={() => copyText(created.password!, "Password")}
                    className="text-xs text-accent hover:underline"
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-ink">
              Ready-to-send onboarding message
            </label>
            <textarea
              readOnly
              rows={6}
              className="w-full rounded-[10px] border border-line bg-white p-3 font-mono text-xs leading-5 text-ink"
              value={created.inviteText}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => copyText(created.inviteText, "Complete merchant instructions")}
              className="inline-flex min-h-10 items-center justify-center rounded-[10px] bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              📋 Copy Complete Credentials to Clipboard
            </button>
            <Link
              href={`/app/${created.slug}/today`}
              className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-line bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-bg"
            >
              Enter Vendor Portal →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
