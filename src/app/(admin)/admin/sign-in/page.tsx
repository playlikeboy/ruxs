import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { hexclave } from "@/lib/auth/hexclave";
import { isUserAdmin } from "@/lib/auth/session";
import { AdminSignInForm } from "@/features/admin/components/admin-sign-in-form";
import { SignOutButton } from "@/features/consumer/components/sign-out-button";

export const metadata = { title: "Sign in" };

/** Hidden entry for the platform team. Not linked from anywhere in the app. */
export default async function AdminSignInPage() {
  const user = await hexclave.getUser();
  const isAdmin = user ? await isUserAdmin(user) : false;
  if (isAdmin) redirect("/admin");

  return (
    <div className="min-h-dvh bg-[#0E0E10] text-white">
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/10">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-wide text-white/80">RUXs · Restricted</span>
        </div>
        <h1 className="mt-8 text-2xl font-bold tracking-tight">Platform admin</h1>
        <p className="mt-1 text-sm text-white/50">Authorised team members only.</p>
        <div className="mt-8">
          {user ? (
            <div className="space-y-4 rounded-[14px] border border-white/10 p-5">
              <p className="text-sm text-white/70">
                <span className="font-semibold text-white">{user.primaryEmail}</span> doesn&apos;t have admin access.
              </p>
              <SignOutButton className="h-11 w-full justify-center rounded-[12px] border border-white/15 text-sm text-white" />
            </div>
          ) : (
            <AdminSignInForm />
          )}
        </div>
      </div>
    </div>
  );
}
