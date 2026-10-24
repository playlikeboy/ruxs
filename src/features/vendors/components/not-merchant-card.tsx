import Link from "next/link";
import { SignOutButton } from "@/features/consumer/components/sign-out-button";

/** Shown when a signed-in household account opens the merchant panel. */
export function NotMerchantCard({ email }: { email: string | null }) {
  return (
    <div className="space-y-4 rounded-[16px] border border-white/10 bg-white/5 p-5 text-white">
      <h2 className="text-lg font-semibold">This isn&apos;t a merchant account</h2>
      <p className="text-sm leading-6 text-white/70">
        {email ? <strong className="text-white">{email}</strong> : "This account"} is signed in as a household. Merchant logins are issued by the RUXs team, or you can apply to list your business.
      </p>
      <div className="grid gap-2">
        <Link href="/apply" className="flex h-11 items-center justify-center rounded-[12px] bg-accent text-sm font-bold text-white">Apply to sell on RUXs</Link>
        <Link href="/app" className="flex h-11 items-center justify-center rounded-[12px] border border-white/15 text-sm font-semibold text-white">Go to the household app</Link>
        <SignOutButton className="h-11 justify-center rounded-[12px] text-sm text-white/70" />
      </div>
    </div>
  );
}
