"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resetCustomerLink } from "@/features/customers/actions";

export function ResetLinkButton({
  slug,
  customerId,
}: {
  slug: string;
  customerId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [rawLink, setRawLink] = useState<string | null>(null);

  const handleReset = () => {
    if (
      !window.confirm(
        "Reset this link? The household's old link stops working right away and a new one is created."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await resetCustomerLink({ slug, customerId });
      if (!res.ok) {
        toast.error(res.error ?? "Could not reset the link");
      } else if (res.rawLink) {
        setRawLink(res.rawLink);
        try {
          await navigator.clipboard.writeText(res.rawLink);
          toast.success("New private link created and copied");
        } catch {
          toast.success("New private link created");
        }
      }
    });
  };

  const handleCopy = async () => {
    if (!rawLink) return;
    try {
      await navigator.clipboard.writeText(rawLink);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleReset}
        className="min-h-10 text-xs text-muted underline hover:text-bad disabled:opacity-50"
      >
        {isPending ? "Resetting link…" : "Reset private link"}
      </button>

      {rawLink && (
        <div className="space-y-2 rounded-control border border-accent bg-surface p-3">
          <span className="block text-xs font-semibold text-accent">
            New household link
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              aria-label="New household link"
              value={rawLink}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-md border border-line bg-app-canvas px-2 py-1.5 font-mono text-xs text-ink"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-10 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent/90 active:scale-95"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
