"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveProviderProfile } from "@/features/bookings/actions";

const input = "w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent";
const label = "mb-1 block text-xs font-medium text-ink";

const list = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean);

export function ProviderProfileForm({
  slug,
  initial,
}: {
  slug: string;
  initial: { headline: string | null; qualifications: string | null; experienceYears: number | null; specialities: string[]; languages: string[]; gender: string | null } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    headline: initial?.headline ?? "",
    qualifications: initial?.qualifications ?? "",
    experienceYears: initial?.experienceYears?.toString() ?? "",
    specialities: (initial?.specialities ?? []).join(", "),
    languages: (initial?.languages ?? []).join(", "),
    gender: initial?.gender ?? "",
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await saveProviderProfile({
            slug,
            headline: f.headline,
            qualifications: f.qualifications,
            experienceYears: f.experienceYears.trim() === "" ? null : Math.round(Number(f.experienceYears)),
            specialities: list(f.specialities),
            languages: list(f.languages),
            gender: f.gender === "" ? null : f.gender,
          });
          if (!res.ok) toast.error(res.error);
          else {
            toast.success("Profile saved");
            router.refresh();
          }
        });
      }}
    >
      <div>
        <label htmlFor="pp-head" className={label}>Headline</label>
        <input id="pp-head" maxLength={120} value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} placeholder="Certified personal trainer · weight loss & strength" className={input} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="pp-qual" className={label}>Qualifications</label>
          <input id="pp-qual" maxLength={200} value={f.qualifications} onChange={(e) => setF({ ...f, qualifications: e.target.value })} placeholder="BPT, MPT (Ortho) / ACE CPT" className={input} />
        </div>
        <div>
          <label htmlFor="pp-exp" className={label}>Years of experience</label>
          <input id="pp-exp" inputMode="numeric" value={f.experienceYears} onChange={(e) => setF({ ...f, experienceYears: e.target.value })} placeholder="6" className={input} />
        </div>
      </div>
      <div>
        <label htmlFor="pp-spec" className={label}>Specialities (comma separated)</label>
        <input id="pp-spec" value={f.specialities} onChange={(e) => setF({ ...f, specialities: e.target.value })} placeholder="Weight loss, Strength, Back pain" className={input} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="pp-lang" className={label}>Languages (comma separated)</label>
          <input id="pp-lang" value={f.languages} onChange={(e) => setF({ ...f, languages: e.target.value })} placeholder="Hindi, English" className={input} />
        </div>
        <div>
          <label htmlFor="pp-gender" className={label}>Gender (shown to clients)</label>
          <select id="pp-gender" value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })} className={input}>
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <button type="submit" disabled={pending} className="h-11 rounded-[12px] bg-accent px-5 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
