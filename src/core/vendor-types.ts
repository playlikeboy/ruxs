/**
 * Every merchant on RUXs is exactly one vendor type. The type decides which
 * database tables hold its profile and catalogue details, and which merchant
 * panel tools it can open. Pure: no db, next or react imports.
 */

export const KIDS_VENDOR_TYPES = [
  "kids_academics",
  "kids_stem",
  "kids_performing_arts",
  "kids_arts_crafts",
  "kids_school_projects",
  "kids_camps",
  "kids_sports_fitness",
  "kids_life_skills",
  "kids_products",
  "kids_institutions",
] as const;

export type KidsVendorType = (typeof KIDS_VENDOR_TYPES)[number];

export const VENDOR_TYPES = [
  "tiffin",
  "water",
  "milk",
  "gifts",
  "store",
  "fitness",
  "physio",
  "mehndi",
  "kids", // legacy alias
  ...KIDS_VENDOR_TYPES,
] as const;

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
const KIDS_BOOKING = [...COMMON, "kids", "bookings", "availability"] as const;

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
    modules: KIDS_BOOKING,
    nouns: { customers: "Students & parents", catalogue: "Classes & workshops", catalogueShort: "Classes", group: "Academy" },
  },

  // ── 10 Differentiated Kids Vendor Types ──────────────────────────────────────
  kids_academics: {
    label: "Home Tutors & Academics",
    emoji: "📚",
    fulfilment: "booking",
    modules: KIDS_BOOKING,
    nouns: { customers: "Students & Parents", catalogue: "Tuition & Classes", catalogueShort: "Tuition", group: "Academics" },
  },
  kids_stem: {
    label: "Science, STEM & Coding",
    emoji: "🤖",
    fulfilment: "booking",
    modules: KIDS_BOOKING,
    nouns: { customers: "Young Coders", catalogue: "STEM & Robotics", catalogueShort: "STEM", group: "Lab" },
  },
  kids_performing_arts: {
    label: "Dance, Music & Performing Arts",
    emoji: "💃",
    fulfilment: "booking",
    modules: KIDS_BOOKING,
    nouns: { customers: "Performers & Parents", catalogue: "Dance & Music Lessons", catalogueShort: "Lessons", group: "Studio" },
  },
  kids_arts_crafts: {
    label: "Art, Craft & Creative",
    emoji: "🎨",
    fulfilment: "booking",
    modules: KIDS_BOOKING,
    nouns: { customers: "Little Creators", catalogue: "Art & Pottery Classes", catalogueShort: "Art", group: "Art Studio" },
  },
  kids_school_projects: {
    label: "School Projects & Models",
    emoji: "📐",
    fulfilment: "booking",
    modules: KIDS_BOOKING,
    nouns: { customers: "Students & Parents", catalogue: "Models & Project Guidance", catalogueShort: "Projects", group: "Project Lab" },
  },
  kids_camps: {
    label: "Holiday Camps & Clubs",
    emoji: "🏕️",
    fulfilment: "booking",
    modules: KIDS_BOOKING,
    nouns: { customers: "Campers & Parents", catalogue: "Camps & Bootcamps", catalogueShort: "Camps", group: "Camp" },
  },
  kids_sports_fitness: {
    label: "Kids Yoga, Chess & Sports",
    emoji: "♟️",
    fulfilment: "booking",
    modules: KIDS_BOOKING,
    nouns: { customers: "Young Athletes", catalogue: "Sports & Chess Coaching", catalogueShort: "Coaching", group: "Academy" },
  },
  kids_life_skills: {
    label: "Life Skills & Hobbies",
    emoji: "🍳",
    fulfilment: "booking",
    modules: KIDS_BOOKING,
    nouns: { customers: "Learners & Parents", catalogue: "Hobby & Life Workshops", catalogueShort: "Workshops", group: "Workshop" },
  },
  kids_products: {
    label: "Kids Kits & Materials",
    emoji: "🧩",
    fulfilment: "delivery", // physical product kits & materials
    modules: [...COMMON, "orders", "run", "products", "inventory", "analytics"],
    nouns: { customers: "Parents & Buyers", catalogue: "DIY Kits & Supplies", catalogueShort: "Kits", run: "Dispatch", inventory: "Kit Stock", group: "Store" },
  },
  kids_institutions: {
    label: "Preschools & Learning Centres",
    emoji: "🏫",
    fulfilment: "booking",
    modules: KIDS_BOOKING,
    nouns: { customers: "Families & Enrollees", catalogue: "Programmes & Activities", catalogueShort: "Programmes", group: "Centre" },
  },
};

export function isVendorType(value: unknown): value is VendorType {
  return typeof value === "string" && (VENDOR_TYPES as readonly string[]).includes(value);
}

export function isKidsVendorType(value: unknown): boolean {
  return typeof value === "string" && (value === "kids" || value.startsWith("kids_") || (KIDS_VENDOR_TYPES as readonly string[]).includes(value as any));
}

/** Unknown or legacy values fall back to the safest type for their fulfilment. */
export function toVendorType(value: string | null | undefined, fulfilment: string = "delivery"): VendorType {
  if (isVendorType(value)) return value;
  return fulfilment === "booking" ? "fitness" : "store";
}

/** The schema type a category onboards vendors as. */
export function vendorTypeForCategory(categoryId: string | null | undefined, fulfilment: string = "delivery"): VendorType {
  switch (categoryId) {
    case "tiffin":
    case "water":
    case "gifts":
    case "fitness":
    case "physio":
    case "mehndi":
    case "kids":
    case "kids_academics":
    case "kids_stem":
    case "kids_performing_arts":
    case "kids_arts_crafts":
    case "kids_school_projects":
    case "kids_camps":
    case "kids_sports_fitness":
    case "kids_life_skills":
    case "kids_products":
    case "kids_institutions":
      return categoryId;
    case "milk":
    case "dairy":
      return "milk";
    case "academics":
      return "kids_academics";
    case "stem":
    case "coding":
      return "kids_stem";
    case "dance":
    case "music":
    case "performing-arts":
      return "kids_performing_arts";
    case "art":
    case "craft":
    case "art-craft":
      return "kids_arts_crafts";
    case "projects":
    case "school-projects":
      return "kids_school_projects";
    case "camps":
    case "workshops":
    case "holiday-camps":
      return "kids_camps";
    case "chess":
    case "sports":
    case "fitness-kids":
      return "kids_sports_fitness";
    case "life-skills":
    case "cooking":
      return "kids_life_skills";
    case "kits":
    case "kids-kits":
    case "kids_materials":
      return "kids_products";
    case "preschool":
    case "academy":
    case "institutions":
      return "kids_institutions";
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
 * Categories a vendor may list items under: only its own.
 */
export function allowedCategoryIds(type: VendorType, categoryId: string | null | undefined): string[] {
  if (categoryId) return [categoryId];
  return [type === "store" ? "other" : type];
}
