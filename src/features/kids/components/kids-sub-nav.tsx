"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Palette, Puzzle, ShoppingBag, Sparkles, Tent, type LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/cn";

const TABS: { href: string; label: string; Icon: LucideIcon; exact?: boolean }[] = [
  { href: "/app/kids", label: "Explore", Icon: Sparkles, exact: true },
  { href: "/app/kids/activities", label: "Classes", Icon: Palette },
  { href: "/app/kids/workshops", label: "Workshops", Icon: Tent },
  { href: "/app/kids/kits", label: "Kits", Icon: Puzzle },
  { href: "/app/kids/shop", label: "Shop", Icon: ShoppingBag },
];

/** Five browse tabs, Shop being the RUXs Store. Family pages (bookings, children, passes) live in the header. */
export function KidsSubNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Kids sections" className="mx-auto max-w-3xl px-4 pt-3">
      <ul className="flex gap-1 rounded-[20px] bg-kids-ink/[0.06] p-1 sm:rounded-full">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-12 flex-col rounded-[16px] sm:rounded-full items-center justify-center gap-0.5 px-1 text-[11px] font-semibold leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink min-[400px]:text-xs sm:min-h-10 sm:flex-row sm:gap-1.5 sm:px-2 sm:text-sm",
                  active
                    ? "bg-white text-kids-ink shadow-[0_2px_6px_rgba(23,71,55,0.12)] font-bold"
                    : "text-kids-ink/65 hover:text-kids-ink hover:bg-white/40"
                )}
              >
                <t.Icon aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 group-active:scale-95 motion-reduce:transform-none motion-reduce:transition-none" />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
