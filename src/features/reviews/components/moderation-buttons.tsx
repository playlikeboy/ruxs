"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminSetReviewHidden, replyToReview } from "@/features/reviews/actions";

export function ReplyForm({
  slug,
  reviewId,
  initial,
  onSuccess,
}: {
  slug: string;
  reviewId: string;
  initial: string | null;
  onSuccess?: (reply: string | null) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-10 text-xs font-semibold text-accent hover:underline">
        {initial ? "Edit reply" : "Reply publicly"}
      </button>
    );
  }
  return (
    <form
      className="mt-2 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await replyToReview({ slug, reviewId, reply: text });
          if (!res.ok) toast.error(res.error);
          else {
            toast.success(text ? "Reply posted" : "Reply removed");
            setOpen(false);
            onSuccess?.(text.trim() || null);
            router.refresh();
          }
        });
      }}
    >
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={500} aria-label="Your public reply" placeholder="Thank them, or explain what you're fixing" className="w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30" />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="h-10 rounded-control bg-ink px-3 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-60">{pending ? "Saving…" : "Save reply"}</button>
        <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-control border border-line px-3 text-xs font-semibold text-ink hover:bg-app-canvas">Cancel</button>
      </div>
    </form>
  );
}

export function HideReviewButton({ reviewId, hidden }: { reviewId: string; hidden: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await adminSetReviewHidden({ reviewId, hidden: !hidden });
          if (!res.ok) toast.error(res.error);
          else {
            toast.success(hidden ? "Review shown again" : "Review hidden");
            router.refresh();
          }
        })
      }
      className={"min-h-10 text-xs font-semibold hover:underline disabled:opacity-60 " + (hidden ? "text-good" : "text-bad")}
    >
      {hidden ? "Show" : "Hide"}
    </button>
  );
}
