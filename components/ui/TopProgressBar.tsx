"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress on route change
  useEffect(() => {
    if (active) {
      setProgress(100);
      const timer = setTimeout(() => {
        setActive(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept click on internal links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Find closest anchor
      const target = (e.target as HTMLElement)?.closest?.("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      // Skip external, blank, hash, or modifier clicks
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        targetAttr === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if internal URL
      const isInternal =
        href.startsWith("/") ||
        (href.startsWith(window.location.origin) && !href.startsWith(window.location.origin + "/api"));

      if (isInternal && href !== window.location.pathname + window.location.search) {
        setActive(true);
        setProgress(25);

        const t1 = setTimeout(() => setProgress((p) => (p < 60 ? 60 : p)), 120);
        const t2 = setTimeout(() => setProgress((p) => (p < 85 ? 85 : p)), 350);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  if (!active && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[2.5px] overflow-hidden"
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "180ms" : "320ms",
          boxShadow: "0 0 10px rgba(159, 197, 143, 0.7), 0 0 4px rgba(74, 222, 128, 0.9)",
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
