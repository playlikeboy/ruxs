"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminSetReviewHidden, replyToReview } from "@/features/reviews/actions";

export function ReplyForm({ slug, reviewId, initial }: { slug: string; reviewId: string; initial: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-accent">
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
            router.refresh();
          }
        });
      }}
    >
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={500} placeholder="Thank them, or explain what you're fixing" className="w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="h-9 rounded-[10px] bg-ink px-3 text-xs font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save reply"}</button>
        <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-[10px] border border-line px-3 text-xs font-semibold">Cancel</button>
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
      className={"text-xs font-semibold disabled:opacity-60 " + (hidden ? "text-good" : "text-bad")}
    >
      {hidden ? "Show" : "Hide"}
    </button>
  );
}
