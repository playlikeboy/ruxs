"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { homeBanners } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { bannerIdSchema, bannerSchema } from "./schemas";

function refresh() {
  revalidatePath("/admin/banners");
  revalidatePath("/app");
}

export async function saveBannerAction(input: unknown) {
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the slide details" };
  await requireAdmin();
  const { id, subtitle, imageUrl, ctaLabel, startsAt, endsAt, ...rest } = parsed.data;
  const values = {
    ...rest,
    subtitle: subtitle || null,
    imageUrl: imageUrl || null,
    ctaLabel: ctaLabel || null,
    startsAt: startsAt ? new Date(startsAt) : null,
    endsAt: endsAt ? new Date(endsAt) : null,
    updatedAt: new Date(),
  };
  try {
    const db = getDb();
    if (id) {
      const [row] = await db.update(homeBanners).set(values).where(eq(homeBanners.id, id)).returning({ id: homeBanners.id });
      if (!row) return { ok: false as const, error: "Slide not found" };
    } else {
      await db.insert(homeBanners).values(values);
    }
  } catch (err) {
    console.error("saveBanner failed", err);
    return { ok: false as const, error: "Could not save the slide. Try again." };
  }
  refresh();
  return { ok: true as const };
}

/** Slides are not referenced by orders or money, so removing one deletes it. */
export async function deleteBannerAction(input: unknown) {
  const parsed = bannerIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid slide" };
  await requireAdmin();
  await getDb().delete(homeBanners).where(eq(homeBanners.id, parsed.data.id));
  refresh();
  return { ok: true as const };
}
