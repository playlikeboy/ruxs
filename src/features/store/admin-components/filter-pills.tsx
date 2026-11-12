import Link from "next/link";

/** Status/filter pills as links, same look as /admin/orders. Server-rendered. */
export function FilterPills({
  label,
  items,
  current,
}: {
  label: string;
  items: { href: string; text: string; value: string; count?: number }[];
  current: string;
}) {
  return (
    <nav aria-label={label} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
      {items.map((f) => {
        const active = current === f.value;
        return (
          <Link
            key={f.value}
            href={f.href}
            aria-current={active ? "page" : undefined}
            className={
              "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
              (active ? "border-ink bg-ink text-white" : "border-line bg-surface text-muted hover:border-ink/40 hover:text-ink")
            }
          >
            {f.text}
            {f.count != null && (
              <span className={"tabular-nums " + (active ? "text-white/80" : "text-muted")}>{f.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Builds an href keeping the other search params. Drops empty values and resets page. */
export function hrefWith(base: string, params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}
