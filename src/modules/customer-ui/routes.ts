import type { NavTabId } from "@/src/design-system/components/DSBottomNav";

export const CUSTOMER_ROUTES = {
  home: "/app",
  search: "/app/search",
  services: "/app/services",
  tracking: "/app/tracking",
  khata: "/app/khata",
  cart: "/app/cart",
  notifications: "/app/notifications",
  location: "/app/location",
} as const;

export const CUSTOMER_TAB_ROUTES: Record<NavTabId, string> = {
  home: CUSTOMER_ROUTES.home,
  favorites: CUSTOMER_ROUTES.services,
  tracking: CUSTOMER_ROUTES.tracking,
  profile: CUSTOMER_ROUTES.khata,
  cart: CUSTOMER_ROUTES.cart,
};

export function buildCustomerUrl(
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>
): string {
  if (!params) return path;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    query.set(key, String(value));
  }
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

export function categoryFromParam(value: string | null | undefined) {
  const normalized = String(value || "ALL").trim().toUpperCase();
  const aliases: Record<string, string> = {
    FASTFOOD: "FAST_FOOD",
    FAST_FOOD: "FAST_FOOD",
    MILK: "MILK",
    WATER: "WATER",
    TIFFIN: "TIFFIN",
    FLOWERS: "FLOWERS",
    PETS: "PETS",
    PET_SERVICES: "PETS",
    LAUNDRY: "LAUNDRY",
    MEAT: "MEAT",
    DRINKS: "DRINKS",
    ALL: "ALL",
  };
  return aliases[normalized] || "ALL";
}
