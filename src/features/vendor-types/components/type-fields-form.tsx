"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChipGroup, Field, Input, Select, Textarea, Toggle } from "@/components/ui/field";
import { ImageUpload, MultiImageUpload, VideoInput } from "@/components/ui/image-upload";
import { PROFILE_FIELDS, ITEM_FIELDS, type Field as FieldSpec, type FieldValues } from "../fields";
import { saveItemDetails, saveTypeProfile } from "../actions";
import type { VendorType } from "@/core/vendor-types";

/**
 * Renders the type-specific fields for a vendor's profile (no itemId) or for
 * one product / service (itemId). The field list comes from fields.ts.
 */
export function TypeFieldsForm({
  slug,
  type,
  itemId,
  initial,
  submitLabel = "Save",
  compact = false,
}: {
  slug: string;
  type: VendorType;
  itemId?: string;
  initial: FieldValues;
  submitLabel?: string;
  compact?: boolean;
}) {
  const fields: FieldSpec[] = (itemId ? ITEM_FIELDS[type] : PROFILE_FIELDS[type]) ?? [];
  const [values, setValues] = useState<FieldValues>(initial);
  const [pending, start] = useTransition();
  const set = (key: string, v: FieldValues[string]) => setValues((cur) => ({ ...cur, [key]: v }));

  if (fields.length === 0) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = itemId ? await saveItemDetails({ slug, itemId, values }) : await saveTypeProfile({ slug, values });
      if (res.ok) toast.success("Saved");
      else toast.error(res.error);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
        {fields.map((f) => {
          const id = `${itemId ?? "profile"}-${f.key}`;
          const wide = f.kind === "textarea" || f.kind === "tags" || f.kind === "multi" || f.kind === "images" || f.kind === "video";
          return (
            <div key={f.key} className={wide ? "sm:col-span-2" : undefined}>
              <FieldInput id={id} field={f} value={values[f.key] ?? null} onChange={(v) => set(f.key, v)} />
            </div>
          );
        })}
      </div>
      <Button type="submit" disabled={pending} size={compact ? "sm" : "md"}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

function FieldInput({ id, field: f, value, onChange }: { id: string; field: FieldSpec; value: FieldValues[string]; onChange: (v: FieldValues[string]) => void }) {
  switch (f.kind) {
    case "bool":
      return <Toggle id={id} label={f.label} checked={value === true} onChange={onChange} />;
    case "multi":
      return (
        <Field label={f.label} hint={f.hint}>
          <ChipGroup label={f.label} options={f.options} value={Array.isArray(value) ? value : []} onChange={onChange} />
        </Field>
      );
    case "tags":
      return <TagsInput id={id} field={f} value={Array.isArray(value) ? value : []} onChange={onChange} />;
    case "select":
      return (
        <Field label={f.label} hint={f.hint} htmlFor={id}>
          <Select id={id} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)}>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      );
    case "textarea":
      return (
        <Field label={f.label} hint={f.hint} htmlFor={id}>
          <Textarea id={id} maxLength={f.max} placeholder={f.placeholder} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case "number":
    case "rupees":
      return (
        <Field label={f.kind === "rupees" ? `${f.label} (₹)` : f.suffix ? `${f.label} (${f.suffix})` : f.label} hint={f.hint} htmlFor={id}>
          <Input
            id={id}
            type="number"
            inputMode={f.kind === "rupees" ? "decimal" : "numeric"}
            step={f.kind === "rupees" ? "0.01" : "1"}
            min={f.kind === "number" ? f.min : 0}
            max={f.max}
            value={typeof value === "number" ? value : ""}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          />
        </Field>
      );
    case "time":
      return (
        <Field label={f.label} hint={f.hint} htmlFor={id}>
          <Input id={id} type="time" value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case "text":
      return (
        <Field label={f.label} hint={f.hint} htmlFor={id}>
          <Input id={id} maxLength={f.max} placeholder={f.placeholder} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case "image":
      return (
        <ImageUpload
          label={f.label}
          hint={f.hint}
          value={typeof value === "string" ? value : null}
          onChange={(url) => onChange(url)}
        />
      );
    case "images":
      return (
        <MultiImageUpload
          label={f.label}
          hint={f.hint}
          isCertificate={f.isCertificate}
          max={f.max ?? 10}
          values={Array.isArray(value) ? value : []}
          onChange={(urls) => onChange(urls)}
        />
      );
    case "video":
      return (
        <VideoInput
          label={f.label}
          hint={f.hint}
          placeholder={f.placeholder}
          value={typeof value === "string" ? value : null}
          onChange={(url) => onChange(url)}
        />
      );
  }
}

/** Comma-separated tags, shown as removable chips. */
function TagsInput({ id, field, value, onChange }: { id: string; field: FieldSpec & { kind: "tags" }; value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = (text = draft) => {
    const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange(Array.from(new Set([...value, ...parts])).slice(0, 20));
    setDraft("");
  };
  return (
    <Field label={field.label} hint={field.hint ?? "Press Enter or comma to add"} htmlFor={id}>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((t) => (
            <button key={t} type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-bg px-3 text-[13px] text-ink ring-1 ring-line hover:ring-bad/40" aria-label={`Remove ${t}`}>
              {t} <span aria-hidden="true" className="text-muted">×</span>
            </button>
          ))}
        </div>
      )}
      <Input
        id={id}
        value={draft}
        placeholder={field.placeholder}
        onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={() => add()}
      />
    </Field>
  );
}
