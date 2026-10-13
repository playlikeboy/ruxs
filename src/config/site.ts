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

export const siteConfig = {
  name: "RUXS",
  legalName: "RUXS Technologies",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://ruxs.in",
  ogImage: "https://ruxs.in/og.png",
  description:
    "RUXS helps local vendors manage orders, deliveries and household accounts while setting their own product prices.",
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
      tagline: "Lock tomorrow's meal count by your own cutoff time.",
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
};
