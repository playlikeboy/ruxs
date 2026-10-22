/**
 * Every merchant on RUXs is exactly one vendor type. The type decides which
 * database tables hold its profile and catalogue details, and which merchant
 * panel tools it can open. Pure: no db, next or react imports.
 */

export const VENDOR_TYPES = ["tiffin", "water", "milk", "gifts", "store", "fitness", "physio", "mehndi", "kids"] as const;
export type VendorType = (typeof VENDOR_TYPES)[number];

/** A merchant panel area, i.e. the folder under /merchant-panel/[vendor]. */
export const MODULES = [
  "today",
  "orders",
  "run",
  "subscriptions",
  "products",
  "inventory",
  "bills",
  "analytics",
  "bookings",
  "availability",
  "services",
  "kids",
  "customers",
  "reviews",
  "disputes",
  "earnings",
  "settings",
  "more",
] as const;
export type Module = (typeof MODULES)[number];

export interface VendorTypeInfo {
  label: string;
  emoji: string;
  fulfilment: "delivery" | "booking";
  modules: readonly Module[];
  /** Labels the panel uses for this type, so a physio never sees "Menu". */
  nouns: {
    customers: string;
    catalogue: string;
    catalogueShort: string;
    run?: string;
    inventory?: string;
    group: string;
  };
}

const COMMON = ["today", "customers", "reviews", "disputes", "earnings", "settings", "more"] as const;
const DAILY_DELIVERY = [...COMMON, "orders", "run", "subscriptions", "products", "inventory", "bills", "analytics"] as const;
const BOOKING = [...COMMON, "bookings", "availability", "services"] as const;

export const VENDOR_TYPE_INFO: Record<VendorType, VendorTypeInfo> = {
  tiffin: {
    label: "Tiffin kitchen",
    emoji: "🍱",
    fulfilment: "delivery",
    modules: DAILY_DELIVERY,
    nouns: { customers: "Subscribers", catalogue: "Menu & thalis", catalogueShort: "Menu", run: "Kitchen run", inventory: "Dabbas", group: "Kitchen" },
  },
  water: {
    label: "Water supplier",
    emoji: "💧",
    fulfilment: "delivery",
    modules: DAILY_DELIVERY,
    nouns: { customers: "Households", catalogue: "Cans & bottles", catalogueShort: "Cans", run: "Dispatch run", inventory: "Can balances", group: "Supply" },
  },
  milk: {
    label: "Dairy",
    emoji: "🥛",
    fulfilment: "delivery",
    modules: DAILY_DELIVERY,
    nouns: { customers: "Households", catalogue: "Dairy products", catalogueShort: "Products", run: "Morning run", inventory: "Bottles & crates", group: "Dairy" },
  },
  gifts: {
    label: "Gift studio",
    emoji: "🎁",
    fulfilment: "delivery",
    modules: [...COMMON, "orders", "products", "analytics"],
    nouns: { customers: "Customers", catalogue: "Gift catalogue", catalogueShort: "Catalogue", group: "Studio" },
  },
  store: {
    label: "Local store",
    emoji: "🧺",
    fulfilment: "delivery",
    modules: [...COMMON, "orders", "run", "subscriptions", "products", "bills", "analytics"],
    nouns: { customers: "Customers", catalogue: "Products", catalogueShort: "Products", run: "Delivery run", group: "Store" },
  },
  fitness: {
    label: "Fitness trainer",
    emoji: "🏋️",
    fulfilment: "booking",
    modules: BOOKING,
    nouns: { customers: "Clients", catalogue: "Training plans", catalogueShort: "Plans", group: "Training" },
  },
  physio: {
    label: "Physiotherapist",
    emoji: "🩺",
    fulfilment: "booking",
    modules: BOOKING,
    nouns: { customers: "Patients", catalogue: "Treatments", catalogueShort: "Treatments", group: "Clinic" },
  },
  mehndi: {
    label: "Mehndi artist",
    emoji: "🌿",
    fulfilment: "booking",
    modules: BOOKING,
    nouns: { customers: "Clients", catalogue: "Design packages", catalogueShort: "Packages", group: "Appointments" },
  },
  kids: {
    label: "Kids academy",
    emoji: "🧸",
    fulfilment: "booking",
    modules: [...COMMON, "kids", "bookings", "availability"],
    nouns: { customers: "Students & parents", catalogue: "Classes & workshops", catalogueShort: "Classes", group: "Academy" },
  },
};

export function isVendorType(value: unknown): value is VendorType {
  return typeof value === "string" && (VENDOR_TYPES as readonly string[]).includes(value);
}

/** Unknown or legacy values fall back to the safest type for their fulfilment. */
export function toVendorType(value: string | null | undefined, fulfilment: string = "delivery"): VendorType {
  if (isVendorType(value)) return value;
  return fulfilment === "booking" ? "fitness" : "store";
}

/** The schema type a category onboards vendors as. kids-kits and other are plain stores. */
export function vendorTypeForCategory(categoryId: string | null | undefined, fulfilment: string = "delivery"): VendorType {
  switch (categoryId) {
    case "tiffin":
    case "water":
    case "gifts":
    case "fitness":
    case "physio":
    case "mehndi":
    case "kids":
      return categoryId;
    case "milk":
    case "dairy":
      return "milk";
    default:
      return fulfilment === "booking" ? "fitness" : "store";
  }
}

export function canUseModule(type: VendorType, module: Module): boolean {
  return VENDOR_TYPE_INFO[type].modules.includes(module);
}

/** Where a vendor lands when it opens a tool its type does not have. */
export function homeModule(type: VendorType): Module {
  return VENDOR_TYPE_INFO[type].fulfilment === "booking" ? "bookings" : "orders";
}

/**
 * Categories a vendor may list items under: only its own. A tiffin kitchen
 * can't add a water can, a physio can't add a gym plan.
 */
export function allowedCategoryIds(type: VendorType, categoryId: string | null | undefined): string[] {
  if (categoryId) return [categoryId];
  return [type === "store" ? "other" : type];
}
