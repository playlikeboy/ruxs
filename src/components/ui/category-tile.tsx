"use client";

import { useRef, type RefObject } from "react";
import Link from "next/link";
import type { IconHandle } from "@animateicons/react";
import { DropletsIcon, DumbbellIcon, GiftIcon, GraduationCapIcon, PackageIcon, SparklesIcon, StethoscopeIcon, StoreIcon, UtensilsIcon } from "@animateicons/react/lucide";
import { AppIcon } from "./app-icon";

function TileIcon({ id, iconRef }: { id: string; iconRef: RefObject<IconHandle | null> }) {
  const size = 28;
  switch (id) {
    case "tiffin":
      return <UtensilsIcon ref={iconRef} size={size} />;
    case "water":
      return <DropletsIcon ref={iconRef} size={size} />;
    case "gifts":
      return <GiftIcon ref={iconRef} size={size} />;
    case "store":
    case "other":
      return <StoreIcon ref={iconRef} size={size} />;
    case "fitness":
      return <DumbbellIcon ref={iconRef} size={size} />;
    case "physio":
      return <StethoscopeIcon ref={iconRef} size={size} />;
    case "mehndi":
      return <SparklesIcon ref={iconRef} size={size} />;
    case "kids":
      return <GraduationCapIcon ref={iconRef} size={size} />;
    case "kids-kits":
      return <PackageIcon ref={iconRef} size={size} />;
    default:
      return <AppIcon name={id} className="h-7 w-7" />;
  }
}

/** A category shortcut whose icon moves on hover or tap; falls back to the static icon set. */
export function CategoryTile({ id, label, href, tint }: { id: string; label: string; href: string; tint?: string }) {
  const icon = useRef<IconHandle>(null);
  const play = () => icon.current?.startAnimation();
  return (
    <Link href={href} onMouseEnter={play} onPointerDown={play} className="group flex flex-col items-center gap-1.5 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-[20px] text-brand-deep transition-transform duration-150 group-active:scale-95"
        style={{ backgroundColor: tint ?? "#F7F4ED" }}
        aria-hidden="true"
      >
        <TileIcon id={id} iconRef={icon} />
      </span>
      <span className="line-clamp-2 text-[12px] font-medium leading-tight text-ink">{label}</span>
    </Link>
  );
}
