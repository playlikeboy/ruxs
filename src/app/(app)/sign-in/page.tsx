import { RuxsMark } from "@/components/marketing/ruxs-mark";
import { InstallAppPrompt } from "@/components/pwa/install-app-prompt";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignIn } from "@hexclave/next";
import { hexclave } from "@/lib/auth/hexclave";

export default async function SignInPage() {
  const user = await hexclave.getUser();
  if (user) {
    redirect("/app");
  }

  return (
    <div className="flex min-h-[90dvh] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <RuxsMark className="mx-auto h-14 w-14" aria-hidden="true" />
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">Your neighbourhood, in one app</h1>
          <p className="mt-1 text-sm text-muted">Kids classes, learning kits, meals, water and local stores near you.</p>
        </div>
        <SignIn fullPage={false} automaticRedirect />
        <p className="mt-6 text-center text-sm text-muted">
          New to RUXs?{" "}
          <Link href="/sign-up" className="font-semibold text-accent underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted">
          Run a local business or teach kids?{" "}
          <Link href="/merchant-panel/sign-in" className="font-semibold text-ink underline-offset-4 hover:underline">
            Go to the merchant panel
          </Link>
        </p>
        <InstallAppPrompt variant="banner" className="mt-6" />
      </div>
    </div>
  );
}
