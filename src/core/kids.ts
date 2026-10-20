/**
 * Pure rules for the Kids Activities & Learning Marketplace.
 * Age brackets, activity categories, format filters, and pricing helpers.
 * Per AGENTS.md: pure rules, no DB or Next.js imports, integer paise only.
 */

export type KidsAgeBracketId = "all" | "3-5" | "6-8" | "9-12" | "13+";

export interface KidsAgeBracket {
  id: KidsAgeBracketId;
  label: string;
  tagline: string;
  emoji: string;
  minAge: number;
  maxAge: number;
  colorBg: string;
  colorBorder: string;
}

export const KIDS_AGE_BRACKETS: KidsAgeBracket[] = [
  {
    id: "all",
    label: "All Kids",
    tagline: "Ages 3 to 16",
    emoji: "🎈",
    minAge: 3,
    maxAge: 18,
    colorBg: "bg-amber-50",
    colorBorder: "border-amber-300",
  },
  {
    id: "3-5",
    label: "3–5 yrs",
    tagline: "Little Explorers",
    emoji: "🐣",
    minAge: 3,
    maxAge: 5,
    colorBg: "bg-pink-50",
    colorBorder: "border-pink-300",
  },
  {
    id: "6-8",
    label: "6–8 yrs",
    tagline: "Curious Cubs",
    emoji: "🚀",
    minAge: 6,
    maxAge: 8,
    colorBg: "bg-sky-50",
    colorBorder: "border-sky-300",
  },
  {
    id: "9-12",
    label: "9–12 yrs",
    tagline: "Junior Innovators",
    emoji: "⚡",
    minAge: 9,
    maxAge: 12,
    colorBg: "bg-emerald-50",
    colorBorder: "border-emerald-300",
  },
  {
    id: "13+",
    label: "13+ yrs",
    tagline: "Teens & Champs",
    emoji: "🏆",
    minAge: 13,
    maxAge: 18,
    colorBg: "bg-purple-50",
    colorBorder: "border-purple-300",
  },
];

export type KidsCategoryId = "all" | "stem" | "arts" | "logic" | "sports" | "music" | "kits";

export interface KidsCategoryMeta {
  id: KidsCategoryId;
  label: string;
  shortLabel: string;
  emoji: string;
  tint: string;
  badgeColor: string;
  description: string;
}

export const KIDS_CATEGORIES: Record<KidsCategoryId, KidsCategoryMeta> = {
  all: {
    id: "all",
    label: "All Activities",
    shortLabel: "All",
    emoji: "🌟",
    tint: "#FEF9C3",
    badgeColor: "bg-amber-100 text-amber-900",
    description: "Discover all fun classes, workshops and kits",
  },
  stem: {
    id: "stem",
    label: "Robotics & STEM",
    shortLabel: "STEM",
    emoji: "🚀",
    tint: "#E0F2FE",
    badgeColor: "bg-sky-100 text-sky-900",
    description: "Lego robotics, scratch coding, electronics & space science",
  },
  arts: {
    id: "arts",
    label: "Art, Clay & Craft",
    shortLabel: "Art & Craft",
    emoji: "🎨",
    tint: "#FCE7F3",
    badgeColor: "bg-pink-100 text-pink-900",
    description: "Pottery wheel, acrylic painting, origami & clay modelling",
  },
  logic: {
    id: "logic",
    label: "Chess & Brain Games",
    shortLabel: "Chess",
    emoji: "♟️",
    tint: "#EDE9FE",
    badgeColor: "bg-purple-100 text-purple-900",
    description: "FIDE coach chess strategy, Rubik's cube & Vedic maths",
  },
  sports: {
    id: "sports",
    label: "Karate & Gymnastics",
    shortLabel: "Fitness",
    emoji: "🥋",
    tint: "#DCFCE7",
    badgeColor: "bg-emerald-100 text-emerald-900",
    description: "Self defence, martial arts, yoga & flexibility for children",
  },
  music: {
    id: "music",
    label: "Music & Dance",
    shortLabel: "Music",
    emoji: "🎵",
    tint: "#FFEDD5",
    badgeColor: "bg-orange-100 text-orange-900",
    description: "Keyboard, guitar, vocal training & Bollywood/classical dance",
  },
  kits: {
    id: "kits",
    label: "DIY & Learning Kits",
    shortLabel: "Kits",
    emoji: "🧩",
    tint: "#FEF3C7",
    badgeColor: "bg-yellow-100 text-yellow-900",
    description: "Montessori wooden toys, experiment boxes delivered to home",
  },
};

