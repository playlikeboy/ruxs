import { redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { hexclave } from "@/lib/auth/hexclave";
import { isUserAdmin } from "@/lib/auth/session";
import { SellerSignInForm } from "@/features/store/seller-components/seller-sign-in-form";
import { SignOutButton } from "@/features/consumer/components/sign-out-button";

export const metadata = { title: "Sign in" };

/** Entry for the RUXs Store team. Not linked from the household app or the public site. */
export default async function SellerSignInPage() {
  const user = await hexclave.getUser();
  const isAdmin = user ? await isUserAdmin(user) : false;
  if (isAdmin) redirect("/seller-portal");

  return (
    <div className="min-h-dvh bg-ink text-white">
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/10">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold text-white/80">RUXs Store</span>
        </div>
        <h1 className="mt-8 text-2xl font-bold tracking-tight">Seller portal</h1>
        <p className="mt-1 text-sm text-white/70">For the RUXs Store team. Sign in with your admin account.</p>
        <div className="mt-8">
          {user ? (
            <div className="space-y-4 rounded-[14px] border border-white/10 p-5">
              <p className="text-sm text-white/70">
                <span className="break-all font-semibold text-white">{user.primaryEmail}</span> doesn&apos;t have access to the seller portal.
              </p>
              <SignOutButton className="h-11 w-full justify-center rounded-[12px] border border-white/15 text-sm text-white" />
            </div>
          ) : (
            <SellerSignInForm />
          )}
        </div>
      </main>
    </div>
  );
}
