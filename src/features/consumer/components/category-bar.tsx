import Link from "next/link";
import { SERVICE_KINDS } from "@/config/service-kinds";

/** Airbnb-style category strip: emoji over label, underline on the active one. */
export function CategoryBar({ active }: { active?: string }) {
  return (
    <nav aria-label="Categories" className="-mx-4 flex gap-7 overflow-x-auto border-b border-black/5 px-5 [scrollbar-width:none]">
      {SERVICE_KINDS.map((k) => {
        const isActive = active === k.id;
        return (
          <Link
            key={k.id}
            href={isActive ? "/app" : `/app/category/${k.id}`}
            aria-current={isActive ? "page" : undefined}
            className={
              "flex shrink-0 flex-col items-center gap-1.5 border-b-2 pb-3 pt-1 text-xs font-semibold transition " +
              (isActive ? "border-ink text-ink" : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-ink")
            }
          >
            <span className="text-2xl leading-none" aria-hidden="true">{k.emoji}</span>
            {k.short}
          </Link>
        );
      })}
    </nav>
  );
}
