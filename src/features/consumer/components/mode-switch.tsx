"use client";

import { usePathname } from "next/navigation";
import { SegmentedLinks } from "@/components/ui/segmented";
import { AnimateHomeIcon, AnimateTeddyIcon } from "@/components/ui/animate-icons";

/**
 * Segmented switch between the two halves of the household app: Daily
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
        { key: "daily", label: "Daily", href: "/app", icon: <AnimateHomeIcon size={18} /> },
        { key: "kids", label: "Kids", href: "/app/kids", icon: <AnimateTeddyIcon size={20} animateOnHoverOnly={!kids} /> },
      ]}
    />
  );
}
