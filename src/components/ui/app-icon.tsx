import { createElement } from "react";
import {
  Baby,
  BookOpen,
  Blocks,
  Brain,
  CookingPot,
  Droplets,
  Dumbbell,
  FlaskConical,
  Gift,
  GraduationCap,
  Hammer,
  HeartPulse,
  House,
  Laptop,
  Milk,
  Music,
  Package,
  Palette,
  School,
  Sparkles,
  Sprout,
  Store,
  Tent,
  Trophy,
  Bell,
  CalendarDays,
  Check,
  Clock,
  Flame,
  Hourglass,
  Lock,
  Map as MapIcon,
  MapPin,
  Moon,
  PartyPopper,
  Phone,
  Plane,
  Recycle,
  Repeat,
  Search,
  ShieldCheck,
  Star,
  Sun,
  Ticket,
  TriangleAlert,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "./cn";

/**
 * One icon per category, vendor type, kids topic, product kind or session format.
 * Replaces emoji across the app with a single drawn icon family.
 */
const ICONS: Record<string, LucideIcon> = {
  // Daily essentials (category ids, vendor types, product kinds)
  tiffin: CookingPot,
  water: Droplets,
  milk: Milk,
  store: Store,
  other: Store,
  gifts: Gift,
  fitness: Dumbbell,
  physio: HeartPulse,
  mehndi: Sparkles,
  // Kids: umbrella, vendor types and topics
  kids: GraduationCap,
  "kids-kits": Package,
  kits: Package,
  kids_products: Package,
  kids_academics: BookOpen,
  kids_stem: FlaskConical,
  stem: FlaskConical,
  kids_performing_arts: Music,
  music: Music,
  kids_arts_crafts: Palette,
  arts: Palette,
  kids_school_projects: Hammer,
  kids_camps: Tent,
  kids_sports_fitness: Trophy,
  sports: Trophy,
  logic: Brain,
  kids_life_skills: Sprout,
  kids_institutions: School,
  // Session formats
  home_visit: House,
  home: House,
  studio: School,
  online_live: Laptop,
  online: Laptop,
  kit_delivery: Package,
  all: Sparkles,
  // Age brackets
  "3-5": Baby,
  "6-8": Blocks,
  "9-12": BookOpen,
  "13+": GraduationCap,
};

const KEYWORDS: [RegExp, LucideIcon][] = [
  [/tiffin|meal|thali|food|kitchen/i, CookingPot],
  [/water|can/i, Droplets],
  [/milk|dairy/i, Milk],
  [/gift|hamper/i, Gift],
  [/fit|gym|yoga/i, Dumbbell],
  [/physio|health|clinic/i, HeartPulse],
  [/mehndi|henna|beauty/i, Sparkles],
  [/kit|box/i, Package],
  [/kid|child|class|tutor/i, GraduationCap],
];

export function iconFor(name: string | null | undefined): LucideIcon {
  if (!name) return Store;
  return ICONS[name] ?? KEYWORDS.find(([re]) => re.test(name))?.[1] ?? Store;
}

export function AppIcon({ name, className, strokeWidth = 1.9 }: { name: string | null | undefined; className?: string; strokeWidth?: number }) {
  return createElement(iconFor(name), { className: cn("h-5 w-5 shrink-0", className), strokeWidth, "aria-hidden": true });
}

/** Small interface glyphs that used to be emoji or text symbols. */
const UI: Record<string, LucideIcon> = {
  age: Baby,
  time: Clock,
  date: CalendarDays,
  place: MapPin,
  phone: Phone,
  map: MapIcon,
  warning: TriangleAlert,
  camp: Tent,
  kit: Package,
  star: Star,
  close: X,
  check: Check,
  search: Search,
  pass: Ticket,
  sparkle: Sparkles,
  lock: Lock,
  shield: ShieldCheck,
  cap: GraduationCap,
  bell: Bell,
  hourglass: Hourglass,
  bolt: Zap,
  holiday: Plane,
  home: House,
  studio: School,
  online: Laptop,
  sun: Sun,
  moon: Moon,
  repeat: Repeat,
  recycle: Recycle,
  clean: Droplets,
  fire: Flame,
  party: PartyPopper,
  tiffin: CookingPot,
  water: Droplets,
  milk: Milk,
};

export type UiIconName = keyof typeof UI;

export function UiIcon({ name, className }: { name: UiIconName; className?: string }) {
  return createElement(UI[name] ?? Sparkles, { className: cn("inline h-[1em] w-[1em] shrink-0 align-[-0.125em]", className), "aria-hidden": true });
}
