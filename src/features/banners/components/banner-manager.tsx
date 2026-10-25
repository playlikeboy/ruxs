"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, Input, Select } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { deleteBannerAction, saveBannerAction } from "../actions";
import { BANNER_TONES } from "../schemas";
import { HeroCarousel, type HeroSlide } from "./hero-carousel";

export interface BannerRow extends HeroSlide {
  sort: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}

interface Draft {
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  ctaLabel: string;
  tone: (typeof BANNER_TONES)[number];
  sort: number;
  isActive: boolean;
  /** datetime-local values, India time */
  startsAt: string;
  endsAt: string;
}

const istInput = (d: Date | null) =>
  d ? new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 16) : "";
const toIso = (v: string) => (v ? new Date(`${v}:00+05:30`).toISOString() : "");
const blank = (sort: number): Draft => ({ title: "", subtitle: "", imageUrl: "", href: "/app", ctaLabel: "", tone: "peach", sort, isActive: true, startsAt: "", endsAt: "" });
const fromRow = (b: BannerRow): Draft => ({
  id: b.id,
  title: b.title,
  subtitle: b.subtitle ?? "",
  imageUrl: b.imageUrl ?? "",
  href: b.href,
  ctaLabel: b.ctaLabel ?? "",
  tone: (BANNER_TONES as readonly string[]).includes(b.tone) ? (b.tone as Draft["tone"]) : "peach",
  sort: b.sort,
  isActive: b.isActive,
  startsAt: istInput(b.startsAt),
  endsAt: istInput(b.endsAt),
});
const TONE_BG: Record<string, string> = { peach: "bg-peach", mint: "bg-mint", butter: "bg-butter", blush: "bg-blush" };
const when = (d: Date) => d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export function BannerManager({ rows }: { rows: BannerRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  function save(d: Draft) {
    setError(null);
    start(async () => {
      const res = await saveBannerAction({ ...d, startsAt: toIso(d.startsAt), endsAt: toIso(d.endsAt) });
      if (!res.ok) return setError(res.error);
      toast.success(d.id ? "Slide updated" : "Slide added");
      setDraft(null);
      router.refresh();
    });
  }

  function remove(b: BannerRow) {
    if (!window.confirm(`Delete "${b.title}"? This can't be undone.`)) return;
    start(async () => {
      const res = await deleteBannerAction({ id: b.id });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Slide deleted");
      router.refresh();
    });
  }

  if (draft) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(draft);
        }}
        className="grid gap-6 lg:grid-cols-[1fr_380px]"
      >
        <div className="max-w-xl space-y-4">
          <Field label="Title" htmlFor="b-title"><Input id="b-title" required minLength={3} maxLength={60} autoFocus value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Diwali gifts, 20% off" /></Field>
          <Field label="Subtitle" htmlFor="b-sub" hint="One short line. Optional."><Input id="b-sub" maxLength={120} value={draft.subtitle} onChange={(e) => set("subtitle", e.target.value)} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Opens" htmlFor="b-href" hint="A path like /app/category/tiffin, or an https:// link."><Input id="b-href" required value={draft.href} onChange={(e) => set("href", e.target.value)} /></Field>
            <Field label="Button text" htmlFor="b-cta"><Input id="b-cta" maxLength={24} value={draft.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} placeholder="Open" /></Field>
          </div>
          <ImageUpload label="Image" hint="Square works best. Optional." value={draft.imageUrl || null} onChange={(url) => set("imageUrl", url ?? "")} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Colour" htmlFor="b-tone">
              <Select id="b-tone" value={draft.tone} onChange={(e) => set("tone", e.target.value as Draft["tone"])}>
                {BANNER_TONES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </Select>
            </Field>
            <Field label="Position" htmlFor="b-sort" hint="Lower shows first."><Input id="b-sort" type="number" min={0} max={999} value={draft.sort} onChange={(e) => set("sort", Number(e.target.value))} /></Field>
            <Field label="Visible" htmlFor="b-active">
              <Select id="b-active" value={draft.isActive ? "yes" : "no"} onChange={(e) => set("isActive", e.target.value === "yes")}>
                <option value="yes">Showing</option>
                <option value="no">Hidden</option>
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Show from" htmlFor="b-start" hint="India time. Empty means now."><Input id="b-start" type="datetime-local" value={draft.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></Field>
            <Field label="Hide after" htmlFor="b-end" hint="Empty means never."><Input id="b-end" type="datetime-local" value={draft.endsAt} onChange={(e) => set("endsAt", e.target.value)} /></Field>
          </div>
          {error && <p role="alert" className="rounded-[10px] bg-blush px-3 py-2 text-sm font-medium text-bad">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>{pending ? "Saving…" : draft.id ? "Save slide" : "Add slide"}</button>
            <button type="button" onClick={() => setDraft(null)} className={buttonClass("secondary", "lg")}>Cancel</button>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted">Preview</p>
          <div className="max-w-[380px]">
            <HeroCarousel slides={[{ id: "preview", title: draft.title || "Your title", subtitle: draft.subtitle || null, imageUrl: draft.imageUrl || null, href: "#", ctaLabel: draft.ctaLabel || null, tone: draft.tone }]} />
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setDraft(blank(rows.length))} className={buttonClass("primary", "md")}>Add slide</button>
      {rows.length === 0 ? (
        <p className="rounded-[14px] bg-app-canvas p-6 text-sm text-muted">No slides yet. The home screen hides the carousel until you add one.</p>
      ) : (
        <ul className="divide-y divide-line rounded-[14px] border border-line bg-surface">
          {rows.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-3 p-3">
              {b.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-supplied URLs from any host
                <img src={b.imageUrl} alt="" className="h-12 w-12 rounded-[10px] object-cover" />
              ) : (
                <span className={`h-12 w-12 rounded-[10px] ${TONE_BG[b.tone] ?? "bg-peach"}`} aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{b.title}</span>
                <span className="block truncate text-xs text-muted">
                  {b.isActive ? "Showing" : "Hidden"} · #{b.sort} · {b.href}
                  {b.endsAt && ` · until ${when(b.endsAt)}`}
                </span>
              </span>
              <button type="button" disabled={pending} onClick={() => save({ ...fromRow(b), isActive: !b.isActive })} className={buttonClass("secondary", "sm")}>{b.isActive ? "Hide" : "Show"}</button>
              <button type="button" disabled={pending} onClick={() => setDraft(fromRow(b))} className={buttonClass("secondary", "sm")}>Edit</button>
              <button type="button" disabled={pending} onClick={() => remove(b)} className={buttonClass("danger", "sm")}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
