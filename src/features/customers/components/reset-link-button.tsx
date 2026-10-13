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
      !confirm(
        "Are you sure? The household's old link will stop working immediately and a fresh one will be generated."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await resetCustomerLink({ slug, customerId });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to reset link");
      } else if (res.rawLink) {
        setRawLink(res.rawLink);
        try {
          await navigator.clipboard.writeText(res.rawLink);
          toast.success("New private link generated and copied to clipboard!");
        } catch {
          toast.success("New private link generated!");
        }
      }
    });
  };

  const handleCopy = async () => {
    if (!rawLink) return;
    try {
      await navigator.clipboard.writeText(rawLink);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleReset}
        className="text-xs text-muted hover:text-[#B42318] underline disabled:opacity-50"
      >
        {isPending ? "Resetting link..." : "Reset Private Link"}
      </button>

      {rawLink && (
        <div className="p-3 bg-surface border border-accent rounded-[10px] space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-accent block">
            New Household Link:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={rawLink}
              className="flex-1 text-xs font-mono bg-[#FAFAF7] border border-line px-2 py-1.5 rounded-[6px]"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs bg-accent text-white px-3 py-1.5 rounded-[6px] font-medium hover:opacity-90 active:scale-95 transition-all"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
