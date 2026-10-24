import { UiIcon } from "@/components/ui/app-icon";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignUp } from "@hexclave/next";
import { hexclave } from "@/lib/auth/hexclave";

export default async function SignUpPage() {
  const user = await hexclave.getUser();
  if (user) {
    redirect("/app");
  }

  return (
    <div className="flex min-h-[90dvh] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="text-4xl" aria-hidden="true"><UiIcon name="tiffin" /><UiIcon name="water" /></span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">Home essentials, on repeat</h1>
          <p className="mt-1 text-sm text-muted">Tiffins, water cans and more from kitchens near you.</p>
        </div>
        <SignUp fullPage={false} automaticRedirect />
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-accent underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
