"use client";

import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { getYouTubeEmbedUrl } from "@/core/media";

/** "Watch preview" link that opens the provider's YouTube clip in a dialog. */
export function KidsVideoButton({ url, title }: { url?: string | null; title: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const embedUrl = getYouTubeEmbedUrl(url ?? undefined);

  // Native modal dialog: traps focus, closes on Escape and returns focus to the button.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!embedUrl) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-kids-ink underline-offset-4 hover:underline">
        <Play className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" /> Watch preview
      </button>
      <dialog
        ref={dialogRef}
        aria-label={`${title} preview`}
        onClose={() => setOpen(false)}
        className="m-auto w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-[16px] bg-black p-0 backdrop:bg-black/75"
      >
        <button type="button" onClick={() => setOpen(false)} aria-label="Close preview" className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        {/* Mount the player only while open so closing stops playback. */}
        {open && (
          <div className="aspect-video w-full">
            <iframe src={embedUrl} title={title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          </div>
        )}
      </dialog>
    </>
  );
}
