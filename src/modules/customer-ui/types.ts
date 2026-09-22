/**
 * Types for the Customer UI & Modular App Architecture
 */

export type ServiceCategoryId =
  | "ALL"
  | "FAST_FOOD"
  | "MILK"
  | "WATER"
  | "TIFFIN"
  | "FLOWERS"
  | "PETS"
  | "LAUNDRY"
  | "MEAT"
  | "DRINKS";

export interface ServiceCategory {
  id: ServiceCategoryId;
  label: string;
  iconName?: string;
  emoji?: string;
  count: number;
}

export interface ProductOption {
  id: string;
  name: string;
  priceDeltaPaise: number;
  isDefault?: boolean;
}

export interface ProductAddOn {
  id: string;
  name: string;
  subtitle?: string;
  pricePaise: number;
  thumbnail?: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  category: ServiceCategoryId;
  vendorId: string;
  vendorName: string;
  pricePaise: number;
  originalPricePaise?: number;
  calories?: number;
  prepTimeMinutes?: number;
  deliveryWindow?: string;
  image: string;
  rating: number;
  reviewCount: number;
  description: string;
  isBestSeller?: boolean;
  isGeofenceGuaranteed?: boolean;
  unit: string;
  sizes?: ProductOption[];
  addOns?: ProductAddOn[];
}

export interface CartItem {
  id: string;
  product: CatalogProduct;
  selectedSize?: ProductOption;
  selectedAddOns: ProductAddOn[];
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
}

export interface GeofenceArea {
  id: string;
  name: string;
  societyName: string;
  city: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  isInside: boolean;
  distanceMeters: number;
  deliveryGuarantee: string;
}

export interface ActiveRoutine {
  id: string;
  productName: string;
  vendorName: string;
  quantity: number;
  cadence: "DAILY" | "WEEKDAYS" | "ALTERNATE_DAYS";
  shift: string;
  status: "ACTIVE" | "PAUSED" | "DELIVERED";
  nextDelivery: string;
  unitPricePaise: number;
  image: string;
}

export interface DeliveryTimelineStep {
  id: string;
  title: string;
  subtitle?: string;
  time: string;
  status: "completed" | "current" | "pending";
}

export interface LiveTrackingOrder {
  id: string;
  orderNumber: string;
  vendorName: string;
  etaMinutes: number;
  statusText: string;
  totalPaise: number;
  driver: {
    name: string;
    photo: string;
    rating: number;
    phone: string;
  };
  steps: DeliveryTimelineStep[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "ORDER" | "ROUTINE" | "OFFER" | "SYSTEM";
  read: boolean;
  vendorAvatar?: string;
  actionLabel?: string;
}

export interface CatalogVendor {
  id: string;
  name: string;
  category: ServiceCategoryId;
  image: string;
  bannerImage: string;
  rating: number;
  reviewCount: number;
  deliveryWindow: string;
  address: string;
  fssaiNumber: string;
  description: string;
  societiesCovered: string[];
  isVerified: boolean;
  badge?: string;
  openingHours: string;
  minOrderPaise: number;
  phone?: string;
  tags?: string[];
}
