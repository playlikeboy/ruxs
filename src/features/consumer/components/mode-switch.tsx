"use client";

import { usePathname } from "next/navigation";
import { SegmentedLinks } from "@/components/ui/segmented";

/**
 * Myntra-style switch between the two halves of the household app: Daily
 * essentials (tiffin, water, milk, services) and Kids (classes, workshops, kits).
 */
export function ModeSwitch({ className }: { className?: string }) {
  const pathname = usePathname();
  const kids = pathname.startsWith("/app/kids");
  return (
    <SegmentedLinks
      className={className}
      tone={kids ? "kids" : "default"}
      active={kids ? "kids" : "daily"}
      items={[
        { key: "daily", label: "Daily", href: "/app", icon: <span aria-hidden="true">🏠</span> },
        { key: "kids", label: "Kids", href: "/app/kids", icon: <span aria-hidden="true" className={kids ? "animate-wiggle inline-block" : "inline-block"}>🧸</span> },
      ]}
    />
  );
}
