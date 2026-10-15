import { getMyProfile } from "@/features/consumer/queries";
import { PageHeader } from "@/features/consumer/components/page-header";
import { Checkout } from "@/features/consumer/components/checkout";
import { razorpayKeyId } from "@/lib/razorpay";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const { profile } = await getMyProfile();
  const address = profile
    ? [profile.flat, profile.tower && `Tower ${profile.tower}`, profile.society, profile.area].filter(Boolean).join(", ")
    : null;

  return (
    <div className="min-h-dvh bg-neutral-50">
      <PageHeader title="Cart" back="/app" />
      <Checkout address={address} name={profile?.name ?? null} onlineEnabled={!!razorpayKeyId()} />
    </div>
  );
}
