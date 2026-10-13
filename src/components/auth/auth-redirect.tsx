"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHexclaveApp } from "@hexclave/next";

export function AuthRedirect() {
  const router = useRouter();
  const app = useHexclaveApp();

  useEffect(() => {
    try {
      app.redirectToSignIn();
    } catch {
      router.push("/sign-in");
    }
  }, [app, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-lg font-semibold text-ink mb-1">Connecting to sign in</h2>
      <p className="text-sm text-muted mb-4 max-w-xs">
        Redirecting to secure authentication...
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            app.redirectToSignIn();
          } catch {
            router.push("/sign-in");
          }
        }}
        className="text-xs text-accent underline hover:opacity-80 transition-opacity"
      >
        Click here if not redirected automatically
      </button>
    </div>
  );
}
