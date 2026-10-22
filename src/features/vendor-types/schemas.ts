import { z } from "zod";
import { rupeesToPaise } from "@/core/money";
import type { Field } from "./fields";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** zod for one field. Empty text becomes null; rupees become integer paise. */
function fieldSchema(f: Field): z.ZodType<unknown> {
  switch (f.kind) {
    case "text":
    case "textarea":
      return z
        .string()
        .trim()
        .max(f.max ?? (f.kind === "text" ? 200 : 500), `${f.label} is too long`)
        .transform((v) => (v === "" ? null : v))
        .nullable()
        .optional()
        .transform((v) => v ?? null);
    case "number": {
      const n = z.number({ error: `${f.label} must be a number` }).int(`${f.label} must be a whole number`).min(f.min, `${f.label} is too small`).max(f.max, `${f.label} is too large`);
      return f.required ? n : n.nullable().optional().transform((v) => v ?? null);
    }
    case "rupees": {
      const r = z.number({ error: `${f.label} must be an amount` }).min(0, `${f.label} can't be negative`).max(f.max, `${f.label} is too large`);
      return f.required ? r.transform((v) => rupeesToPaise(v)) : r.nullable().optional().transform((v) => (v == null ? null : rupeesToPaise(v)));
    }
    case "bool":
      return z.boolean();
    case "select": {
      const values = f.options.map((o) => o.value);
      return z
        .string()
        .refine((v) => values.includes(v), `Pick a valid ${f.label.toLowerCase()}`)
        .transform((v) => (v === "" ? null : v));
    }
    case "multi": {
      const values = f.options.map((o) => o.value);
      return z.array(z.string().refine((v) => values.includes(v), `Pick valid ${f.label.toLowerCase()}`)).max(values.length).transform((a) => Array.from(new Set(a)));
    }
    case "tags":
      return z.array(z.string().trim().min(1).max(40, "Keep each tag under 40 letters")).max(20, "Up to 20 tags");
    case "time":
      return f.required ? z.string().regex(TIME, `${f.label} must look like 07:30`) : z.union([z.literal(""), z.string().regex(TIME, `${f.label} must look like 07:30`)]).nullable().optional().transform((v) => (v ? v : null));
  }
}

/** Build the object schema for a list of fields; unknown keys are dropped. */
export function valuesSchema(fields: Field[]) {
  return z.object(Object.fromEntries(fields.map((f) => [f.key, fieldSchema(f)])));
}

export const saveTypeProfileSchema = z.object({
  slug: z.string().min(1),
  values: z.record(z.string(), z.unknown()),
});

export const saveItemDetailsSchema = z.object({
  slug: z.string().min(1),
  itemId: z.string().min(1),
  values: z.record(z.string(), z.unknown()),
});
