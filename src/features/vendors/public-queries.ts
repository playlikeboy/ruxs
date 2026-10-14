import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors, products } from "@/db/schema";
import { resolveCoordinates, Coordinates } from "@/core/geo";

export interface PublicVendorItem {
  id: string;
  slug: string;
  name: string;
  city: string;
  area: string;
  phone: string;
  upiVpa: string;
  coordinates: Coordinates;
  minPricePaise: number;
  kinds: ("tiffin" | "water")[];
  products: {
    id: string;
    name: string;
    kind: "tiffin" | "water";
    shift: "lunch" | "dinner" | "morning" | "evening";
    pricePaise: number;
    depositPaise: number;
    cutoffAt: string;
    assetName: string | null;
  }[];
}

/**
 * Public query for discovering active merchants and kitchens across India.
 * Server-only; no user credentials required.
 */
export async function getActiveVendorsWithProducts(): Promise<PublicVendorItem[]> {
  const db = getDb();

  const activeVendors = await db
    .select({
      id: vendors.id,
      slug: vendors.slug,
      name: vendors.name,
      city: vendors.city,
      area: vendors.area,
      phone: vendors.phone,
      upiVpa: vendors.upiVpa,
    })
    .from(vendors)
    .where(eq(vendors.status, "active"));

  if (activeVendors.length === 0) {
    return [];
  }

  const allProducts = await db.select().from(products);

  const productMap = new Map<string, typeof allProducts>();
  for (const p of allProducts) {
    const list = productMap.get(p.vendorId) || [];
    list.push(p);
    productMap.set(p.vendorId, list);
  }

  return activeVendors.map((v) => {
    const vProducts = productMap.get(v.id) || [];
    const coords = resolveCoordinates(v.city, v.area);
    const kindsSet = new Set<"tiffin" | "water">();

    let minPrice = Infinity;
    for (const p of vProducts) {
      if (p.kind === "tiffin" || p.kind === "water") {
        kindsSet.add(p.kind);
      }
      if (p.pricePaise < minPrice) {
        minPrice = p.pricePaise;
      }
    }

    return {
      id: v.id,
      slug: v.slug,
      name: v.name,
      city: v.city,
      area: v.area,
      phone: v.phone,
      upiVpa: v.upiVpa,
      coordinates: coords,
      minPricePaise: minPrice === Infinity ? 0 : minPrice,
      kinds: Array.from(kindsSet),
      products: vProducts.map((p) => ({
        id: p.id,
        name: p.name,
        kind: p.kind as "tiffin" | "water",
        shift: p.shift as "lunch" | "dinner" | "morning" | "evening",
        pricePaise: p.pricePaise,
        depositPaise: p.depositPaise,
        cutoffAt: p.cutoffAt,
        assetName: p.assetName,
      })),
    };
  });
}
