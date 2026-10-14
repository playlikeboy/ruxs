"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConsumerTokenForm({ defaultToken = "" }: { defaultToken?: string }) {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState(defaultToken);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanToken = tokenInput.trim().replace(/^.*\/c\//, "");
    if (cleanToken) {
      router.push(`/app?token=${encodeURIComponent(cleanToken)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
      <div className="relative flex-1">
        <input
          type="text"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="Enter 6-char token or paste ruxs.in/c/token link"
          className="w-full rounded-[10px] border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          required
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:opacity-90 active:scale-95"
      >
        <span>Open Delivery Hub</span>
        <span aria-hidden="true" className="ml-1.5">→</span>
      </button>
    </form>
  );
}
