import "server-only";

import { eq } from "drizzle-orm";
import { db, isTestEnv } from "@/src/shared/db";
import {
  products as productsTable,
  services as servicesTable,
  tenants as tenantsTable,
} from "@/src/shared/db/schema";
import type {
  CatalogProduct,
  CatalogVendor,
  ServiceCategory,
  ServiceCategoryId,
  CustomerCatalog,
} from "./types";

const CATEGORY_LABELS: Record<ServiceCategoryId, string> = {
  ALL: "All Items",
  FAST_FOOD: "Food",
  MILK: "Milk",
  WATER: "Water",
  TIFFIN: "Tiffin",
  FLOWERS: "Flowers",
  PETS: "Pet Care",
  LAUNDRY: "Laundry",
  MEAT: "Meat",
  DRINKS: "Beverages",
};

const VENDOR_TYPE_TO_CATEGORY: Record<string, ServiceCategoryId> = {
  MILKMAN: "MILK",
  WATER_SERVICE: "WATER",
  TIFFIN: "TIFFIN",
  FLOWERS: "FLOWERS",
  PET_SERVICES: "PETS",
  LAUNDRY: "LAUNDRY",
};

interface TenantConfig {
  coveredSocieties?: string[];
  rating?: number;
  reviewCount?: number;
  deliverySlots?: string[];
  shifts?: Array<{ id?: string; label?: string; name?: string; timing?: string; cutoff?: string; cutoffTime?: string }>;
}

function parseConfig(value: string | null): TenantConfig {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function vendorCategory(vendorType: string): ServiceCategoryId {
  return VENDOR_TYPE_TO_CATEGORY[vendorType] || "ALL";
}

function safeImage(): string {
  return "/icon.svg";
}

function mapVendor(
  row: typeof tenantsTable.$inferSelect,
  config: TenantConfig,
  services: typeof servicesTable.$inferSelect[],
): CatalogVendor {
  const category = vendorCategory(row.vendorType);
  const shifts = Array.isArray(config.shifts) ? config.shifts : [];
  const deliveryWindow =
    config.deliverySlots?.join(" · ") ||
    shifts
      .map((shift) => shift.timing || shift.label || shift.name || "")
      .filter(Boolean)
      .join(" · ") ||
    "Scheduled delivery";

  return {
    id: row.id,
    name: row.businessName,
    category,
    image: safeImage(),
    bannerImage: safeImage(),
    rating: Number.isFinite(config.rating) ? Number(config.rating) : 0,
    reviewCount: Number.isFinite(config.reviewCount) ? Number(config.reviewCount) : 0,
    deliveryWindow,
    address: row.address || "Address pending",
    fssaiNumber: row.fssaiNumber || "",
    description:
      services.find((service) => service.description)?.description ||
      `${row.businessName} — local recurring household service.`,
    societiesCovered: Array.isArray(config.coveredSocieties) ? config.coveredSocieties : [],
    isVerified: row.status === "VERIFIED",
    badge: row.status === "VERIFIED" ? "Verified merchant" : undefined,
    openingHours: deliveryWindow,
    minOrderPaise: 0,
    phone: row.phone,
    tags: [CATEGORY_LABELS[category]],
  };
}

export async function getCustomerCatalog(): Promise<CustomerCatalog> {
  if (isTestEnv) {
    return { vendors: [], products: [], categories: [] };
  }

  const [tenantRows, serviceRows, productRows] = await Promise.all([
    db.select().from(tenantsTable).where(eq(tenantsTable.status, "VERIFIED")),
    db.select().from(servicesTable).where(eq(servicesTable.isActive, true)),
    db.select().from(productsTable).where(eq(productsTable.isActive, true)),
  ]);

  const servicesByTenant = new Map<string, typeof serviceRows>();
  for (const service of serviceRows) {
    const list = servicesByTenant.get(service.tenantId) || [];
    list.push(service);
    servicesByTenant.set(service.tenantId, list);
  }

  const tenantsById = new Map(tenantRows.map((row) => [row.id, row] as const));
  const servicesById = new Map(serviceRows.map((row) => [row.id, row] as const));

  const vendors = tenantRows.map((row) =>
    mapVendor(row, parseConfig(row.typeConfig), servicesByTenant.get(row.id) || [])
  );

  const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor] as const));

  const products: CatalogProduct[] = [];
  for (const product of productRows) {
    const vendor =
      vendorMap.get(product.tenantId) ||
      vendorMap.get(tenantsById.get(product.tenantId)?.id || "");
    const service = servicesById.get(product.serviceId);
    if (!vendor || !service) continue;

    const category =
      (service.category as ServiceCategoryId) in CATEGORY_LABELS
        ? (service.category as ServiceCategoryId)
        : vendor.category;

    products.push({
      id: product.id,
      name: product.name,
      category,
      vendorId: vendor.id,
      vendorName: vendor.name,
      pricePaise: product.basePricePaise,
      originalPricePaise: undefined,
      deliveryWindow: service.cutoffTimeStr
        ? `Cutoff ${service.cutoffTimeStr}`
        : "Scheduled delivery",
      image: safeImage(),
      rating: vendor.rating,
      reviewCount: vendor.reviewCount,
      description: service.description || `${product.name} from ${vendor.name}.`,
      isBestSeller: false,
      isGeofenceGuaranteed: false,
      unit: product.unitType.toLowerCase(),
    });
  }

  const counts = new Map<ServiceCategoryId, number>();
  for (const product of products) {
    counts.set(product.category, (counts.get(product.category) || 0) + 1);
  }

  const orderedCategories: ServiceCategoryId[] = [
    "ALL",
    "MILK",
    "WATER",
    "TIFFIN",
    "FLOWERS",
    "PETS",
    "LAUNDRY",
    "FAST_FOOD",
    "MEAT",
    "DRINKS",
  ];

  const categories = orderedCategories
    .filter((id) => id === "ALL" || (counts.get(id) || 0) > 0)
    .map((id) => ({
      id,
      label: CATEGORY_LABELS[id],
      iconName: id,
      count: id === "ALL" ? products.length : counts.get(id) || 0,
    }));

  return { vendors, products, categories };
}

export async function getCustomerProductById(id: string): Promise<CatalogProduct | null> {
  const catalog = await getCustomerCatalog();
  return catalog.products.find((product) => product.id === id) || null;
}

export async function getCustomerVendorById(id: string): Promise<CatalogVendor | null> {
  const catalog = await getCustomerCatalog();
  return catalog.vendors.find((vendor) => vendor.id === id) || null;
}

export async function getCustomerProductsByVendor(vendorId: string): Promise<CatalogProduct[]> {
  const catalog = await getCustomerCatalog();
  return catalog.products.filter((product) => product.vendorId === vendorId);
}
