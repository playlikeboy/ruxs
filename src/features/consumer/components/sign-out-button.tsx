"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useHexclaveApp } from "@hexclave/next";

export function SignOutButton({ className = "" }: { className?: string }) {
  const app = useHexclaveApp();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const user = await app.getUser();
          if (user) await user.signOut();
          else router.push("/");
        } catch {
          setPending(false);
        }
      }}
      className={"flex items-center gap-2 font-semibold disabled:opacity-60 " + className}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
