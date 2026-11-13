import Link from "next/link";
import { CalendarCheck, ReceiptIndianRupee } from "lucide-react";
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
      <nav aria-label="Your orders and plans" className="grid grid-cols-2 gap-2.5 px-4 pt-4">
        <Link href="/app/orders" className="flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-ink/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
          <ReceiptIndianRupee className="h-4 w-4 text-accent" aria-hidden="true" /> Orders
        </Link>
        <Link href="/app/plans" className="flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-ink/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
          <CalendarCheck className="h-4 w-4 text-accent" aria-hidden="true" /> Plans
        </Link>
      </nav>
      <Checkout address={address} name={profile?.name ?? null} onlineEnabled={!!razorpayKeyId()} />
    </div>
  );
}
