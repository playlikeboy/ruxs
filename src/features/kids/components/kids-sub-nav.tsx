"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";

const TABS = [
  { href: "/app/kids", label: "Explore", exact: true },
  { href: "/app/kids/activities", label: "Classes" },
  { href: "/app/kids/workshops", label: "Workshops" },
  { href: "/app/kids/kits", label: "Kits" },
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
                  "flex min-h-10 items-center justify-center rounded-full px-2 text-sm font-semibold transition-colors",
                  active ? "bg-white text-kids-ink shadow-[0_1px_3px_rgba(23,71,55,0.18)]" : "text-kids-ink/65 hover:text-kids-ink"
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
