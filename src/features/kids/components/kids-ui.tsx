import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

/** Shared surfaces for the Kids pages, so every screen reads the same. */
export const kidsCard = "rounded-[20px] border border-kids-ink/10 bg-white shadow-xs";
export const kidsPrimaryButton =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-kids-ink px-5 text-sm font-bold text-white transition-all hover:bg-kids-ink/90 active:scale-[0.97] shadow-xs";
export const kidsSecondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-kids-ink/15 bg-white px-5 text-sm font-semibold text-kids-ink transition-all hover:border-kids-ink/40 active:scale-[0.97]";

export function KidsPageHeader({ title, lead, action }: { title: string; lead?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="font-kids text-[28px] font-semibold leading-tight tracking-tight text-kids-ink">{title}</h1>
        {lead && <p className="mt-1 text-[15px] leading-snug text-kids-ink/65">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

export function KidsSection({ title, href, linkLabel = "See all", children }: { title: string; href?: string; linkLabel?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-kids text-xl font-semibold tracking-tight text-kids-ink">{title}</h2>
        {href && (
          <Link href={href} className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-accent transition-transform hover:translate-x-0.5">
            {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function KidsBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="-ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-kids-ink/70 hover:text-kids-ink transition-colors">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {label}
    </Link>
  );
}

export function KidsTag({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "good" | "warn" | "peach" | "sky" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "good" && "bg-kids-mint/70 text-good",
        tone === "warn" && "bg-kids-peach text-kids-ink",
        tone === "peach" && "bg-kids-peach/60 text-kids-ink",
        tone === "sky" && "bg-kids-sky/50 text-kids-ink",
        tone === "plain" && "bg-kids-ink/[0.05] text-kids-ink/80"
      )}
    >
      {children}
    </span>
  );
}
