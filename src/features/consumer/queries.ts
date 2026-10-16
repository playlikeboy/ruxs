import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, gte, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import {
  consumers,
  customers,
  dayChanges,
  ledgerEntries,
  products,
  shopOrderItems,
  shopOrders,
  subscriptions,
  vendors,
} from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { findNearestLocality, haversineDistanceKm, resolveCoordinates } from "@/core/geo";
import { readApproxPoint, readGpsCookie } from "@/lib/location";
import { balance } from "@/core/ledger";
import { addDaysIST, todayIST } from "@/core/time";
import type { CoverStyle, ServiceKind } from "@/config/service-kinds";
import { getCategoryMap, getLocalities, getPlatformSettings, getRatingMap } from "@/features/platform/queries";
import { storeReach } from "@/core/geo";
import type { RatingSummary } from "@/core/ratings";
import type { LocalityCentroid } from "@/core/geo";

export const getMyProfile = cache(async () => {
  const user = await requireUser();
  const db = getDb();
  const [profile] = await db
    .select()
    .from(consumers)
    .where(eq(consumers.userId, user.id))
    .limit(1);
  return { user, profile: profile ?? null };
});

export type LocationSource = "address" | "gps" | "approx" | "none";

export interface MyLocation {
  latitude: number | null;
  longitude: number | null;
  source: LocationSource;
  label: string | null;
}

/**
 * Where to look for stores, best source first: the saved address pin, then the
 * last GPS fix, then Cloudflare's IP guess.
 */
export const getMyLocation = cache(async (): Promise<MyLocation> => {
  const { profile } = await getMyProfile();
  if (profile?.latitude != null && profile.longitude != null) {
    return { latitude: profile.latitude, longitude: profile.longitude, source: "address", label: `${profile.society}, ${profile.area}` };
  }
  const localities = await getLocalities();
  const gps = await readGpsCookie();
  if (gps) {
    const near = findNearestLocality(gps.latitude, gps.longitude, localities);
    const place = near && near.distanceKm <= 25 ? `Near ${near.locality.name}, ${near.locality.city}` : "Your current location";
    return { ...gps, source: "gps", label: profile ? `${profile.society}, ${profile.area}` : place };
  }
  const approx = readApproxPoint();
  if (approx) {
    const near = findNearestLocality(approx.latitude, approx.longitude, localities);
    const place = near && near.distanceKm <= 25 ? `${near.locality.name}, ${near.locality.city}` : (approx.city ?? "your area");
    return { latitude: approx.latitude, longitude: approx.longitude, source: "approx", label: place };
  }
  return { latitude: null, longitude: null, source: "none", label: profile ? `${profile.society}, ${profile.area}` : null };
});

export interface StoreCard {
  id: string;
  slug: string;
  name: string;
  area: string;
  city: string;
  description: string | null;
  coverUrl: string | null;
  kinds: ServiceKind[];
  kindLabels: string[];
  cover: CoverStyle;
  minPricePaise: number;
  deliveryFeePaise: number;
  acceptingOrders: boolean;
  hasSubscriptions: boolean;
  distanceKm: number | null;
  inRange: boolean;
  rating: RatingSummary;
  itemCount: number;
  matchedItems: string[];
}

/** Public store fields only. Phone numbers are never exposed to households. */
const publicVendorFields = {
  id: vendors.id,
  slug: vendors.slug,
  name: vendors.name,
  area: vendors.area,
  city: vendors.city,
  description: vendors.description,
  coverUrl: vendors.coverUrl,
  latitude: vendors.latitude,
  longitude: vendors.longitude,
  serviceRadiusKm: vendors.serviceRadiusKm,
  serviceModes: vendors.serviceModes,
  cancelCutoffHours: vendors.cancelCutoffHours,
  deliveryFeePaise: vendors.deliveryFeePaise,
  minOrderPaise: vendors.minOrderPaise,
  acceptingOrders: vendors.acceptingOrders,
};

/** The vendor's pin, else its area's locality centre, else null (distance unknown). */
function vendorPoint(
  v: { latitude: number | null; longitude: number | null; city: string; area: string },
  localities: LocalityCentroid[]
) {
  if (v.latitude != null && v.longitude != null) {
    return { latitude: v.latitude, longitude: v.longitude };
  }
  return resolveCoordinates(v.city, v.area, localities);
}

