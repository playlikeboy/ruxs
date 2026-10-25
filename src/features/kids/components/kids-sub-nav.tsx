"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";

const TABS = [
  { href: "/app/kids", label: "Explore", emoji: "✨", exact: true },
  { href: "/app/kids/activities", label: "Classes", emoji: "🎨" },
  { href: "/app/kids/workshops", label: "Workshops", emoji: "🎪" },
  { href: "/app/kids/kits", label: "Kits", emoji: "🧩" },
];

/** Four browse tabs. Family pages (bookings, children, passes) live in the header. */
export function KidsSubNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Kids sections" className="mx-auto max-w-3xl px-4 pt-3">
      <ul className="flex gap-1 rounded-full bg-kids-ink/[0.06] p-1">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-10 items-center justify-center gap-1.5 rounded-full px-2 text-xs sm:text-sm font-semibold transition-all",
                  active
                    ? "bg-white text-kids-ink shadow-[0_2px_6px_rgba(23,71,55,0.12)] font-bold"
                    : "text-kids-ink/65 hover:text-kids-ink hover:bg-white/40"
                )}
              >
                <span className="text-sm transition-transform duration-200 group-hover:scale-125 group-active:scale-95">{t.emoji}</span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
