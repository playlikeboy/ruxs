"use client";

import { toast } from "sonner";

interface CopyShareButtonProps {
  url: string;
  title?: string;
  label?: string;
  className?: string;
}

export function CopyShareButton({
  url,
  title = "Household Link",
  label = "Share",
  className,
}: CopyShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Your daily service link: ${fullUrl}`,
          url: fullUrl,
        });
        toast.success("Link shared");
        return;
      } catch (err) {
        // The person closed the share sheet: respect that and don't copy.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Fall back to copy if cancelled or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={
        className ??
        "inline-flex min-h-10 items-center gap-1 rounded-lg border border-line bg-app-canvas px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-surface active:scale-95"
      }
    >
      <svg
        className="w-3.5 h-3.5 stroke-current fill-none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
