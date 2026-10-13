"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function VendorBottomNav({ slug }: { slug: string }) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Today",
      href: "/app/" + slug + "/today",
      icon: (
        <svg className="h-5 w-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: "Run",
      href: "/app/" + slug + "/run",
      icon: (
        <svg className="h-5 w-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
      ),
    },
    {
      label: "Customers",
      href: "/app/" + slug + "/customers",
      icon: (
        <svg className="h-5 w-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "More",
      href: "/app/" + slug + "/more",
      icon: (
        <svg className="h-5 w-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
  ];

  return (
    <nav aria-label="Bottom navigation" className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex h-16 max-w-md items-center justify-around border-t border-line bg-surface/95 px-2 backdrop-blur-md">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={"flex h-12 w-16 flex-col items-center justify-center rounded-[10px] transition-colors " + (isActive ? "font-medium text-accent" : "text-muted hover:text-ink")}
          >
            {item.icon}
            <span className="mt-1 text-[11px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
