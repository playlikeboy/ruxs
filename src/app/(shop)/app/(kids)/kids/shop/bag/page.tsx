import type { Metadata } from "next";
import { getMyStoreCheckoutPrefill } from "@/features/store/queries";
import { KidsBackLink, KidsPageHeader } from "@/features/kids/components/kids-ui";
import { BagCheckout } from "@/features/store/components/bag-checkout";
import { razorpayKeyId } from "@/lib/razorpay";

export const metadata: Metadata = { title: "Bag · RUXs Store" };

export default async function StoreBagPage() {
  // Last store order first, else the saved RUXs profile; the device's last-used address wins in the browser.
  const prefill = await getMyStoreCheckoutPrefill();

  return (
    <div className="space-y-4">
      <KidsBackLink href="/app/kids/shop" label="Keep shopping" />
      <KidsPageHeader title="Your bag" lead="Prices, stock and delivery are checked again before you pay." />
      <BagCheckout prefill={prefill} onlineEnabled={!!razorpayKeyId()} />
    </div>
  );
}
