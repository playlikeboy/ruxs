"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveProfile } from "@/features/consumer/actions";

export interface ProfileDefaults {
  name: string;
  phone: string;
  society: string;
  tower: string;
  floor: string;
  flat: string;
  landmark: string;
  area: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

const inputClass =
  "mt-1 h-12 w-full rounded-xl border border-black/10 bg-white px-3.5 text-[15px] text-ink placeholder:text-neutral-400 focus:border-ink focus:outline-none";

export function ProfileForm({ defaults, next }: { defaults: ProfileDefaults; next?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(defaults);
  const [pending, startTransition] = useTransition();

  const field = (key: keyof ProfileDefaults, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="text-[13px] font-medium text-neutral-600">{label}</span>
      <input
        {...props}
        value={(form[key] as string | number | null) ?? ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={inputClass}
      />
    </label>
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await saveProfile(form);
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          toast.success("Address saved");
          if (next && next.startsWith("/app")) router.push(next);
          else router.refresh();
        });
      }}
    >
      <div className="grid grid-cols-1 gap-4">
        {field("name", "Full name", { autoComplete: "name", required: true })}
        {field("phone", "Mobile number", { autoComplete: "tel", inputMode: "tel", placeholder: "98xxxxxx10", required: true })}
      </div>
      <div className="grid grid-cols-1 gap-4 pt-2">
        {field("society", "Society / building", { placeholder: "Prestige Lakeside", required: true })}
        <div className="grid grid-cols-3 gap-3">
          {field("tower", "Tower / block", { placeholder: "B" })}
          {field("floor", "Floor", { placeholder: "4", inputMode: "numeric" })}
          {field("flat", "Flat no.", { placeholder: "402", required: true })}
        </div>
        {field("landmark", "Landmark (optional)", { placeholder: "Near main gate" })}
        <div className="grid grid-cols-2 gap-3">
          {field("area", "Area", { placeholder: "HSR Layout", required: true })}
          {field("city", "City", { placeholder: "Bengaluru", required: true })}
        </div>
      </div>
      <p className="text-xs text-neutral-500">
        Stores only see your name, flat and phone after you order or subscribe, so they can deliver to you.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="h-13 flex w-full items-center justify-center rounded-xl bg-accent py-3.5 text-[15px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}
