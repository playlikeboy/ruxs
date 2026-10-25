"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, Input, Select, Textarea, ChipGroup } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import { archiveKidsServiceAction, saveKidsServiceAction } from "../actions";

export interface KidsClassValues {
  id?: string;
  title: string;
  categoryId: string;
  description: string;
  minAge: number;
  maxAge: number;
  durationMinutes: number;
  priceRupees: number;
  deliveryModes: string[];
  materialFeePolicy: "included" | "extra" | "required";
  materialFeeRupees: number;
  suitableClasses: string[];
}

const MODES = [
  { value: "studio", label: "At my studio" },
  { value: "home", label: "Home visit" },
  { value: "online", label: "Online" },
];

export function KidsClassForm({ slug, initial, categories }: { slug: string; initial: KidsClassValues; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const back = `/merchant-panel/${slug}/kids`;
  const set = <K extends keyof KidsClassValues>(k: K, value: KidsClassValues[K]) => setV((p) => ({ ...p, [k]: value }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (v.minAge > v.maxAge) return setError("Minimum age can't be above maximum age.");
    if (v.deliveryModes.length === 0) return setError("Pick at least one way to run the class.");
    setError(null);
    start(async () => {
      const res = await saveKidsServiceAction({ ...v, slug, description: v.description || undefined, materialFeeRupees: v.materialFeePolicy === "included" ? 0 : v.materialFeeRupees });
      if (!res.ok) return setError(res.error);
      toast.success(v.id ? "Class updated" : "Class added");
      router.push(back);
      router.refresh();
    });
  }

  function archive() {
    if (!v.id || !window.confirm("Archive this class? Parents can no longer book it.")) return;
    start(async () => {
      const res = await archiveKidsServiceAction({ slug, serviceId: v.id! });
      if (!res.ok) return setError(res.error);
      toast.success("Class archived");
      router.push(back);
      router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-4">
      <Field label="Class name" htmlFor="title">
        <Input id="title" required minLength={3} maxLength={100} autoFocus={!v.id} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Bollywood dance for beginners" />
      </Field>
      <Field label="Category" htmlFor="category">
        <Select id="category" value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </Field>
      <Field label="What children do and take home" htmlFor="desc">
        <Textarea id="desc" maxLength={1000} value={v.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Min age" htmlFor="min"><Input id="min" type="number" min={3} max={16} value={v.minAge} onChange={(e) => set("minAge", Number(e.target.value))} /></Field>
        <Field label="Max age" htmlFor="max"><Input id="max" type="number" min={3} max={18} value={v.maxAge} onChange={(e) => set("maxAge", Number(e.target.value))} /></Field>
        <Field label="Minutes" htmlFor="dur"><Input id="dur" type="number" min={15} max={480} step={15} value={v.durationMinutes} onChange={(e) => set("durationMinutes", Number(e.target.value))} /></Field>
        <Field label="Price (₹)" htmlFor="price"><Input id="price" type="number" min={0} max={50000} value={v.priceRupees} onChange={(e) => set("priceRupees", Number(e.target.value))} /></Field>
      </div>
      <Field label="Where it runs">
        <ChipGroup label="Where it runs" options={MODES} value={v.deliveryModes} onChange={(m) => set("deliveryModes", m)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Materials" htmlFor="mat">
          <Select id="mat" value={v.materialFeePolicy} onChange={(e) => set("materialFeePolicy", e.target.value as KidsClassValues["materialFeePolicy"])}>
            <option value="included">Included in the price</option>
            <option value="extra">Optional kit, extra fee</option>
            <option value="required">Required kit, extra fee</option>
          </Select>
        </Field>
        {v.materialFeePolicy !== "included" && (
          <Field label="Kit fee (₹)" htmlFor="matfee"><Input id="matfee" type="number" min={0} max={10000} value={v.materialFeeRupees} onChange={(e) => set("materialFeeRupees", Number(e.target.value))} /></Field>
        )}
      </div>

      {error && <p role="alert" className="rounded-[10px] bg-blush px-3 py-2 text-sm font-medium text-bad">{error}</p>}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>{pending ? "Saving…" : v.id ? "Save changes" : "Add class"}</button>
        <Link href={back} className={buttonClass("secondary", "lg")}>Cancel</Link>
        {v.id && <button type="button" onClick={archive} disabled={pending} className={buttonClass("danger", "lg", "ml-auto")}>Archive</button>}
      </div>
    </form>
  );
}
