"use client";

import React from "react";
import {
  UtensilsCrossed,
  Truck,
  Sparkles,
  Wrench,
  Zap,
  Car,
  Hammer,
  MoreHorizontal,
  Droplets,
  Milk,
  Flower2,
  Dog,
  Shirt,
  Layers,
  ShoppingBag,
} from "lucide-react";
import {
  MilkSvg,
  WaterCanSvg,
  ThaliSvg,
  FlowersSvg,
  PetsSvg,
  LaundrySvg,
  PizzaSvg,
  BurgerSvg,
} from "./svg-assets";

interface CategoryIconProps {
  id: string;
  className?: string;
  size?: number;
  isActive?: boolean;
}

export function CategoryIcon({
  id,
  className = "",
  size = 20,
  isActive = false,
}: CategoryIconProps) {
  const upper = id.toUpperCase();

  const strokeColor = isActive ? "text-primary" : "text-muted-foreground";

  switch (upper) {
    case "ALL":
      return <Layers size={size} className={`${strokeColor} ${className}`} />;
    case "FAST_FOOD":
    case "REST":
    case "RESTAURANTS":
      return <UtensilsCrossed size={size} className={`${strokeColor} ${className}`} />;
    case "MILK":
    case "MILKMAN":
      return <Milk size={size} className={`${strokeColor} ${className}`} />;
    case "WATER":
    case "WATER_SERVICE":
      return <Droplets size={size} className={`${strokeColor} ${className}`} />;
    case "TIFFIN":
    case "MEALS":
      return <UtensilsCrossed size={size} className={`${strokeColor} ${className}`} />;
    case "FLOWERS":
      return <Flower2 size={size} className={`${strokeColor} ${className}`} />;
    case "PETS":
    case "PET_SERVICES":
      return <Dog size={size} className={`${strokeColor} ${className}`} />;
    case "LAUNDRY":
    case "IRON":
      return <Shirt size={size} className={`${strokeColor} ${className}`} />;
    case "MOVERS":
      return <Truck size={size} className={`${strokeColor} ${className}`} />;
    case "CLEANING":
      return <Sparkles size={size} className={`${strokeColor} ${className}`} />;
    case "PLUMBERS":
      return <Wrench size={size} className={`${strokeColor} ${className}`} />;
    case "ELECTRICIAN":
      return <Zap size={size} className={`${strokeColor} ${className}`} />;
    case "AUTO":
    case "AUTO_DETAIL":
      return <Car size={size} className={`${strokeColor} ${className}`} />;
    case "CONTRACTORS":
      return <Hammer size={size} className={`${strokeColor} ${className}`} />;
    case "MORE":
      return <MoreHorizontal size={size} className={`${strokeColor} ${className}`} />;
    default:
      return <ShoppingBag size={size} className={`${strokeColor} ${className}`} />;
  }
}
