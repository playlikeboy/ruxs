import Link from "next/link";
import {
  Baby,
  Blocks,
  BookOpen,
  Bot,
  Brush,
  Code,
  Cpu,
  Dices,
  FlaskConical,
  Gift,
  LayoutGrid,
  Music,
  Package,
  Palette,
  PencilRuler,
  Puzzle,
  Rocket,
  Scissors,
  Shapes,
  Sparkles,
  Telescope,
  Volleyball,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/components/ui/cn";
import { STORE_AGE_BANDS, type StoreAgeBandId } from "@/core/store";
import type { StoreCategory, StoreSort } from "@/features/store/types";

/** Lucide icons a store category may name (admin sets the name). Unknown names fall back to Package. */
const ICONS: Record<string, LucideIcon> = {
  Baby,
  Blocks,
  BookOpen,
  Bot,
  Brush,
  Code,
  Cpu,
  Dices,
  FlaskConical,
  Gift,
  Music,
  Package,
  Palette,
  PencilRuler,
  Puzzle,
  Rocket,
  Scissors,
  Shapes,
  Sparkles,
  Telescope,
  Volleyball,
  Wrench,
};

export function StoreCategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Package;
  return <Icon className={className} aria-hidden="true" />;
}

const chip =
  "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink";
const chipOn = "border-kids-ink bg-kids-ink text-white";
const chipOff = "border-kids-ink/15 bg-white text-kids-ink hover:border-kids-ink/40";

function withParams(path: string, params: Record<string, string | null | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

/** Horizontal category chips. Empty categories are hidden. */
export function StoreCategoryChips({ categories, active, age }: { categories: StoreCategory[]; active: string | null; age: StoreAgeBandId | null }) {
  const shown = categories.filter((c) => c.productCount > 0 || c.id === active);
  if (shown.length === 0) return null;
  return (
    <nav aria-label="Store categories" className="-mx-4">
      <ul className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <li>
          <Link href={withParams("/app/kids/shop", { age })} aria-current={active === null ? "page" : undefined} className={cn(chip, active === null ? chipOn : chipOff)}>
            <LayoutGrid className="h-4 w-4" aria-hidden="true" /> All
          </Link>
        </li>
        {shown.map((c) => (
          <li key={c.id}>
            <Link
              href={withParams(`/app/kids/shop/${c.id}`, { age })}
              aria-current={active === c.id ? "page" : undefined}
              className={cn(chip, active === c.id ? chipOn : chipOff)}
            >
              <StoreCategoryIcon name={c.icon} className="h-4 w-4" />
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Age bands 0–3 … 12+ as links; tapping the active band clears it. */
export function StoreAgeFilter({ basePath, age, sort }: { basePath: string; age: StoreAgeBandId | null; sort?: StoreSort }) {
  const keepSort = sort && sort !== "featured" ? sort : null;
  return (
    <div role="group" aria-labelledby="store-age-label" className="flex flex-wrap items-center gap-2">
      <span id="store-age-label" className="mr-1 text-sm font-semibold text-kids-ink/70">
        Age
      </span>
      {STORE_AGE_BANDS.map((b) => {
        const on = age === b.id;
        return (
          <Link
            key={b.id}
            href={withParams(basePath, { age: on ? null : b.id, sort: keepSort })}
            aria-current={on ? "true" : undefined}
            aria-label={on ? `${b.label}, selected. Show all ages` : `Show ${b.label}`}
            scroll={false}
            className={cn(
              "inline-flex min-h-10 items-center rounded-full border px-3 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink",
              on ? "border-kids-ink bg-kids-sunny text-kids-ink" : "border-kids-ink/15 bg-white text-kids-ink/80 hover:border-kids-ink/40"
            )}
          >
            {b.label}
          </Link>
        );
      })}
    </div>
  );
}

const SORTS: { id: StoreSort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "new", label: "Newest" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
];

/** Sort as plain links, so it works before any JavaScript loads. */
export function StoreSortLinks({ basePath, age, sort }: { basePath: string; age: StoreAgeBandId | null; sort: StoreSort }) {
  return (
    <nav aria-label="Sort products" className="-mx-4">
      <ul className="flex gap-1 overflow-x-auto px-4 [scrollbar-width:none]">
        {SORTS.map((s) => (
          <li key={s.id}>
            <Link
              href={withParams(basePath, { age, sort: s.id === "featured" ? null : s.id })}
              aria-current={sort === s.id ? "true" : undefined}
              scroll={false}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink",
                sort === s.id ? "bg-kids-ink/10 text-kids-ink" : "text-kids-ink/65 hover:text-kids-ink"
              )}
            >
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Closed-store notice from settings. */
export function StoreClosedNotice({ message }: { message: string | null }) {
  return (
    <p role="status" className="rounded-[16px] border border-kids-ink/10 bg-kids-sunny/40 px-4 py-3 text-sm font-medium text-kids-ink">
      {message || "The RUXs Store is not taking orders right now. You can still browse."}
    </p>
  );
}
