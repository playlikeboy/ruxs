"use client";

import Link from "next/link";
import { cn } from "./cn";

/**
 * A two-or-more option switch with a sliding thumb (Myntra-style). Each option
 * is a link, so it works without JS and keeps URLs shareable.
 */
export function SegmentedLinks({
  items,
  active,
  className,
  tone = "default",
}: {
  items: { key: string; label: string; href: string; icon?: React.ReactNode }[];
  active: string;
  className?: string;
  tone?: "default" | "kids";
}) {
  const index = Math.max(0, items.findIndex((i) => i.key === active));
  return (
    <nav
      aria-label="Switch section"
      className={cn(
        "relative grid rounded-full p-1",
        tone === "kids" ? "bg-white/80 shadow-[0_2px_0_rgba(124,58,237,0.12)] ring-1 ring-kids-grape/15" : "bg-app-canvas ring-1 ring-line",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-1 top-1 rounded-full transition-transform duration-200 ease-[cubic-bezier(.25,1,.5,1)] motion-reduce:transition-none",
          tone === "kids" ? "bg-gradient-to-r from-kids-bubblegum to-kids-grape shadow-[0_4px_12px_rgba(168,85,247,0.35)]" : "bg-white shadow-[0_2px_5px_rgba(32,36,31,0.08)] ring-1 ring-black/[0.035]"
        )}
        style={{ left: 4, width: `calc((100% - 8px) / ${items.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {items.map((item) => {
        const on = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "relative z-10 flex h-9 items-center justify-center gap-1.5 rounded-full text-[13px] font-bold tracking-tight transition-colors",
              on ? (tone === "kids" ? "text-white" : "text-brand-deep") : (tone === "kids" ? "text-kids-ink/65 hover:text-kids-ink" : "text-muted hover:text-ink")
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
