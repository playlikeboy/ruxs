import { VENDOR_TYPE_INFO, canUseModule, type Module, type VendorType } from "@/core/vendor-types";

export type Role = "owner" | "staff" | "driver";

export interface NavItem {
  module: Module;
  label: string;
  description: string;
  roles: Role[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const ALL: Role[] = ["owner", "staff", "driver"];
const DESK: Role[] = ["owner", "staff"];
const OWNER: Role[] = ["owner"];

/**
 * The merchant panel menu for one vendor type. Only modules the type has are
 * listed, with labels in the type's own words (a physio sees "Patients",
 * a tiffin kitchen sees "Menu & thalis").
 */
export function vendorNav(type: VendorType, role: Role): NavGroup[] {
  const info = VENDOR_TYPE_INFO[type];
  const n = info.nouns;
  const booking = info.fulfilment === "booking";

  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: n.group,
      items: [
        { module: "today", label: "Today", description: "What needs doing today.", roles: ALL },
        { module: "orders", label: "Orders", description: "One-time app orders to accept and deliver.", roles: ALL },
        { module: "bookings", label: "Calendar", description: "Your booked sessions in a day, week or list view.", roles: ALL },
        { module: "kids", label: n.catalogue, description: "Classes, workshops, enrolments and passes.", roles: DESK },
        { module: "run", label: n.run ?? "Delivery run", description: "Tower-by-tower run sheet for drivers.", roles: ALL },
        { module: "subscriptions", label: "Plans", description: "Daily and weekly subscriptions.", roles: DESK },
        { module: "availability", label: "Hours & time off", description: "Weekly hours, holidays and booking rules.", roles: DESK },
      ],
    },
    {
      title: booking ? "Practice" : "Store",
      items: [
        { module: "products", label: n.catalogue, description: "Items, prices, cutoffs and details.", roles: OWNER },
        { module: "services", label: n.catalogue, description: "What clients can book, with duration and price.", roles: OWNER },
        { module: "inventory", label: n.inventory ?? "Returnables", description: "Returnable containers and balances.", roles: ALL },
        { module: "customers", label: n.customers, description: `Your ${n.customers.toLowerCase()} and their history.`, roles: DESK },
        { module: "reviews", label: "Reviews", description: "Ratings, comments and your public replies.", roles: DESK },
        { module: "disputes", label: "Disputes", description: "Issues raised by households.", roles: DESK },
      ],
    },
    {
      title: "Money",
      items: [
        { module: "earnings", label: "Earnings", description: "Online payments and monthly withdrawals.", roles: DESK },
        { module: "bills", label: "Bills", description: "Monthly invoices and balances.", roles: DESK },
        { module: "analytics", label: "Analytics", description: "Last 30 days of orders and best sellers.", roles: DESK },
      ],
    },
    {
      title: "Account",
      items: [{ module: "settings", label: "Settings", description: "Profile, storefront, password and team.", roles: OWNER }],
    },
  ];

  return groups
    .map((g) => ({ title: g.title, items: g.items.filter((i) => canUseModule(type, i.module) && i.roles.includes(role)) }))
    .filter((g) => g.items.length > 0);
}

/** Four bottom tabs for phones; everything else lives under More. */
export function vendorTabs(type: VendorType): { module: Module; label: string }[] {
  const n = VENDOR_TYPE_INFO[type].nouns;
  switch (type) {
    case "kids":
      return [
        { module: "today", label: "Today" },
        { module: "kids", label: n.catalogueShort },
        { module: "bookings", label: "Calendar" },
        { module: "availability", label: "Hours" },
      ];
    case "fitness":
    case "physio":
    case "mehndi":
      return [
        { module: "today", label: "Today" },
        { module: "bookings", label: "Calendar" },
        { module: "services", label: n.catalogueShort },
        { module: "customers", label: n.customers },
      ];
    case "gifts":
      return [
        { module: "today", label: "Today" },
        { module: "orders", label: "Orders" },
        { module: "products", label: n.catalogueShort },
        { module: "reviews", label: "Reviews" },
      ];
    default:
      return [
        { module: "today", label: "Today" },
        { module: "orders", label: "Orders" },
        { module: "subscriptions", label: "Plans" },
        { module: "products", label: n.catalogueShort },
      ];
  }
}
