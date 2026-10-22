"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimateBalloonIcon,
  AnimateRocketIcon,
  AnimateCampIcon,
  AnimatePuzzleIcon,
  AnimateTicketIcon,
  AnimateBabyIcon,
  AnimateCalendarIcon,
} from "@/components/ui/animate-icons";

const NAV_ITEMS = [
  { href: "/app/kids", label: "Home", exact: true, tint: "bg-[#FFE1EF]", icon: <AnimateBalloonIcon size={28} /> },
  { href: "/app/kids/activities", label: "Classes", exact: false, tint: "bg-[#EDE3FF]", icon: <AnimateRocketIcon size={28} /> },
  { href: "/app/kids/workshops", label: "Workshops", exact: false, tint: "bg-[#D9F4FF]", icon: <AnimateCampIcon size={28} /> },
  { href: "/app/kids/kits", label: "DIY Kits", exact: false, tint: "bg-[#FFF3C4]", icon: <AnimatePuzzleIcon size={28} /> },
  { href: "/app/kids/passes", label: "Passes", exact: false, tint: "bg-[#DDF8EA]", icon: <AnimateTicketIcon size={28} /> },
  { href: "/app/kids/children", label: "My Kids", exact: false, tint: "bg-[#FFE6D5]", icon: <AnimateBabyIcon size={28} /> },
  { href: "/app/kids/bookings", label: "Bookings", exact: false, tint: "bg-[#E3ECFF]", icon: <AnimateCalendarIcon size={28} /> },
];

/** Round sticker-style tabs, like a kids' app shelf. */
export function KidsSubNav() {
  const pathname = usePathname();

  return (
    <div className="no-scrollbar overflow-x-auto px-4 pb-1 pt-2">
      <nav aria-label="Kids sections" className="flex items-start gap-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} aria-current={isActive ? "page" : undefined} className="group flex w-[60px] shrink-0 flex-col items-center gap-1">
              <span
                className={
                  "flex h-14 w-14 items-center justify-center rounded-[20px] transition-transform group-active:scale-90 " +
                  item.tint +
                  (isActive ? " shadow-[0_4px_0_rgba(155,92,246,0.35)] ring-2 ring-kids-grape" : " shadow-[0_3px_0_rgba(59,31,92,0.08)]")
                }
                aria-hidden="true"
              >
                <span className={isActive ? "animate-wiggle inline-block" : "inline-block"}>{item.icon}</span>
              </span>
              <span className={"text-[11px] leading-tight " + (isActive ? "font-bold text-kids-grape" : "font-medium text-kids-ink/70")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
