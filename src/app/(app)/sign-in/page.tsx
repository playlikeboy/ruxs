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
    <div className="py-8 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <SignIn fullPage={false} automaticRedirect />
        <p className="mt-6 text-center text-sm text-muted">
          Need a merchant account?{" "}
          <Link href="/sign-up" className="font-semibold text-accent underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
