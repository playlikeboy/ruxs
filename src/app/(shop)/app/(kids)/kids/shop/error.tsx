"use client";

import { useEffect } from "react";
import { reloadIfStaleDeploy } from "@/lib/stale-deploy";
import { Button, ButtonLink } from "@/components/ui/button";

/** Keeps a failed store page inside the Kids shell (tabs and store bar stay) instead of the full-page global error. */
export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (reloadIfStaleDeploy(error)) return;
    console.error("RUXs Store error boundary caught:", error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto my-6 max-w-sm space-y-4 rounded-card border border-kids-ink/10 bg-white p-6 text-center">
      <div>
        <h2 className="font-kids text-xl font-semibold text-kids-ink">This page didn&apos;t load</h2>
        <p className="mt-1 text-[15px] leading-snug text-kids-ink/70">Your bag is still saved on this device. Try again, or go back to the store.</p>
      </div>
      {error.digest ? (
        <p className="text-xs text-kids-ink/65">
          Reference: <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" size="sm" onClick={() => reset()}>
          Try again
        </Button>
        <ButtonLink href="/app/kids/shop" variant="secondary" size="sm">
          Back to the store
        </ButtonLink>
      </div>
    </div>
  );
}
