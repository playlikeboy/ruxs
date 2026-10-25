"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import { getYouTubeEmbedUrl } from "@/core/media";

/** "Watch preview" link that opens the provider's YouTube clip in a dialog. */
export function KidsVideoButton({ url, title }: { url?: string | null; title: string }) {
  const [open, setOpen] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(url ?? undefined);
  if (!embedUrl) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-kids-ink underline-offset-4 hover:underline">
        <Play className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" /> Watch preview
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label={`${title} preview`}>
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-black">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close preview" className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="aspect-video w-full">
              <iframe src={embedUrl} title={title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
