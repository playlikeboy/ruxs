"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Store } from "lucide-react";
import { toast } from "sonner";
import { createVendor } from "@/features/vendors/actions";

const inputClass =
  "min-h-12 w-full rounded-[10px] border border-line bg-surface px-3.5 text-base text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";
const steps = [
  { title: "Business details", hint: "Name and workspace link" },
  { title: "Contact & location", hint: "How to reach your business" },
  { title: "Payout details", hint: "Review before submitting" },
];

function slugFromName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function OnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [phone, setPhone] = useState("");
  const [upiVpa, setUpiVpa] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validateStep = () => {
    if (step === 0) {
      if (name.trim().length < 2) return "Enter your business name (at least 2 characters).";
      if (slug.trim().length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
        return "Use lowercase letters or numbers in your workspace link, with hyphens between words.";
      }
    }
    if (step === 1) {
      const normalizedPhone = phone.replace(/\s+/g, "");
      if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
        return "Enter a valid Indian mobile number, including +91.";
      }
      if (city.trim().length < 2) return "Enter the city where your business operates.";
      if (area.trim().length < 2) return "Enter your area or locality.";
    }
    if (step === 2 && upiVpa.trim().length < 3) {
      return "Enter the UPI ID where you receive direct payments.";
    }
    return null;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugEdited) setSlug(slugFromName(value));
    setError(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    startTransition(async () => {
      try {
        const result = await createVendor({
          name: name.trim(),
          slug: slug.trim(),
          phone: phone.replace(/\s+/g, ""),
          upiVpa: upiVpa.trim(),
          city: city.trim(),
          area: area.trim(),
        });

        if (!result.ok) {
          const message = result.error ?? "We couldn't create your business yet. Check the details and try again.";
          setError(message);
          toast.error(message);
          return;
        }

        toast.success("Your business application has been submitted.");
        router.push("/merchant-panel/" + result.slug + "/today");
      } catch {
        const message = "We couldn't submit your application. Check your connection and try again.";
        setError(message);
        toast.error(message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="rounded-[14px] border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">Your application</p>
          <p className="text-xs font-medium tabular-nums text-muted">Step {step + 1} of {steps.length}</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2" aria-label={"Step " + (step + 1) + " of " + steps.length}>
          {steps.map((item, index) => (
            <div
              key={item.title}
              className={"h-1.5 rounded-full " + (index <= step ? "bg-accent" : "bg-line")}
            />
          ))}
        </div>
        <div className="mt-4 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-bg text-accent">
            {step === steps.length - 1 ? <Check className="h-5 w-5" aria-hidden="true" /> : <Store className="h-5 w-5" aria-hidden="true" />}
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">{steps[step]?.title}</h2>
            <p className="mt-0.5 text-sm leading-5 text-muted">{steps[step]?.hint}</p>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-[10px] border border-bad/20 bg-bad/5 px-3.5 py-3 text-sm leading-5 text-bad">
          {error}
        </div>
      )}

      {step === 0 && (
        <section className="space-y-4" aria-labelledby="business-details-heading">
          <h3 id="business-details-heading" className="sr-only">Business details</h3>
          <div>
            <label htmlFor="business-name" className={labelClass}>Business name</label>
            <input
              id="business-name"
              name="businessName"
              type="text"
              required
              minLength={2}
              maxLength={80}
              autoComplete="organization"
              autoFocus
              placeholder="e.g. Annapurna Kitchen or Little Makers Club"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              disabled={isPending}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs leading-5 text-muted">Use the name customers and your team will recognise.</p>
          </div>
          <div>
            <label htmlFor="business-slug" className={labelClass}>Workspace link</label>
            <div className="flex min-h-12 items-center overflow-hidden rounded-[10px] border border-line bg-bg px-3">
              <span className="shrink-0 text-xs text-muted sm:text-sm">ruxs.in/merchant-panel/</span>
              <input
                id="business-slug"
                name="businessSlug"
                type="text"
                required
                minLength={2}
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
                value={slug}
                onChange={(event) => {
                  setSlug(slugFromName(event.target.value));
                  setSlugEdited(true);
                  setError(null);
                }}
                disabled={isPending}
                className="min-w-0 flex-1 bg-transparent px-1.5 py-3 text-base text-ink focus:outline-none"
              />
            </div>
            <p className="mt-1.5 text-xs leading-5 text-muted">Lowercase letters and numbers, with hyphens between words. You can customise this suggestion.</p>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4" aria-labelledby="contact-location-heading">
          <h3 id="contact-location-heading" className="sr-only">Contact and location</h3>
          <div>
            <label htmlFor="business-phone" className={labelClass}>Business mobile number</label>
            <input
              id="business-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(event) => { setPhone(event.target.value); setError(null); }}
              disabled={isPending}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs leading-5 text-muted">Use an Indian mobile number, including the +91 country code.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="business-city" className={labelClass}>City</label>
              <input
                id="business-city"
                name="city"
                type="text"
                autoComplete="address-level2"
                required
                placeholder="e.g. Ranchi"
                value={city}
                onChange={(event) => { setCity(event.target.value); setError(null); }}
                disabled={isPending}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="business-area" className={labelClass}>Area or locality</label>
              <input
                id="business-area"
                name="area"
                type="text"
                autoComplete="address-level3"
                required
                placeholder="e.g. Morabadi"
                value={area}
                onChange={(event) => { setArea(event.target.value); setError(null); }}
                disabled={isPending}
                className={inputClass}
              />
            </div>
          </div>
          <p className="rounded-[10px] bg-bg px-3.5 py-3 text-xs leading-5 text-muted">
            This helps RUXs understand where your business operates. Your exact service area and delivery settings can be refined in the workspace.
          </p>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4" aria-labelledby="payout-details-heading">
          <h3 id="payout-details-heading" className="sr-only">Payout details</h3>
          <div>
            <label htmlFor="business-upi" className={labelClass}>UPI ID</label>
            <input
              id="business-upi"
              name="upiVpa"
              type="text"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              required
              placeholder="yourbusiness@upi"
              value={upiVpa}
              onChange={(event) => { setUpiVpa(event.target.value); setError(null); }}
              disabled={isPending}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs leading-5 text-muted">Customer bills include your UPI link so they can pay you directly.</p>
          </div>

          <div className="rounded-[12px] border border-line p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Review your details</p>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted">Business</dt>
                <dd className="text-right font-medium text-ink">{name.trim()}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted">Workspace</dt>
                <dd className="max-w-[65%] break-all text-right font-medium text-ink">/merchant-panel/{slug.trim()}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted">Location</dt>
                <dd className="text-right font-medium text-ink">{area.trim()}, {city.trim()}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted">Contact</dt>
                <dd className="text-right font-medium text-ink">{phone.trim()}</dd>
              </div>
            </dl>
          </div>
          <p className="text-xs leading-5 text-muted">
            New listings start in review. You’ll be able to continue to your workspace after submitting, but the business must be approved before it can accept orders.
          </p>
        </section>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => { setStep((current) => current - 1); setError(null); }}
            disabled={isPending}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-line bg-surface px-4 text-sm font-semibold text-ink transition hover:bg-bg disabled:opacity-60"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>
        ) : (
          <p className="self-center text-xs leading-5 text-muted">About 2 minutes · Guided setup</p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-accent px-5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Submitting application…" : step === steps.length - 1 ? "Submit application" : "Continue"}
          {!isPending && step < steps.length - 1 && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </form>
  );
}
