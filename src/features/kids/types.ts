import type { KidsCategoryId, KidsFormat } from "@/core/kids";

export interface KidsVendorSummary {
  id: string;
  name: string;
  slug: string;
  area: string;
  rating: number;
  reviewCount: number;
  serviceModes: string[];
}

export interface KidsActivityItem {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  ageMin: number;
  ageMax: number;
  durationMinutes: number;
  pricePaise: number;
  trialPricePaise?: number;
  category: KidsCategoryId;
  format: KidsFormat;
  vendor: KidsVendorSummary;
  badge?: string;
  emoji: string;
  highlights: string[];
  previewVideoUrl?: string;
  homeSupervisionRequired?: boolean;
  verifiedTutor?: boolean;
}

export interface KidsWorkshopItem {
  id: string;
  serviceId?: string;
  title: string;
  description: string;
  dateLabel: string;
  timeLabel: string;
  minAge: number;
  maxAge: number;
  category: KidsCategoryId;
  format: KidsFormat;
  vendor: KidsVendorSummary;
  pricePaise: number;
  batchSize: number;
  enrolledCount: number;
  emoji: string;
  badge?: string;
  previewVideoUrl?: string;
}

export interface KidsKitItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  minAge: number;
  maxAge: number;
  pricePaise: number;
  category: KidsCategoryId;
  vendor: KidsVendorSummary;
  features: string[];
  emoji: string;
  badge?: string;
  previewVideoUrl?: string;
  nonToxicCertified?: boolean;
}
