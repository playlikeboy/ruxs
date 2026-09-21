"use client";

import React from "react";

interface SvgIconProps {
  className?: string;
  size?: number;
}

/**
 * Bespoke SVG vector illustration for Pizza
 */
export function PizzaSvg({ className = "", size = 48 }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="#1C1813" stroke="#F59E0B" strokeWidth="2" />
      <path
        d="M32 8L50 48C45 52 38 54 32 54C26 54 19 52 14 48L32 8Z"
        fill="#FBBF24"
        stroke="#D97706"
        strokeWidth="2"
      />
      {/* Crust */}
      <path
        d="M14 48C19 52 26 54 32 54C38 54 45 52 50 48C47 45 42 44 32 44C22 44 17 45 14 48Z"
        fill="#D97706"
      />
      {/* Molten Cheese Sauce */}
      <circle cx="28" cy="36" r="3.5" fill="#EF4444" />
      <circle cx="38" cy="38" r="3" fill="#EF4444" />
      <circle cx="33" cy="24" r="2.5" fill="#EF4444" />
      {/* Basil leaf */}
      <ellipse cx="26" cy="28" rx="2" ry="4" transform="rotate(-30 26 28)" fill="#10B981" />
      <ellipse cx="36" cy="30" rx="2" ry="4" transform="rotate(35 36 30)" fill="#10B981" />
      {/* Melt Drops */}
      <path
        d="M27 44C27 46 29 48 30 48C31 48 32 46 32 44"
        fill="#FDE047"
      />
    </svg>
  );
}

/**
 * Bespoke SVG vector illustration for Cheeseburger
 */
export function BurgerSvg({ className = "", size = 48 }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="#181512" stroke="#F59E0B" strokeWidth="2" />
      {/* Top Brioche Bun */}
      <path
        d="M16 28C16 19 23 14 32 14C41 14 48 19 48 28H16Z"
        fill="#F59E0B"
        stroke="#D97706"
        strokeWidth="2"
      />
      {/* Sesame Seeds */}
      <circle cx="25" cy="20" r="1.2" fill="#FEF3C7" />
      <circle cx="32" cy="18" r="1.2" fill="#FEF3C7" />
      <circle cx="39" cy="21" r="1.2" fill="#FEF3C7" />
      <circle cx="29" cy="23" r="1.2" fill="#FEF3C7" />
      {/* Lettuce */}
      <path
        d="M14 30C16 29 18 31 20 30C22 29 24 31 26 30C28 29 30 31 32 30C34 29 36 31 38 30C40 29 42 31 44 30C46 29 48 31 50 30"
        stroke="#10B981"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Melted Cheese */}
      <path
        d="M17 32H47L43 38H21L17 32Z"
        fill="#FBBF24"
      />
      {/* Patty */}
      <rect x="16" y="37" width="32" height="7" rx="3.5" fill="#78350F" />
      {/* Bottom Bun */}
      <rect x="18" y="44" width="28" height="6" rx="3" fill="#D97706" />
    </svg>
  );
}

/**
 * Bespoke SVG vector illustration for Salad Bowl
 */
export function SaladSvg({ className = "", size = 48 }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="#0D1E14" stroke="#10B981" strokeWidth="2" />
      {/* Bowl */}
      <path
        d="M14 32C14 43 22 50 32 50C42 50 50 43 50 32H14Z"
        fill="#1F2937"
        stroke="#374151"
        strokeWidth="2"
      />
      {/* Salad Greens */}
      <path
        d="M18 32C18 25 24 20 30 22C32 18 38 18 40 23C46 22 48 28 46 32"
        fill="#10B981"
      />
      {/* Cherry Tomatoes */}
      <circle cx="24" cy="27" r="3" fill="#EF4444" />
      <circle cx="38" cy="26" r="3" fill="#EF4444" />
      {/* Avocado Slice */}
      <path
        d="M32 23C35 23 37 25 36 29C35 32 31 33 29 31C28 28 29 23 32 23Z"
        fill="#84CC16"
        stroke="#4D7C0F"
        strokeWidth="1.5"
      />
      <circle cx="33" cy="28" r="1.5" fill="#365314" />
    </svg>
  );
}

/**
 * Bespoke SVG vector illustration for A2 Milk Glass Bottle
 */
