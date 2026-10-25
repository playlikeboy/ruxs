"use client";

import { useEffect } from "react";
import Link from "next/link";

/** Keeps admin errors inside the console shell instead of the full-page global error. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin error boundary caught:", error);
  }, [error]);

  return (
    <div className="mx-auto my-8 max-w-sm space-y-4 rounded-[12px] border border-line bg-surface p-6 text-center">
      <div>
        <h2 className="text-base font-semibold text-ink">Something went wrong</h2>
        <p className="mt-1 text-xs text-muted">This admin page failed to load. Retry, or go back to the vendor list.</p>
      </div>
      {error.digest ? <p className="text-[11px] text-muted">Reference: {error.digest}</p> : null}
      <div className="flex items-center justify-center gap-3">
        <button type="button" onClick={() => reset()} className="rounded-[8px] bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
          Try again
        </button>
        <Link href="/admin/vendors" className="rounded-[8px] border border-line px-4 py-2 text-xs font-semibold text-ink">
          Vendors
        </Link>
      </div>
    </div>
  );
}