export async function listStores(opts: {
  kind?: ServiceKind;
  q?: string;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<StoreCard[]> {
  const db = getDb();
  const rows = await db
    .select({ vendor: publicVendorFields, product: products })
    .from(vendors)
    .innerJoin(products, eq(products.vendorId, vendors.id))
    .where(
      and(
        eq(vendors.status, "active"),
        isNull(products.archivedAt),
        eq(products.isAvailable, true)
      )
    );

  const [localities, category, settings, rating] = await Promise.all([
    getLocalities(),
    getCategoryMap(),
    getPlatformSettings(),
    getRatingMap(),
  ]);
  const q = opts.q?.trim().toLowerCase() ?? "";
  const byVendor = new Map<string, { vendor: (typeof rows)[number]["vendor"]; items: (typeof rows)[number]["product"][] }>();
  for (const row of rows) {
    const entry = byVendor.get(row.vendor.id) ?? { vendor: row.vendor, items: [] };
    entry.items.push(row.product);
    byVendor.set(row.vendor.id, entry);
  }

  const hasPoint = opts.latitude != null && opts.longitude != null;
  const cards: StoreCard[] = [];
  for (const { vendor, items } of byVendor.values()) {
    const kinds = Array.from(new Set(items.map((p) => p.kind as ServiceKind)));
    if (opts.kind && !kinds.includes(opts.kind)) continue;

    const matchedItems = q
      ? items.filter((p) => p.name.toLowerCase().includes(q)).map((p) => p.name)
      : [];
    if (
      q &&
      matchedItems.length === 0 &&
      !vendor.name.toLowerCase().includes(q) &&
      !vendor.area.toLowerCase().includes(q)
    ) {
      continue;
    }

    // Geofence: without a location, or beyond the discovery radius, the store is not shown at all.
    if (!hasPoint) continue;
    const p = vendorPoint(vendor, localities);
    const distanceKm = p ? haversineDistanceKm(opts.latitude!, opts.longitude!, p.latitude, p.longitude) : null;
    const reach = storeReach(distanceKm, vendor.serviceRadiusKm, settings.discoveryRadiusKm);
    if (!reach.visible) continue;
    const inRange = reach.deliverable;
    const primary = category(kinds[0] ?? "other");

    cards.push({
      id: vendor.id,
      slug: vendor.slug,
      name: vendor.name,
      area: vendor.area,
      city: vendor.city,
      description: vendor.description,
      coverUrl: vendor.coverUrl,
      kinds,
      kindLabels: kinds.map((k) => category(k).shortLabel),
      cover: { emoji: primary.emoji, coverFrom: primary.coverFrom, coverTo: primary.coverTo },
      minPricePaise: Math.min(...items.map((p) => p.pricePaise)),
      deliveryFeePaise: vendor.deliveryFeePaise,
      acceptingOrders: vendor.acceptingOrders,
      hasSubscriptions: items.some((p) => p.allowSubscription),
      distanceKm,
      inRange,
      rating: rating(vendor.id),
      itemCount: items.length,
      matchedItems,
    });
  }

  return cards.sort((a, b) => {
    if (a.inRange !== b.inRange) return a.inRange ? -1 : 1;
    return (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || a.name.localeCompare(b.name);
  });
}

export async function getStore(slug: string, point?: { latitude: number | null; longitude: number | null }) {
  const db = getDb();
  const [vendor] = await db
    .select(publicVendorFields)
    .from(vendors)
    .where(and(eq(vendors.slug, slug), eq(vendors.status, "active")))
    .limit(1);
  if (!vendor) return null;

  const items = await db
    .select()
    .from(products)
    .where(and(eq(products.vendorId, vendor.id), isNull(products.archivedAt)))
    .orderBy(asc(products.section), asc(products.pricePaise));

  const [localities, settings, rating] = await Promise.all([getLocalities(), getPlatformSettings(), getRatingMap()]);
  let distanceKm: number | null = null;
  if (point?.latitude != null && point.longitude != null) {
    const p = vendorPoint(vendor, localities);
    if (p) distanceKm = haversineDistanceKm(point.latitude, point.longitude, p.latitude, p.longitude);
  }
  const reach = storeReach(distanceKm, vendor.serviceRadiusKm, settings.discoveryRadiusKm);
  const inRange = reach.deliverable;

  return {
    vendor,
    distanceKm,
    inRange,
    visible: reach.visible,
    discoveryRadiusKm: settings.discoveryRadiusKm,
    rating: rating(vendor.id),
    items: items.map((p) => ({
      id: p.id,
      kind: p.kind as ServiceKind,
      name: p.name,
      description: p.description,
      section: p.section,
      imageUrl: p.imageUrl,
      isVeg: p.isVeg,
      shift: p.shift,
      pricePaise: p.pricePaise,
      depositPaise: p.depositPaise,
      assetName: p.assetName,
      cutoffAt: p.cutoffAt,
      isAvailable: p.isAvailable,
      allowSubscription: p.allowSubscription,
      allowOneTime: p.allowOneTime,
      durationMinutes: p.durationMinutes,
    })),
  };
}

export async function getSubscribableProduct(productId: string) {
  const db = getDb();
  const [row] = await db
    .select({ product: products, vendor: publicVendorFields })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .where(
      and(
        eq(products.id, productId),
        eq(vendors.status, "active"),
        isNull(products.archivedAt),
        eq(products.allowSubscription, true)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function getMyOrders() {
  const user = await requireUser();
  const db = getDb();
  const rows = await db
    .select({
      order: shopOrders,
      vendorName: vendors.name,
      vendorSlug: vendors.slug,
    })
    .from(shopOrders)
    .innerJoin(vendors, eq(shopOrders.vendorId, vendors.id))
    .where(eq(shopOrders.userId, user.id))
    .orderBy(desc(shopOrders.createdAt))
    .limit(50);

  const ids = rows.map((r) => r.order.id);
  const items = ids.length
    ? await db.select().from(shopOrderItems).where(inArray(shopOrderItems.orderId, ids))
    : [];
  return rows.map((r) => ({ ...r, items: items.filter((i) => i.orderId === r.order.id) }));
}

export async function getMyOrder(orderId: string) {
  const user = await requireUser();
  const db = getDb();
  const [row] = await db
    .select({
      order: shopOrders,
      vendorName: vendors.name,
      vendorSlug: vendors.slug,
      vendorArea: vendors.area,
      upiVpa: vendors.upiVpa,
    })
    .from(shopOrders)
    .innerJoin(vendors, eq(shopOrders.vendorId, vendors.id))
    .where(and(eq(shopOrders.id, orderId), eq(shopOrders.userId, user.id)))
    .limit(1);
  if (!row) return null;
  const items = await db.select().from(shopOrderItems).where(eq(shopOrderItems.orderId, orderId));
  return { ...row, items };
}

export async function getMyPlans() {
  const user = await requireUser();
  const db = getDb();
  const today = todayIST();

  const subs = await db
    .select({
      sub: subscriptions,
      product: products,
      vendorName: vendors.name,
      vendorSlug: vendors.slug,
      customerId: customers.id,
      vendorId: vendors.id,
      upiVpa: vendors.upiVpa,
    })
    .from(subscriptions)
    .innerJoin(customers, eq(subscriptions.customerId, customers.id))
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .innerJoin(vendors, eq(subscriptions.vendorId, vendors.id))
    .where(
      and(
        eq(customers.userId, user.id),
        or(isNull(subscriptions.endsOn), gte(subscriptions.endsOn, today))
      )
    )
    .orderBy(asc(vendors.name));

  const subIds = subs.map((s) => s.sub.id);
  const horizon = addDaysIST(today, 6);
  const changes = subIds.length
    ? await db
        .select()
        .from(dayChanges)
        .where(and(inArray(dayChanges.subscriptionId, subIds), gte(dayChanges.serviceDate, today)))
    : [];

  const customerIds = Array.from(new Set(subs.map((s) => s.customerId)));
  const ledger = customerIds.length
    ? await db
        .select({ customerId: ledgerEntries.customerId, amountPaise: ledgerEntries.amountPaise })
        .from(ledgerEntries)
        .where(inArray(ledgerEntries.customerId, customerIds))
    : [];

  return {
    today,
    horizon,
    plans: subs.map((s) => ({
      ...s,
      changes: changes.filter((c) => c.subscriptionId === s.sub.id && c.serviceDate <= horizon),
      balancePaise: balance(ledger.filter((l) => l.customerId === s.customerId)),
    })),
  };
}
