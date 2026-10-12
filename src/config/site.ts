export interface CityConfig {
  slug: string;
  name: string;
  state: string;
  active: boolean;
  areas: string[];
}

export interface VendorTypeConfig {
  id: "tiffin" | "water";
  slug: string;
  title: string;
  tagline: string;
  singular: string;
}

export interface PlanConfig {
  id: string;
  name: string;
  priceINR: number;
  householdsLimit: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export const siteConfig = {
  name: "RUXS",
  legalName: "RUXS Technologies",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://ruxs.in",
  ogImage: "https://ruxs.in/og.png",
  description:
    "RUXS locks tomorrow's count at your cutoff, gives your driver a clean run sheet, and keeps a khata every household can see.",
  cities: [
    {
      slug: "bengaluru",
      name: "Bengaluru",
      state: "Karnataka",
      active: true,
      areas: ["HSR Layout", "Koramangala", "BTM Layout", "Bellandur", "Indiranagar"],
    },
  ] as CityConfig[],
  vendorTypes: [
    {
      id: "tiffin",
      slug: "tiffin-services",
      title: "Tiffin Services",
      tagline: "Lock tomorrow's meal count by 10 AM, zero food wasted.",
      singular: "Tiffin Kitchen",
    },
    {
      id: "water",
      slug: "water-suppliers",
      title: "20L Water Suppliers",
      tagline: "Track every can delivered and returned at every door.",
      singular: "Water Supplier",
    },
  ] as VendorTypeConfig[],
  plans: [
    {
      id: "free",
      name: "Free",
      priceINR: 0,
      householdsLimit: 20,
      description: "For neighbourhood kitchens and depots starting out.",
      features: [
        "Up to 20 households",
        "Automated cutoff counts",
        "Driver run sheet",
        "Private household link",
        "Digital khata & monthly UPI bills",
      ],
    },
    {
      id: "starter",
      name: "Growth",
      priceINR: 499,
      householdsLimit: 80,
      description: "For active kitchens with a full daily delivery route.",
      popular: true,
      features: [
        "Up to 80 households",
        "Automated cutoff counts",
        "Driver run sheet with offline retry",
        "Can & asset tracking",
        "Custom cutoff & late rules",
        "Monthly UPI bill links",
      ],
    },
    {
      id: "pro",
      name: "Scale",
      priceINR: 1499,
      householdsLimit: 250,
      description: "For large kitchens running multiple delivery shifts.",
      features: [
        "Up to 250 households",
        "Multiple staff and driver logins",
        "Separate lunch & dinner shifts",
        "Detailed khata reconciliation",
        "Priority WhatsApp & phone support",
      ],
    },
  ] as PlanConfig[],
};
