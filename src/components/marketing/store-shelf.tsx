import Link from "next/link";
import { Bot, FlaskConical, Palette, Puzzle, Scissors, type LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { storeShelf, type StoreShelfItem } from "@/components/marketing/home-content";

const ICONS: Record<StoreShelfItem["icon"], LucideIcon> = {
  diy: Scissors,
  robotics: Bot,
  science: FlaskConical,
  art: Palette,
  puzzles: Puzzle,
};

// Each kit box has its own colour and height, so the row reads as a real shelf, not a grid.
const BOXES = [
  "h-36 bg-brand-butter",
  "h-48 bg-brand-water",
  "h-40 bg-brand-leaf",
  "h-44 bg-brand-gift",
  "h-36 bg-brand-peach",
];

/** The RUXs Store as a shelf of kit boxes. Scrolls sideways on small screens. */
export function StoreShelf({ className }: { className?: string }) {
  return (
    <div className={cn("-mx-4 overflow-x-auto px-4 pb-6 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden", className)}>
      <div className="w-max min-w-full">
        <ul aria-label="What the RUXs Store sells" className="flex items-end gap-2.5 px-3 sm:gap-3 sm:px-5">
          {storeShelf.map((item, i) => {
            const Icon = ICONS[item.icon];
            return (
              <li key={item.label} className="w-[104px] shrink-0 sm:w-auto sm:flex-1">
                <Link
                  href="/app/kids/shop"
                  className={cn(
                    "group flex flex-col justify-between rounded-b-[4px] rounded-t-[12px] border-t-[10px] border-ink/10 p-3 transition-transform duration-200 ease-out focus-visible:outline-white motion-safe:hover:-translate-y-1.5",
                    BOXES[i % BOXES.length]
                  )}
                >
                  <Icon className="h-10 w-10 text-ink" strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-sm font-bold leading-tight text-ink">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div aria-hidden="true" className="h-3 rounded-[4px] bg-kids-sunny shadow-[0_14px_20px_-10px_rgba(0,0,0,0.55)]" />
      </div>
    </div>
  );
}
