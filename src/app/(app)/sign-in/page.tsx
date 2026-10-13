import { redirect } from "next/navigation";
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
      </div>
    </div>
  );
}
