import { z } from "zod";

export const BANNER_TONES = ["peach", "mint", "butter", "blush"] as const;

/** An in-app path ("/app/…") or a full https link. Never "//host" or javascript:. */
const link = z
  .string()
  .trim()
  .min(1, "Add where the slide opens")
  .max(500)
  .refine((v) => (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\/[^\s]+$/i.test(v), "Use a path like /app/category/tiffin or an https:// link");

const imageUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\/[^\s]+$/i.test(v), "Upload an image or paste an https:// link");

const isoOrEmpty = z.string().trim().refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Pick a valid date");

export const bannerSchema = z
  .object({
    id: z.string().max(64).optional(),
    title: z.string().trim().min(3, "Title is too short").max(60),
    subtitle: z.string().trim().max(120).default(""),
    imageUrl: imageUrl.default(""),
    href: link,
    ctaLabel: z.string().trim().max(24).default(""),
    tone: z.enum(BANNER_TONES),
    sort: z.number().int().min(0).max(999),
    isActive: z.boolean(),
    startsAt: isoOrEmpty.default(""),
    endsAt: isoOrEmpty.default(""),
  })
  .refine((v) => !v.startsAt || !v.endsAt || Date.parse(v.startsAt) < Date.parse(v.endsAt), { message: "End must be after start", path: ["endsAt"] });

export type BannerInput = z.input<typeof bannerSchema>;

export const bannerIdSchema = z.object({ id: z.string().min(1).max(64) });
