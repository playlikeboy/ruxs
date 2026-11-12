"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { reloadIfStaleDeploy } from "@/lib/stale-deploy";
import { Button, ButtonLink } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (reloadIfStaleDeploy(error)) return;
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto my-8 max-w-sm space-y-4 rounded-card border border-line bg-surface p-6 text-center">
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blush text-bad" aria-hidden="true">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-base font-semibold text-ink">Something went wrong</h2>
        <p className="mt-1 text-sm text-muted">
          We couldn’t load this view. Try again, or go back to the merchant panel.
        </p>
      </div>
      {error.digest ? <p className="text-xs text-muted">Reference: {error.digest}</p> : null}
      <div className="flex items-center justify-center gap-3">
        <Button type="button" size="sm" onClick={() => reset()}>
          Try again
        </Button>
        <ButtonLink href="/merchant-panel" variant="secondary" size="sm">
          Merchant panel
        </ButtonLink>
      </div>
    </div>
  );
}