export type KidsFormat = "all" | "home_visit" | "studio" | "online_live" | "kit_delivery";

export interface KidsFormatMeta {
  id: KidsFormat;
  label: string;
  emoji: string;
}

export const KIDS_FORMATS: Record<KidsFormat, KidsFormatMeta> = {
  all: { id: "all", label: "All Formats", emoji: "✨" },
  home_visit: { id: "home_visit", label: "Home Tutor (1:1)", emoji: "🏡" },
  studio: { id: "studio", label: "Academy / Studio", emoji: "🏫" },
  online_live: { id: "online_live", label: "Live Interactive", emoji: "💻" },
  kit_delivery: { id: "kit_delivery", label: "Doorstep Delivery", emoji: "📦" },
};

/**
 * Checks whether an activity's age range overlaps with a target age bracket.
 */
export function matchesAgeBracket(
  activityMinAge: number,
  activityMaxAge: number,
  bracketId: KidsAgeBracketId
): boolean {
  if (bracketId === "all") return true;
  const bracket = KIDS_AGE_BRACKETS.find((b) => b.id === bracketId);
  if (!bracket) return true;

  // Overlap condition: max(min1, min2) <= min(max1, max2)
  return Math.max(activityMinAge, bracket.minAge) <= Math.min(activityMaxAge, bracket.maxAge);
}

/**
 * Formats a clean age badge string (e.g., "Ages 6–10", "Ages 4+").
 */
export function formatAgeBadge(minAge: number, maxAge: number): string {
  if (minAge === maxAge) return `Age ${minAge}`;
  if (maxAge >= 18) return `Ages ${minAge}+`;
  return `Ages ${minAge}–${maxAge}`;
}

export interface ActivityFilterable {
  name: string;
  description: string;
  minAge: number;
  maxAge: number;
  category: KidsCategoryId;
  format: KidsFormat;
}

/**
 * Pure filter for kids activities.
 */
export function filterKidsActivities<T extends ActivityFilterable>(
  items: T[],
  filters: {
    ageBracket?: KidsAgeBracketId;
    category?: KidsCategoryId;
    format?: KidsFormat;
    searchQuery?: string;
  }
): T[] {
  const { ageBracket = "all", category = "all", format = "all", searchQuery = "" } = filters;
  const query = searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    if (ageBracket !== "all" && !matchesAgeBracket(item.minAge, item.maxAge, ageBracket)) {
      return false;
    }
    if (category !== "all" && item.category !== category) {
      return false;
    }
    if (format !== "all" && item.format !== format) {
      return false;
    }
    if (query) {
      const haystack = `${item.name} ${item.description} ${item.category}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/**
 * Calculates a discounted trial price in integer paise.
 * Rules: Never returns float; clamps at min 0.
 */
export function calculateKidsTrialPrice(regularPricePaise: number, discountPercent: number): number {
  if (regularPricePaise <= 0 || discountPercent <= 0) return regularPricePaise;
  if (discountPercent >= 100) return 0;
  const discountAmount = Math.floor((regularPricePaise * discountPercent) / 100);
  return Math.max(0, regularPricePaise - discountAmount);
}

/**
 * Batch capacity and urgency indicator.
 */
export function formatBatchUrgency(batchSize: number, enrolled: number): {
  spotsLeft: number;
  isFull: boolean;
  isAlmostFull: boolean;
  label: string;
} {
  const spotsLeft = Math.max(0, batchSize - enrolled);
  const isFull = spotsLeft === 0;
  const isAlmostFull = spotsLeft > 0 && spotsLeft <= 3;

  let label = `${spotsLeft} spots left`;
  if (isFull) label = "Batch Full";
  else if (spotsLeft === 1) label = "Only 1 spot left!";
  else if (isAlmostFull) label = `Only ${spotsLeft} spots left!`;

  return { spotsLeft, isFull, isAlmostFull, label };
}
