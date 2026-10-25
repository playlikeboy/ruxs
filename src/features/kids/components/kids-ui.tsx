import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

/** Shared surfaces for the Kids pages, so every screen reads the same. */
export const kidsCard = "rounded-[20px] border border-kids-ink/10 bg-white";
export const kidsPrimaryButton =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-kids-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-kids-ink/90 active:scale-[0.98]";
export const kidsSecondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-kids-ink/15 bg-white px-5 text-sm font-semibold text-kids-ink transition-colors hover:border-kids-ink/40";

export function KidsPageHeader({ title, lead, action }: { title: string; lead?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="font-kids text-[28px] font-semibold leading-tight tracking-tight">{title}</h1>
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
        <h2 className="font-kids text-xl font-semibold tracking-tight">{title}</h2>
        {href && (
          <Link href={href} className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-accent">
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
    <Link href={href} className="-ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-kids-ink/70 hover:text-kids-ink">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {label}
    </Link>
  );
}

export function KidsTag({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "good" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "good" && "bg-kids-mint/70 text-kids-ink",
        tone === "warn" && "bg-kids-peach text-kids-ink",
        tone === "plain" && "bg-kids-ink/[0.06] text-kids-ink/80"
      )}
    >
      {children}
    </span>
  );
}
