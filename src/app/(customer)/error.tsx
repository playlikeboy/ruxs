"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { reloadIfStaleDeploy } from "@/lib/stale-deploy";
import { Button } from "@/components/ui/button";

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
    <div className="p-4 sm:p-6">
      <div role="alert" className="mx-auto my-8 max-w-sm space-y-4 rounded-card border border-line bg-surface p-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-bad/5 text-bad">
          <TriangleAlert className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-ink">Could not load this page</h1>
          <p className="mt-1 text-sm text-muted">
            We couldn’t load your private service link. Try again, or contact your service provider if it keeps happening.
          </p>
        </div>
        {error.digest ? <p className="text-xs text-muted">Reference: {error.digest}</p> : null}
        <Button type="button" size="sm" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
