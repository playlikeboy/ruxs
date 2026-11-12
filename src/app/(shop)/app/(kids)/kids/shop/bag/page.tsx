import type { Metadata } from "next";
import { getMyProfile } from "@/features/consumer/queries";
import { addressLine } from "@/features/consumer/household";
import { KidsBackLink, KidsPageHeader } from "@/features/kids/components/kids-ui";
import { BagCheckout } from "@/features/store/components/bag-checkout";
import { razorpayKeyId } from "@/lib/razorpay";

export const metadata: Metadata = { title: "Bag · RUXs Store" };

export default async function StoreBagPage() {
  const { profile } = await getMyProfile();
  const contact = profile ? { name: profile.name, phone: profile.phone, address: addressLine(profile) } : null;

  return (
    <div className="space-y-4">
      <KidsBackLink href="/app/kids/shop" label="Keep shopping" />
      <KidsPageHeader title="Your bag" lead="Prices and stock are checked again before you pay." />
      <BagCheckout profile={contact} onlineEnabled={!!razorpayKeyId()} />
    </div>
  );
}
