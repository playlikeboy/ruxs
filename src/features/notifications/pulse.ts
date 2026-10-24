"use server";

import { z } from "zod";
import { requireVendorAccess } from "@/lib/auth/session";
import { canUseModule, isKidsVendorType, toVendorType } from "@/core/vendor-types";
import { countOpenShopOrders } from "@/features/shop-orders/queries";
import { countKidsRequests } from "@/features/kids/provider-calendar";

export type MerchantPulse = { orders: number; requests: number };

/** What needs the merchant's attention right now. Polled by the open panel. */
export async function getMerchantPulse(input: unknown): Promise<MerchantPulse> {
  const parsed = z.object({ slug: z.string().min(1).max(120) }).safeParse(input);
  if (!parsed.success) return { orders: 0, requests: 0 };
  const access = await requireVendorAccess(parsed.data.slug);
  return merchantPulseFor(access.vendorId, toVendorType(access.vendor.vendorType, access.vendor.businessType));
}

async function merchantPulseFor(vendorId: string, type: ReturnType<typeof toVendorType>): Promise<MerchantPulse> {
  const [orders, requests] = await Promise.all([
    canUseModule(type, "orders") ? countOpenShopOrders(vendorId) : 0,
    isKidsVendorType(type) ? countKidsRequests(vendorId) : 0,
  ]);
  return { orders, requests };
}
