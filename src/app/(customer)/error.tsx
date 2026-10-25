"use client";

import { useEffect } from "react";
import { reloadIfStaleDeploy } from "@/lib/stale-deploy";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (reloadIfStaleDeploy(error)) return;
    console.error("Customer-link error:", error);
  }, [error]);

  return (
    <div className="p-6 my-8 text-center space-y-4 bg-surface border border-line rounded-[12px] max-w-sm mx-auto shadow-xs">
      <div className="w-10 h-10 mx-auto rounded-full bg-[#FCE4EC] text-[#B42318] flex items-center justify-center font-bold">
        !
      </div>
      <div>
        <h2 className="text-base font-semibold text-ink">Could not load household link</h2>
        <p className="text-xs text-muted mt-1">
          We couldn’t load this private service link. Retry, or contact your service provider if the problem continues.
        </p>
      </div>
      {error.digest ? <p className="text-[11px] text-muted">Reference: {error.digest}</p> : null}
      <button
        type="button"
        onClick={() => reset()}
        className="py-2 px-4 bg-accent text-white text-xs font-semibold rounded-[8px] hover:opacity-90 active:scale-95 transition-all shadow-xs"
      >
        Retry
      </button>
    </div>
  );
}
