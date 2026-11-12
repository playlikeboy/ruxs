"use client";

import { useEffect } from "react";
import { reloadIfStaleDeploy } from "@/lib/stale-deploy";
// global-error replaces the root layout, so it must load the global styles itself.
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (reloadIfStaleDeploy(error)) return;
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en-IN">
      <body className="flex min-h-screen flex-col items-center justify-center bg-bg p-6 text-center text-ink antialiased">
        <title>Something went wrong | RUXs</title>
        <main className="flex flex-col items-center">
          <p
            aria-hidden="true"
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bad/10 text-2xl font-bold text-bad"
          >
            !
          </p>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mb-3 max-w-sm text-sm text-muted">
            We couldn’t load this page. Try again, or return to the RUXs homepage.
          </p>
          {error.digest ? <p className="mb-5 text-xs text-muted">Reference: {error.digest}</p> : null}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent/90 active:scale-[0.98]"
            >
              Try again
            </button>
            {/* A plain anchor forces a full document load, which a broken root layout needs. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-control border border-line bg-surface px-4 text-sm font-semibold text-ink transition hover:bg-brand-peach/40"
            >
              Return to homepage
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
