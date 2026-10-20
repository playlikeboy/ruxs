"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/app/kids", label: "Overview", emoji: "🎈", exact: true },
  { href: "/app/kids/activities", label: "Classes", emoji: "🚀", exact: false },
  { href: "/app/kids/workshops", label: "Workshops", emoji: "🏕️", exact: false },
  { href: "/app/kids/kits", label: "DIY Kits", emoji: "🧩", exact: false },
  { href: "/app/kids/passes", label: "Passes", emoji: "🎟️", exact: false },
  { href: "/app/kids/children", label: "My Kids", emoji: "👶", exact: false },
  { href: "/app/kids/bookings", label: "Bookings", emoji: "📅", exact: false },
];

export function KidsSubNav() {
  const pathname = usePathname();

  return (
    <div className="no-scrollbar overflow-x-auto px-4 py-2.5">
      <nav className="flex items-center gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black transition ${
                isActive
                  ? "border-2 border-slate-900 bg-amber-300 text-slate-950 shadow-[2px_2px_0_0_#0f172a]"
                  : "border-2 border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              <span className="text-sm" aria-hidden="true">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
