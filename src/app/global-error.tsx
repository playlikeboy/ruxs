"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en-IN">
      <body className="min-h-screen bg-[#FAFAF7] text-[#1C1B19] flex flex-col items-center justify-center p-6 text-center antialiased">
        <div className="w-16 h-16 rounded-full bg-[#FCE4EC] text-[#B42318] flex items-center justify-center font-bold text-2xl mb-4">
          !
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-[#6B6862] max-w-sm mb-3">
          We couldn’t load this page. Please try again or return to the RUXS homepage.
        </p>
        {error.digest ? (
          <p className="mb-5 text-xs text-[#6B6862]">Reference: {error.digest}</p>
        ) : null}
        <a href="/" className="mb-3 inline-flex rounded-[10px] border border-[#E7E5DF] px-4 py-2.5 text-xs font-semibold">
          Return to homepage
        </a>
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2.5 bg-[#BD4B2A] text-white text-xs font-semibold rounded-[10px] hover:opacity-90 active:scale-95 transition-all shadow-xs"
        >
          Reload Application
        </button>
      </body>
    </html>
  );
}
