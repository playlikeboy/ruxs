/** Homepage copy and links. Facts here must match what the app actually does. */

export type DaySlot = {
  minutes: number; // minutes after midnight, IST
  time: string;
  name: string;
  detail: string;
  href: string;
  icon: "milk" | "water" | "tiffin" | "kids" | "bill";
};

export const daySlots: DaySlot[] = [
  { minutes: 6 * 60, time: "6:00", name: "Milk at the door", detail: "A daily plan with your dairy", href: "/app/category/milk", icon: "milk" },
  { minutes: 8 * 60 + 30, time: "8:30", name: "Water can", detail: "20L cans, empties go back", href: "/app/category/water", icon: "water" },
  { minutes: 13 * 60, time: "13:00", name: "Tiffin lunch", detail: "Skip it before the kitchen's cutoff", href: "/app/category/tiffin", icon: "tiffin" },
  { minutes: 16 * 60 + 30, time: "16:30", name: "Dance class", detail: "Kids classes, confirmed by the teacher", href: "/app/kids", icon: "kids" },
  { minutes: 19 * 60, time: "19:00", name: "One bill", detail: "All of it, monthly", href: "#monthly-bill", icon: "bill" },
];

export const everyday = [
  { name: "Tiffin and meals", detail: "Daily lunch and dinner plans from home kitchens", href: "/app/category/tiffin" },
  { name: "Water cans", detail: "20L cans on your days, with can returns tracked", href: "/app/category/water" },
  { name: "Milk and dairy", detail: "Morning delivery you can pause any day", href: "/app/category/milk" },
  { name: "Local stores", detail: "Order from shops nearby, pay on delivery", href: "/app/category/other" },
];

export const family = [
  { name: "RUXs Store", detail: "DIY kits, robotics, science kits, art supplies and puzzles. Delivering in Ranchi for now", href: "/app/kids/shop" },
  { name: "Dance & music classes", detail: "Kathak, western, hip-hop, guitar and vocals", href: "/app/kids" },
  { name: "STEM, robotics & coding", detail: "Hands-on robotics, programming and science", href: "/app/kids" },
  { name: "Art, pottery & craft", detail: "Clay modeling, sketching and creative workshops", href: "/app/kids" },
  { name: "Chess & academic tutors", detail: "Strategy, abacus, math and subject mentors", href: "/app/kids" },
  { name: "Holiday camps & DIY kits", detail: "Weekend bootcamps and learning kits delivered home", href: "/app/kids/kits" },
];

export const specialists = [
  { name: "Gifts", detail: "Gift shops and hampers from nearby sellers", href: "/app/category/gifts" },
  { name: "Mehndi artists", detail: "Book a local artist for an occasion", href: "/app/category/mehndi" },
  { name: "Fitness trainers", detail: "Sessions and packages from trainers near you", href: "/app/category/fitness" },
  { name: "Physiotherapy", detail: "Book a session with a local physio", href: "/app/category/physio" },
];

export const merchantTools = [
  "Orders and recurring plans in one list",
  "A delivery run sheet for your route",
  "Monthly bills worked out from every delivery",
  "A bookings calendar for classes and sessions",
  "Class, workshop and kit listings for kids providers",
];

export const faqs = [
  {
    question: "What does RUXs stand for?",
    answer:
      "RUXs stands for Recurring Utility eXperience. It connects your family with neighbourhood services: kids' classes, workshops and learning kits, daily tiffin, water cans and milk, local stores, gifts, mehndi artists, fitness trainers and physio. RUXs also runs its own RUXs Store for kids' kits and supplies.",
  },
  {
    question: "What classes and activities are available for children on RUXs?",
    answer:
      "RUXs Kids Zone includes dance classes (Kathak, Bharatnatyam, Western, Hip-Hop), robotics and STEM coding, pottery and painting workshops, chess coaching, academic tutors, musical instrument lessons, holiday camps, and DIY activity kits delivered to your doorstep. What you see depends on the providers in your area.",
  },
  {
    question: "What is the RUXs Store?",
    answer:
      "The RUXs Store is a shop run by RUXs itself, inside Kids Zone. It sells DIY kits, robotics and electronics kits, science and lab kits, art and painting supplies and puzzles. RUXs sets the prices. It delivers in Ranchi for now.",
  },
  {
    question: "How can I contact RUXs support?",
    answer:
      "You can email us directly at adminruxs@gmail.com or message us on WhatsApp at 9610201507 (Contact Only on WhatsApp). We are available to help households and merchants with orders, bookings, plans and questions.",
  },
  {
    question: "Is RUXs available where I live?",
    answer:
      "RUXs works neighbourhood by neighbourhood. Open the app and share your location to see the stores and providers that deliver to you. If nothing shows yet, we are not in your area yet.",
  },
  {
    question: "How do I skip a delivery?",
    answer:
      "Each store sets a daily cutoff, for example 10:00 AM for lunch. Change tomorrow's delivery before then from the app or from your private household link, and that day is skipped.",
  },
  {
    question: "What is the private household link?",
    answer:
      "Stores can send your home a private link. Anyone in the family can open it to deliver, skip or add an extra, without signing in. Keep it private, like a house key.",
  },
  {
    question: "How do I pay?",
    answer:
      "Pay on delivery, or add orders to your monthly bill and pay once. Monthly bills are worked out from each delivery recorded during the month.",
  },
  {
    question: "Does RUXs take a commission?",
    answer:
      "No commission on pay-on-delivery or monthly-bill orders. Online payments may carry a small fee, which is shown before you pay.",
  },
  {
    question: "How are kids' providers checked?",
    answer:
      "Kids providers are reviewed by RUXs before they can take bookings. When you book a class, the provider confirms it, and you see the status in your bookings.",
  },
  {
    question: "Do I need to download an app?",
    answer:
      "No. RUXs runs in your phone's browser, and you can add it to your home screen like an app.",
  },
];
