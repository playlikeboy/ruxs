"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  href: string;
  ctaLabel: string | null;
  tone: string;
}

const TONE: Record<string, string> = { peach: "bg-peach", mint: "bg-mint", butter: "bg-butter", blush: "bg-blush" };
const AUTO_MS = 5000;

/** Swipeable offer and announcement slides. Auto-advances unless the viewer prefers reduced motion or is touching it. */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => go((active + 1) % slides.length), AUTO_MS);
    return () => window.clearInterval(t);
  }, [active, paused, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section aria-roledescription="carousel" aria-label="Offers and news" className="mt-4" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)}>
      <ul
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setActive(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-[20px] [scrollbar-width:none]"
      >
        {slides.map((s, i) => {
          const external = /^https:\/\//i.test(s.href);
          const body = (
            <>
              <span className="flex min-w-0 flex-1 flex-col justify-center p-4 pr-2">
                <span className="text-[17px] font-bold leading-tight tracking-tight text-ink">{s.title}</span>
                {s.subtitle && <span className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink/70">{s.subtitle}</span>}
                <span className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                  {s.ctaLabel || "Open"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </span>
              {s.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- admin-supplied URLs from any host
                <img src={s.imageUrl} alt="" loading={i === 0 ? "eager" : "lazy"} className="h-auto w-[38%] shrink-0 object-cover" />
              )}
            </>
          );
          const cls = `flex h-[148px] w-full overflow-hidden ${TONE[s.tone] ?? TONE.peach}`;
          return (
            <li key={s.id} className="w-full shrink-0 snap-start" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}>
              {external ? (
                <a href={s.href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
              ) : (
                <Link href={s.href} className={cls}>{body}</Link>
              )}
            </li>
          );
        })}
      </ul>
      {slides.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === active}
              className={"h-1.5 rounded-full transition-all " + (i === active ? "w-5 bg-ink" : "w-1.5 bg-ink/20")}
            />
          ))}
        </div>
      )}
    </section>
  );
}