export function MilkSvg({ className = "", size = 48 }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="#0B1A24" stroke="#38BDF8" strokeWidth="2" />
      {/* Bottle Cap */}
      <rect x="27" y="10" width="10" height="4" rx="2" fill="#F59E0B" />
      {/* Bottle Neck */}
      <path d="M28 14H36V22H28V14Z" fill="#E0F2FE" fillOpacity="0.4" stroke="#7DD3FC" strokeWidth="1.5" />
      {/* Glass Body */}
      <path
        d="M24 22H40L43 50C43 52 41 54 39 54H25C23 54 21 52 21 50L24 22Z"
        fill="#F0F9FF"
        fillOpacity="0.3"
        stroke="#38BDF8"
        strokeWidth="2"
      />
      {/* Fresh White Milk Fill */}
      <path
        d="M23.5 28C26 27 30 29 34 27C37 26 40 28 40.5 28L42.5 49C42.5 51 40.5 53 38.5 53H25.5C23.5 53 21.5 51 21.5 49L23.5 28Z"
        fill="#FFFFFF"
      />
      {/* Label Badge */}
      <rect x="26" y="34" width="12" height="10" rx="2" fill="#10B981" />
      <text x="32" y="41" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#FFFFFF">A2</text>
    </svg>
  );
}

/**
 * Bespoke SVG vector illustration for 20L Water Canister
 */
export function WaterCanSvg({ className = "", size = 48 }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="#08202A" stroke="#06B6D4" strokeWidth="2" />
      {/* Bottle Cap */}
      <rect x="28" y="8" width="8" height="5" rx="1.5" fill="#0284C7" />
      {/* Neck */}
      <path d="M29 13H35V18H29V13Z" fill="#38BDF8" />
      {/* Canister Body */}
      <path
        d="M20 22C20 19 24 18 32 18C40 18 44 19 44 22L45 50C45 53 41 55 32 55C23 55 19 53 19 50L20 22Z"
        fill="#0EA5E9"
        stroke="#38BDF8"
        strokeWidth="2"
      />
      {/* Grip Ribs */}
      <line x1="22" y1="28" x2="42" y2="28" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="36" x2="42" y2="36" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="44" x2="42" y2="44" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
      {/* Water Droplet Badge */}
      <circle cx="32" cy="36" r="4" fill="#E0F2FE" />
      <path d="M32 33C30 35 30 38 32 38C34 38 34 35 32 33Z" fill="#0284C7" />
    </svg>
  );
}

/**
 * Bespoke SVG vector illustration for Homestyle Thali
 */
export function ThaliSvg({ className = "", size = 48 }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="#20150E" stroke="#F59E0B" strokeWidth="2" />
      {/* Stainless Steel Plate */}
      <circle cx="32" cy="32" r="23" fill="#334155" stroke="#94A3B8" strokeWidth="2" />
      <circle cx="32" cy="32" r="20" fill="#1E293B" />
      {/* Katoris (Bowls) */}
      {/* Dal */}
      <circle cx="24" cy="22" r="5" fill="#FBBF24" stroke="#94A3B8" strokeWidth="1" />
      {/* Sabzi / Paneer */}
      <circle cx="40" cy="22" r="5" fill="#EF4444" stroke="#94A3B8" strokeWidth="1" />
      {/* Raita */}
      <circle cx="43" cy="34" r="4.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
      {/* Sweet Gulab Jamun */}
      <circle cx="21" cy="34" r="4.5" fill="#78350F" stroke="#94A3B8" strokeWidth="1" />
      {/* Warm Rotis / Phulkas in Center */}
      <circle cx="32" cy="38" r="7" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
      <circle cx="29" cy="36" r="6" fill="#FEF08A" stroke="#D97706" strokeWidth="1" />
      {/* Desi Ghee drop */}
      <circle cx="29" cy="35" r="1" fill="#F59E0B" />
    </svg>
  );
}

/**
 * Bespoke SVG vector illustration for Puja Flowers
 */
