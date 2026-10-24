/**
 * What a household pays for an app order, line by line. Integer paise only.
 * Order: listed price, minus the store's discount, then GST (added on top, or
 * shown as already inside the price), plus delivery. The RUXs fee is paid by
 * the store out of its share and never added to the household's total.
 */

export const GST_RATES_BPS = [0, 500, 1200, 1800, 2800] as const;

export interface PricingRules {
  gstBps: number; // 1800 = 18%
  pricesIncludeGst: boolean;
  discountBps: number; // store-wide discount, 1000 = 10%
  commissionBps: number; // RUXs fee on goods, paid by the store
}

export interface PriceBreakup {
  itemsPaise: number;
  discountPaise: number;
  taxablePaise: number;
  gstPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
  commissionPaise: number;
  storeReceivesPaise: number;
}

function wholePaise(v: number, name: string) {
  if (!Number.isInteger(v) || v < 0) throw new Error(`${name} must be non-negative integer paise`);
}

function bps(v: number, max: number, name: string) {
  if (!Number.isInteger(v) || v < 0 || v > max) throw new Error(`${name} must be between 0 and ${max} basis points`);
}

export function priceBreakup(itemsPaise: number, deliveryFeePaise: number, rules: PricingRules): PriceBreakup {
  wholePaise(itemsPaise, "Items");
  wholePaise(deliveryFeePaise, "Delivery fee");
  bps(rules.gstBps, 2800, "GST");
  bps(rules.discountBps, 9000, "Discount");
  bps(rules.commissionBps, 10000, "Commission");

  const discountPaise = Math.round((itemsPaise * rules.discountBps) / 10000);
  const goods = itemsPaise - discountPaise;
  const gstPaise = rules.pricesIncludeGst
    ? goods - Math.round((goods * 10000) / (10000 + rules.gstBps))
    : Math.round((goods * rules.gstBps) / 10000);
  const taxablePaise = rules.pricesIncludeGst ? goods - gstPaise : goods;
  const goodsWithGst = rules.pricesIncludeGst ? goods : goods + gstPaise;
  const totalPaise = goodsWithGst + deliveryFeePaise;
  const commissionPaise = Math.round((goodsWithGst * rules.commissionBps) / 10000);

  return {
    itemsPaise,
    discountPaise,
    taxablePaise,
    gstPaise,
    deliveryFeePaise,
    totalPaise,
    commissionPaise,
    storeReceivesPaise: totalPaise - commissionPaise,
  };
}

export function percentLabel(bpsValue: number) {
  return `${(bpsValue / 100).toString().replace(/\.0+$/, "")}%`;
}

/** The pricing rules stored on a vendor row. */
export function vendorPricing(v: { gstBps: number; pricesIncludeGst: boolean; discountBps: number; commissionBps: number }): PricingRules {
  return { gstBps: v.gstBps, pricesIncludeGst: v.pricesIncludeGst, discountBps: v.discountBps, commissionBps: v.commissionBps };
}

/** Rebuilds the bill from what an order saved at checkout (the RUXs fee is not shown afterwards). */
export function storedBreakup(o: { subtotalPaise: number; discountPaise: number; gstPaise: number; gstIncluded: boolean; deliveryFeePaise: number; totalPaise: number }): PriceBreakup {
  const goods = o.subtotalPaise - o.discountPaise;
  return {
    itemsPaise: o.subtotalPaise,
    discountPaise: o.discountPaise,
    gstPaise: o.gstPaise,
    taxablePaise: o.gstIncluded ? goods - o.gstPaise : goods,
    deliveryFeePaise: o.deliveryFeePaise,
    totalPaise: o.totalPaise,
    commissionPaise: 0,
    storeReceivesPaise: o.totalPaise,
  };
}
