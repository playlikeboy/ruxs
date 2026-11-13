/** Homepage copy and links. Facts here must match what the app actually does. */

export type RailItem = { label: string; theme: string; href: string };

/** Kids Zone: classes, workshops and kits. `theme` picks the drawn cover art. */
export const kidsRail: RailItem[] = [
  { label: "Dance & music", theme: "music", href: "/app/kids/activities" },
  { label: "Robotics & coding", theme: "stem", href: "/app/kids/activities" },
  { label: "Art & pottery", theme: "arts", href: "/app/kids/activities" },
  { label: "Chess & logic", theme: "logic", href: "/app/kids/activities" },
  { label: "Workshops & camps", theme: "camp", href: "/app/kids/workshops" },
  { label: "Learning kits", theme: "kits", href: "/app/kids/kits" },
];

export const kidsFacts = ["Providers reviewed by RUXs", "The teacher confirms your slot", "Pay per session"];

/** What the RUXs Store (RUXs's own shop) carries. Keep in step with the seeded store categories. */
export type StoreShelfItem = { label: string; icon: "diy" | "robotics" | "science" | "art" | "puzzles" };

export const storeShelf: StoreShelfItem[] = [
  { label: "DIY kits", icon: "diy" },
  { label: "Robotics", icon: "robotics" },
  { label: "Science kits", icon: "science" },
  { label: "Art supplies", icon: "art" },
  { label: "Puzzles", icon: "puzzles" },
];

/** Daily essentials and local services. */
export const everydayRail: RailItem[] = [
  { label: "Tiffin", theme: "tiffin", href: "/app/category/tiffin" },
  { label: "Water", theme: "water", href: "/app/category/water" },
  { label: "Milk", theme: "milk", href: "/app/category/milk" },
  { label: "Stores", theme: "store", href: "/app/category/other" },
  { label: "Gifts", theme: "gifts", href: "/app/category/gifts" },
  { label: "Mehndi", theme: "mehndi", href: "/app/category/mehndi" },
  { label: "Fitness", theme: "fitness", href: "/app/category/fitness" },
  { label: "Physio", theme: "physio", href: "/app/category/physio" },
];

/** Shown on the page and sent as FAQ JSON-LD, so the two always match. */
export const faqs = [
  {
    question: "What is RUXs?",
    answer:
      "One app for your neighbourhood: kids' classes, workshops and learning kits, daily tiffin, water cans and milk, local stores, gifts, mehndi artists, fitness trainers and physio. RUXs also runs its own RUXs Store. The name stands for Recurring Utility eXperience.",
  },
  {
    question: "What is the RUXs Store?",
    answer:
      "A shop run by RUXs itself, inside Kids Zone. It sells DIY kits, robotics and electronics kits, science and lab kits, art and painting supplies and puzzles. RUXs sets the prices and ships orders across India.",
  },
  {
    question: "Is RUXs available where I live?",
    answer:
      "Classes and daily services work neighbourhood by neighbourhood. Open the app and share your location to see who serves you. If nothing shows yet, we are not in your area yet.",
  },
  {
    question: "How are kids' providers checked?",
    answer:
      "Kids providers are reviewed by RUXs before they can take bookings. When you book a class, the provider confirms it, and you see the status in your bookings.",
  },
  {
    question: "How do I pay?",
    answer:
      "For classes, pay the provider per session in cash or by UPI. For daily orders, pay on delivery or add them to your monthly bill and pay once. Each provider sets its own prices.",
  },
  {
    question: "Do I need to download an app?",
    answer: "No. RUXs runs in your phone's browser, and you can add it to your home screen like an app.",
  },
];
