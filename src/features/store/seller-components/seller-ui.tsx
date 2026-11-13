import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

/** Shared page furniture for the seller portal. No hooks, so server and client components can both use it. */

export const PAGE = "space-y-6 p-4 sm:p-6";

export function PageHeader({
  title,
  description,
  back,
  meta,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="inline-flex min-h-9 items-center gap-1 rounded-control text-xs font-semibold text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent print:hidden"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {back.label}
          </Link>
        )}
        <h1 className="break-words text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 max-w-[70ch] text-sm text-muted">{description}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-1.5">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 print:hidden">{actions}</div>}
    </div>
  );
}

/** One bordered surface with a titled header row. Never nest a Panel inside a Panel. */
export function Panel({
  id,
  title,
  note,
  action,
  padded = false,
  className,
  children,
}: {
  id: string;
  title: React.ReactNode;
  note?: React.ReactNode;
  action?: React.ReactNode;
  /** Pad the body. Leave off for lists and tables that run edge to edge. */
  padded?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={cn("min-w-0 rounded-card border border-line bg-surface", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 id={id} className="text-base font-semibold text-ink">
            {title}
          </h2>
          {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
        </div>
        {action}
      </div>
      <div className={padded ? "p-4" : undefined}>{children}</div>
    </section>
  );
}

export const panelLink =
  "rounded-[6px] text-xs font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const rowLink =
  "transition hover:bg-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";

export function EmptyNote({ title, body, action }: { title: string; body: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface px-6 py-10 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-[10px] bg-blush px-3 py-2 text-sm font-medium text-bad">
      {children}
    </p>
  );
}

export function DialogButtons({
  pending,
  onCancel,
  onConfirm,
  confirm,
  busyText,
  danger = false,
  dismiss = "Back",
}: {
  pending: boolean;
  onCancel: () => void;
  /** Omit inside a form: the confirm button then submits it. */
  onConfirm?: () => void;
  confirm: string;
  busyText: string;
  danger?: boolean;
  dismiss?: string;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button type="button" disabled={pending} onClick={onCancel} className={buttonClass("secondary", "md")}>
        {dismiss}
      </button>
      <button
        type={onConfirm ? "button" : "submit"}
        onClick={onConfirm}
        disabled={pending}
        aria-busy={pending}
        className={buttonClass(danger ? "danger" : "primary", "md")}
      >
        {pending ? busyText : confirm}
      </button>
    </div>
  );
}

export const iconButton =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-ink transition hover:border-ink/30 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Search box used by the list pages. Posts back to the same route as a GET form. */
export const searchInput =
  "min-h-11 w-full rounded-control border border-line bg-surface pl-9 pr-3 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

export const selectInput =
  "min-h-11 max-w-[14rem] rounded-control border border-line bg-surface px-3 text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";
