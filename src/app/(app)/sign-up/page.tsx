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
    <div className="py-8 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <SignUp fullPage={false} automaticRedirect />
        <p className="mt-6 text-center text-sm text-muted">
          Already have a merchant account?{" "}
          <Link href="/sign-in" className="font-semibold text-accent underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
