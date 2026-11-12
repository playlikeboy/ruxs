"use client";

import { useEffect } from "react";
import { reloadIfStaleDeploy } from "@/lib/stale-deploy";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

/** Keeps admin errors inside the console shell instead of the full-page global error. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (reloadIfStaleDeploy(error)) return;
    console.error("Admin error boundary caught:", error);
  }, [error]);

  return (
    <div role="alert" className="mx-4 my-8 max-w-sm space-y-4 rounded-card border border-line bg-surface p-6 text-center sm:mx-auto">
      <div>
        <h2 className="text-base font-semibold text-ink">Something went wrong</h2>
        <p className="mt-1 text-xs text-muted">This admin page failed to load. Retry, or go back to the vendor list.</p>
      </div>
      {error.digest ? <p className="text-xs text-muted">Reference: <span className="font-mono">{error.digest}</span></p> : null}
      <div className="flex items-center justify-center gap-3">
        <button type="button" onClick={() => reset()} className={buttonClass("primary", "sm")}>
          Try again
        </button>
        <Link href="/admin/vendors" className={buttonClass("secondary", "sm")}>
          Vendors
        </Link>
      </div>
    </div>
  );
}
