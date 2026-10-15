import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendorMembers } from "@/db/schema";
import { hexclave } from "@/lib/auth/hexclave";
import { isUserAdmin } from "@/lib/auth/session";
import { MerchantSignInForm } from "@/features/vendors/components/merchant-sign-in-form";
import { NotMerchantCard } from "@/features/vendors/components/not-merchant-card";

export const metadata = { title: "Merchant sign in" };

export default async function MerchantSignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: rawNext } = await searchParams;
  const next = rawNext && /^\/(merchant-panel|admin)(\/|$)/.test(rawNext) ? rawNext : "/merchant-panel";

  const user = await hexclave.getUser();
  let signedInHousehold = false;
  if (user) {
    const db = getDb();
    const [membership] = await db.select({ v: vendorMembers.vendorId }).from(vendorMembers).where(eq(vendorMembers.userId, user.id)).limit(1);
    if (membership || (await isUserAdmin(user))) redirect(next);
    signedInHousehold = true;
  }

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto bg-[#141311]">
      <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6 py-10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-accent text-lg font-black text-white">R</span>
          <span>
            <span className="block text-sm font-bold tracking-wide text-white">RUXS</span>
            <span className="block text-xs font-medium uppercase tracking-[0.18em] text-white/50">Merchant panel</span>
          </span>
        </div>
        <h1 className="mt-10 text-[28px] font-bold leading-tight tracking-tight text-white">Run your kitchen or water business.</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">Orders, daily plans, menu, run sheets and monthly bills, in one place.</p>

        <div className="mt-8">
          {signedInHousehold ? <NotMerchantCard email={user?.primaryEmail ?? null} /> : <MerchantSignInForm next={next} />}
        </div>

        {!signedInHousehold && (
          <div className="mt-8 space-y-3 text-center text-sm text-white/60">
            <p>
              New merchant?{" "}
              <Link href="/onboarding" className="font-semibold text-white underline-offset-4 hover:underline">Apply to sell on RUXS</Link>
            </p>
            <p>
              Ordering for your home?{" "}
              <Link href="/sign-in" className="font-semibold text-white underline-offset-4 hover:underline">Household sign in</Link>
            </p>
            <p>
              <Link href="/handler/forgot-password" className="text-white/50 underline-offset-4 hover:underline">Forgot password?</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
