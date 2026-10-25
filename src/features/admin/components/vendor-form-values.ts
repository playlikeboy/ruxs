// Plain module (no "use client"): server components import EMPTY_VENDOR, and a
// value exported from a client file reaches the server only as a reference stub.

export interface VendorFormValues {
  vendorId?: string;
  applicationId?: string;
  slug: string;
  name: string;
  phone: string;
  upiVpa: string;
  city: string;
  area: string;
  description: string;
  latitude: string;
  longitude: string;
  serviceRadiusKm: string;
  deliveryFeeRupees: string;
  minOrderRupees: string;
  commissionPercent: string;
  plan: "free" | "starter" | "pro";
  acceptingOrders: boolean;
  businessType: "delivery" | "booking";
  categoryId: string;
  mapsUrl: string;
}

export interface OnboardCategory {
  id: string;
  label: string;
  emoji: string;
  blurb: string;
  fulfilment: string;
  tint: string;
  vendorType: string;
}

export const EMPTY_VENDOR: VendorFormValues = {
  slug: "",
  name: "",
  phone: "+91",
  upiVpa: "",
  city: "",
  area: "",
  description: "",
  latitude: "",
  longitude: "",
  serviceRadiusKm: "8",
  deliveryFeeRupees: "0",
  minOrderRupees: "0",
  commissionPercent: "0",
  plan: "free",
  acceptingOrders: true,
  businessType: "delivery",
  categoryId: "",
  mapsUrl: "",
};
