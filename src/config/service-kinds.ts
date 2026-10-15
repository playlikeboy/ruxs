export type ServiceKind = "tiffin" | "water" | "milk" | "other";

export interface ServiceKindConfig {
  id: ServiceKind;
  label: string;
  short: string;
  emoji: string;
  blurb: string;
  /** Tailwind classes for the cover gradient when a store has no photo. */
  cover: string;
  tint: string;
}

export const SERVICE_KINDS: ServiceKindConfig[] = [
  {
    id: "tiffin",
    label: "Tiffin service",
    short: "Tiffin",
    emoji: "🍱",
    blurb: "Home-style meals, daily or one-off",
    cover: "from-[#FFD9C7] via-[#FFE8DD] to-[#FFF3C9]",
    tint: "bg-peach",
  },
  {
    id: "water",
    label: "Water delivery",
    short: "Water",
    emoji: "💧",
    blurb: "20L cans to your door",
    cover: "from-[#CFE3F7] via-[#E2EEFA] to-[#E1F3E7]",
    tint: "bg-sky",
  },
  {
    id: "milk",
    label: "Milk & dairy",
    short: "Milk",
    emoji: "🥛",
    blurb: "Fresh milk, curd and paneer",
    cover: "from-[#FFF3C9] via-[#FFFBEA] to-[#E1F3E7]",
    tint: "bg-butter",
  },
  {
    id: "other",
    label: "Other essentials",
    short: "More",
    emoji: "🧺",
    blurb: "Everything else for the house",
    cover: "from-[#FCE4EC] via-[#FFE8DD] to-[#E2EEFA]",
    tint: "bg-blush",
  },
];

export const SERVICE_KIND_IDS = SERVICE_KINDS.map((k) => k.id) as [ServiceKind, ...ServiceKind[]];

export function getServiceKind(id: string): ServiceKindConfig {
  return SERVICE_KINDS.find((k) => k.id === id) ?? SERVICE_KINDS[3]!;
}

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export const SLOT_LABEL: Record<string, string> = {
  asap: "As soon as possible",
  morning: "Morning (7–10 am)",
  lunch: "Lunch (12–2 pm)",
  evening: "Evening (4–7 pm)",
  dinner: "Dinner (7–9 pm)",
};
