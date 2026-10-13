"use client";

import { useTransition } from "react";
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

  const handleReset = () => {
    if (!confirm("Are you sure? The household's old link will stop working immediately and a fresh one will be generated.")) {
      return;
    }

    startTransition(async () => {
      const res = await resetCustomerLink({ slug, customerId });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to reset link");
      } else {
        toast.success("New private link generated!");
      }
    });
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleReset}
      className="text-xs text-muted hover:text-[#B42318] underline disabled:opacity-50"
    >
      {isPending ? "Resetting link..." : "Reset Private Link"}
    </button>
  );
}
