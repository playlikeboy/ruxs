"use client";

import { useState } from "react";
import { CoverArt } from "@/components/ui/cover-art";
import { cn } from "@/components/ui/cn";

/** Main photo plus a thumbnail strip. Falls back to the drawn kits artwork. */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <CoverArt theme="kits" className="aspect-square w-full rounded-[20px]" />;
  }

  const current = images[Math.min(active, images.length - 1)];
  return (
    <div className="space-y-2">
      <div className="aspect-square overflow-hidden rounded-[20px] border border-kids-ink/10 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded image host */}
        <img
          src={current}
          alt={images.length > 1 ? `${name}, photo ${active + 1} of ${images.length}` : name}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Product photos">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-pressed={i === active}
                className={cn(
                  "block h-16 w-16 overflow-hidden rounded-[12px] border-2 bg-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink",
                  i === active ? "border-kids-ink" : "border-transparent hover:border-kids-ink/30"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded image host */}
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
