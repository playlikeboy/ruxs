"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function VendorBottomNav({ slug }: { slug: string }) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Today",
      href: `/app/${slug}/today`,
      icon: (
        <svg
          className="w-5 h-5 stroke-current fill-none"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: "Run",
      href: `/app/${slug}/run`,
      icon: (
        <svg
          className="w-5 h-5 stroke-current fill-none"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
      ),
    },
    {
      label: "Customers",
      href: `/app/${slug}/customers`,
      icon: (
        <svg
          className="w-5 h-5 stroke-current fill-none"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Bills",
      href: `/app/${slug}/bills`,
      icon: (
        <svg
          className="w-5 h-5 stroke-current fill-none"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line h-16 max-w-md mx-auto flex items-center justify-around px-2"
    >
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-[10px] transition-colors ${
              isActive
                ? "text-accent font-medium"
                : "text-muted hover:text-ink"
            }`}
          >
            {item.icon}
            <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
