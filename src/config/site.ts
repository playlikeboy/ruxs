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
  name: "RUXs",
  legalName: "RUXs Technologies",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://ruxs.in",
  ogImage: "https://ruxs.in/og.png",
  description:
    "RUXs helps local vendors manage orders, deliveries and household accounts while setting their own product prices.",
  cities: [
    {
      slug: "bengaluru",
      name: "Bengaluru",
      state: "Karnataka",
      active: true,
      areas: ["HSR Layout", "Koramangala", "BTM Layout", "Bellandur", "Indiranagar", "Whitefield"],
    },
    {
      slug: "mumbai",
      name: "Mumbai",
      state: "Maharashtra",
      active: true,
      areas: ["Andheri", "Bandra", "Powai", "Thane", "Navi Mumbai"],
    },
    {
      slug: "delhi-ncr",
      name: "Delhi NCR",
      state: "Delhi",
      active: true,
      areas: ["Gurgaon", "Noida", "South Delhi", "Dwarka"],
    },
    {
      slug: "hyderabad",
      name: "Hyderabad",
      state: "Telangana",
      active: true,
      areas: ["Madhapur", "Gachibowli", "Kondapur", "Hitec City"],
    },
    {
      slug: "pune",
      name: "Pune",
      state: "Maharashtra",
      active: true,
      areas: ["Hinjewadi", "Kothrud", "Viman Nagar", "Baner", "Wakad"],
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
