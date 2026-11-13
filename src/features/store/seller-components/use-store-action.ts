"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { StoreActionResult } from "../types";

/**
 * Runs a store server action the way every portal island does: one transition,
 * an inline error (or a toast when nothing can show it), a success toast, then
 * a refresh so the server-rendered page shows the saved state.
 */
export function useStoreAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run<T extends object>(
    action: () => Promise<StoreActionResult<T>>,
    opts: {
      /** Toast text; return null to stay quiet. */
      success?: string | ((res: { ok: true } & T) => string | null);
      onOk?: (res: { ok: true } & T) => void;
      /** Show a failure as a toast instead of the inline error. */
      toastError?: boolean;
      refresh?: boolean;
    } = {}
  ) {
    setError(null);
    start(async () => {
      let res: StoreActionResult<T>;
      try {
        res = await action();
      } catch {
        res = { ok: false, error: "Could not reach the server. Check your connection and try again." };
      }
      if (!res.ok) {
        if (opts.toastError) toast.error(res.error);
        else setError(res.error);
        return;
      }
      const text = typeof opts.success === "function" ? opts.success(res) : opts.success;
      if (text) toast.success(text);
      opts.onOk?.(res);
      if (opts.refresh !== false) router.refresh();
    });
  }

  return { pending, error, setError, run };
}
