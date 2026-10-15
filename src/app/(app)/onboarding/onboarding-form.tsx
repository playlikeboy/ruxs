"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createVendor } from "@/features/vendors/actions";

export function OnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("+91");
  const [upiVpa, setUpiVpa] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [area, setArea] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    const suggestedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(suggestedSlug);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await createVendor({
        name,
        slug,
        phone,
        upiVpa,
        city,
        area,
      });

      if (!res.ok) {
        setError(res.error ?? "Failed to create business");
        toast.error(res.error ?? "Failed to create business");
      } else {
        toast.success("Business registered successfully!");
        router.push(`/merchant-panel/${res.slug}/today`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-[#FCE4EC] border border-[#B42318]/20 text-[#B42318] text-sm rounded-[10px]">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-ink mb-1"
        >
          Business or Kitchen Name
        </label>
        <input
          id="name"
          type="text"
          required
          placeholder="e.g. Annapurna Tiffin"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full px-3 py-2.5 text-base bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-ink mb-1"
        >
          Web Link (Slug)
        </label>
        <div className="flex items-center text-sm text-muted bg-[#FAFAF7] border border-line rounded-[10px] px-3 py-2.5">
          <span>ruxs.in/merchant-panel/</span>
          <input
            id="slug"
            type="text"
            required
            placeholder="annapurna-tiffin"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="flex-1 bg-transparent text-ink text-base focus:outline-hidden"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-ink mb-1"
        >
          Contact Phone
        </label>
        <input
          id="phone"
          type="tel"
          required
          placeholder="+919876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2.5 text-base bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label
          htmlFor="upiVpa"
          className="block text-sm font-medium text-ink mb-1"
        >
          UPI ID (for direct payments)
        </label>
        <input
          id="upiVpa"
          type="text"
          required
          placeholder="annapurna@okaxis"
          value={upiVpa}
          onChange={(e) => setUpiVpa(e.target.value)}
          className="w-full px-3 py-2.5 text-base bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent"
        />
        <p className="text-xs text-muted mt-1">
          Bills include your UPI link so households pay directly to your account.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-ink mb-1"
          >
            City
          </label>
          <input
            id="city"
            type="text"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2.5 text-base bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label
            htmlFor="area"
            className="block text-sm font-medium text-ink mb-1"
          >
            Area / Locality
          </label>
          <input
            id="area"
            type="text"
            required
            placeholder="e.g. HSR Layout"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full px-3 py-2.5 text-base bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-4 py-3 px-4 bg-accent text-white font-medium text-base rounded-[10px] hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
      >
        {isPending ? "Creating business..." : "Complete Setup"}
      </button>
    </form>
  );
}
