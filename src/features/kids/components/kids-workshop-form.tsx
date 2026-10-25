"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import { saveKidsWorkshopAction } from "../actions";

export interface KidsWorkshopValues {
  id?: string;
  title: string;
  categoryId: string;
  description: string;
  minAge: number;
  maxAge: number;
  startDate: string;
  endDate: string;
  /** datetime-local value, IST wall time */
  enrollmentDeadline: string;
  venueOrMode: string;
  address: string;
  capacity: number;
  priceRupees: number;
  eligibleClasses: string[];
}

export function KidsWorkshopForm({ slug, initial, categories }: { slug: string; initial: KidsWorkshopValues; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const back = `/merchant-panel/${slug}/kids/workshops`;
  const set = <K extends keyof KidsWorkshopValues>(k: K, value: KidsWorkshopValues[K]) => setV((p) => ({ ...p, [k]: value }));

  function submit(publicationState: "published" | "archived") {
    if (v.minAge > v.maxAge) return setError("Minimum age can't be above maximum age.");
    if (v.endDate < v.startDate) return setError("The workshop can't end before it starts.");
    if (v.enrollmentDeadline.slice(0, 10) > v.startDate) return setError("Close sign-ups on or before the start date.");
    setError(null);
    start(async () => {
      const res = await saveKidsWorkshopAction({
        ...v,
        slug,
        description: v.description || undefined,
        address: v.address || undefined,
        enrollmentDeadline: new Date(`${v.enrollmentDeadline}:00+05:30`).toISOString(),
        publicationState,
      });
      if (!res.ok) return setError(res.error);
      toast.success(publicationState === "archived" ? "Workshop archived" : v.id ? "Workshop updated" : "Workshop published");
      router.push(back);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit("published");
      }}
      className="max-w-2xl space-y-4"
    >
      <Field label="Workshop name" htmlFor="title">
        <Input id="title" required minLength={3} maxLength={120} autoFocus={!v.id} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="3-day summer dance camp" />
      </Field>
      <Field label="Category" htmlFor="category">
        <Select id="category" value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </Field>
      <Field label="What children do" htmlFor="desc">
        <Textarea id="desc" maxLength={2000} value={v.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts" htmlFor="start"><Input id="start" type="date" required value={v.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
        <Field label="Ends" htmlFor="end"><Input id="end" type="date" required min={v.startDate} value={v.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
      </div>
      <Field label="Sign-ups close" htmlFor="deadline" hint="India time.">
        <Input id="deadline" type="datetime-local" required value={v.enrollmentDeadline} onChange={(e) => set("enrollmentDeadline", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Min age" htmlFor="min"><Input id="min" type="number" min={3} max={16} value={v.minAge} onChange={(e) => set("minAge", Number(e.target.value))} /></Field>
        <Field label="Max age" htmlFor="max"><Input id="max" type="number" min={3} max={18} value={v.maxAge} onChange={(e) => set("maxAge", Number(e.target.value))} /></Field>
        <Field label="Seats" htmlFor="cap"><Input id="cap" type="number" min={1} max={100} value={v.capacity} onChange={(e) => set("capacity", Number(e.target.value))} /></Field>
        <Field label="Price (₹)" htmlFor="price"><Input id="price" type="number" min={0} max={100000} value={v.priceRupees} onChange={(e) => set("priceRupees", Number(e.target.value))} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Format" htmlFor="venue">
          <Select id="venue" value={v.venueOrMode} onChange={(e) => set("venueOrMode", e.target.value)}>
            <option value="studio">At my studio</option>
            <option value="outdoor">Outdoor venue</option>
            <option value="online">Online</option>
          </Select>
        </Field>
        {v.venueOrMode !== "online" && (
          <Field label="Venue address" htmlFor="addr"><Input id="addr" maxLength={255} value={v.address} onChange={(e) => set("address", e.target.value)} placeholder="Defaults to your studio address" /></Field>
        )}
      </div>

      {error && <p role="alert" className="rounded-[10px] bg-blush px-3 py-2 text-sm font-medium text-bad">{error}</p>}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>{pending ? "Saving…" : v.id ? "Save changes" : "Publish workshop"}</button>
        <Link href={back} className={buttonClass("secondary", "lg")}>Cancel</Link>
        {v.id && (
          <button
            type="button"
            disabled={pending}
            onClick={() => window.confirm("Archive this workshop? Parents can no longer sign up.") && submit("archived")}
            className={buttonClass("danger", "lg", "ml-auto")}
          >
            Archive
          </button>
        )}
      </div>
    </form>
  );
}
