import { redirect } from "next/navigation";
import { hexclave } from "@/lib/auth/hexclave";
import { AuthRedirect } from "@/components/auth/auth-redirect";

export default async function SignInPage() {
  const user = await hexclave.getUser();
  if (user) {
    redirect("/app");
  }

  return <AuthRedirect />;
}
