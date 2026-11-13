"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reloadIfStaleDeploy } from "@/lib/stale-deploy";
import { buttonClass } from "@/components/ui/button";

/** Keeps a failed page inside the portal shell instead of the full-page global error. */
export default function SellerPortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (reloadIfStaleDeploy(error)) return;
    console.error("Seller portal error boundary caught:", error);
  }, [error]);

  return (
    <div role="alert" className="mx-4 my-8 max-w-sm space-y-4 rounded-card border border-line bg-surface p-6 text-center sm:mx-auto">
      <div>
        <h2 className="text-base font-semibold text-ink">This page didn&apos;t load</h2>
        <p className="mt-1 text-sm text-muted">Nothing was changed. Try again, or go back to the dashboard.</p>
      </div>
      {error.digest ? (
        <p className="text-xs text-muted">
          Reference: <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
      <div className="flex items-center justify-center gap-3">
        <button type="button" onClick={() => reset()} className={buttonClass("primary", "sm")}>
          Try again
        </button>
        <Link href="/seller-portal" className={buttonClass("secondary", "sm")}>
          Dashboard
        </Link>
      </div>
    </div>
  );
}