export function FlowersSvg({ className = "", size = 48 }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="#200E19" stroke="#EC4899" strokeWidth="2" />
      {/* Woven Basket */}
      <path
        d="M16 34C16 45 23 52 32 52C41 52 48 45 48 34H16Z"
        fill="#92400E"
        stroke="#B45309"
        strokeWidth="2"
      />
      {/* Basket Handle */}
      <path
        d="M20 34C20 22 24 16 32 16C40 16 44 22 44 34"
        stroke="#B45309"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Marigold Orange/Yellow Flower */}
      <circle cx="26" cy="30" r="6" fill="#F59E0B" />
      <circle cx="26" cy="30" r="3" fill="#B45309" />
      {/* Red Hibiscus */}
      <circle cx="38" cy="31" r="6" fill="#EF4444" />
      <circle cx="38" cy="31" r="2.5" fill="#FDE047" />
      {/* White Jasmine garland petals */}
      <circle cx="32" cy="24" r="4" fill="#FFFFFF" />
      <circle cx="32" cy="24" r="1.5" fill="#FCD34D" />
      {/* Green Tulsi Sprig */}
      <ellipse cx="23" cy="23" rx="2" ry="4" transform="rotate(-40 23 23)" fill="#10B981" />
      <ellipse cx="41" cy="24" rx="2" ry="4" transform="rotate(40 41 24)" fill="#10B981" />
    </svg>
  );
}

/**
 * Bespoke SVG vector illustration for Pet Care / Dog Walking
 */
export function PetsSvg({ className = "", size = 48 }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="#1C140A" stroke="#D97706" strokeWidth="2" />
      {/* Main Paw Pad */}
      <ellipse cx="32" cy="38" rx="9" ry="7" fill="#F59E0B" />
      {/* 4 Toe Pads */}
      <ellipse cx="21" cy="28" rx="3.5" ry="5" transform="rotate(-20 21 28)" fill="#F59E0B" />
      <ellipse cx="28" cy="23" rx="3.5" ry="5" transform="rotate(-5 28 23)" fill="#F59E0B" />
      <ellipse cx="36" cy="23" rx="3.5" ry="5" transform="rotate(5 36 23)" fill="#F59E0B" />
      <ellipse cx="43" cy="28" rx="3.5" ry="5" transform="rotate(20 43 28)" fill="#F59E0B" />
      {/* Heart inside paw */}
      <path
        d="M32 40C30 38 29 37 29 36C29 35 30 34 31 34C31.5 34 32 34.5 32 35C32 34.5 32.5 34 33 34C34 34 35 35 35 36C35 37 34 38 32 40Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/**
 * Bespoke SVG vector illustration for Steam Iron & Laundry Pass
 */
export function LaundrySvg({ className = "", size = 48 }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="#0D1822" stroke="#60A5FA" strokeWidth="2" />
      {/* Steam Iron Body */}
      <path
        d="M16 42C16 32 24 28 36 28H46C49 28 51 31 51 34L48 42H16Z"
        fill="#3B82F6"
        stroke="#93C5FD"
        strokeWidth="2"
      />
      {/* Iron Handle */}
      <path
        d="M20 28V20C20 17 24 16 32 16H42C45 16 47 18 47 21V28"
        stroke="#93C5FD"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Soleplate */}
      <rect x="14" y="42" width="37" height="3" rx="1.5" fill="#E2E8F0" />
      {/* Steam Puffs */}
      <circle cx="22" cy="49" r="1.5" fill="#93C5FD" />
      <circle cx="32" cy="50" r="2" fill="#93C5FD" />
      <circle cx="42" cy="49" r="1.5" fill="#93C5FD" />
    </svg>
  );
}

/**
 * General helper component: maps category or product ID to appropriate SVG illustration
 */
export function CatalogSvgIllustration({
  idOrCategory,
  className = "",
  size = 48,
}: {
  idOrCategory: string;
  className?: string;
  size?: number;
}) {
  const key = idOrCategory.toUpperCase();

  if (key.includes("PIZZA") || key === "FAST_FOOD") {
    return <PizzaSvg className={className} size={size} />;
  }
  if (key.includes("BURGER")) {
    return <BurgerSvg className={className} size={size} />;
  }
  if (key.includes("SALAD")) {
    return <SaladSvg className={className} size={size} />;
  }
  if (key.includes("MILK")) {
    return <MilkSvg className={className} size={size} />;
  }
  if (key.includes("WATER")) {
    return <WaterCanSvg className={className} size={size} />;
  }
  if (key.includes("TIFFIN") || key.includes("THALI")) {
    return <ThaliSvg className={className} size={size} />;
  }
  if (key.includes("FLOWER") || key.includes("PUJA")) {
    return <FlowersSvg className={className} size={size} />;
  }
  if (key.includes("PET") || key.includes("DOG")) {
    return <PetsSvg className={className} size={size} />;
  }
  if (key.includes("LAUNDRY") || key.includes("IRON")) {
    return <LaundrySvg className={className} size={size} />;
  }

  // Default fallback
  return <PizzaSvg className={className} size={size} />;
}
