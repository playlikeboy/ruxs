"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { inputClass } from "@/components/ui/field";
import { adminUpdateApplication } from "@/features/applications/actions";

const STATUS_STYLE: Record<string, string> = {
  new: "bg-butter text-warn",
  contacted: "bg-sky text-ink",
  approved: "bg-mint text-good",
  rejected: "bg-bg text-muted",
};

export type ApplicationRowData = {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string | null;
  categoryLabel: string | null;
  area: string;
  city: string;
  details: string | null;
  status: string;
  adminNotes: string | null;
  vendorId: string | null;
  createdAt: string;
};

/** One application: call, note what happened, then approve (creates store + login) or reject. */
export function ApplicationRow({ a }: { a: ApplicationRowData }) {
  const [notes, setNotes] = useState(a.adminNotes ?? "");
  const [pending, startTransition] = useTransition();
  const update = (patch: { status?: "new" | "contacted" | "rejected"; adminNotes?: string }) =>
    startTransition(async () => {
      const res = await adminUpdateApplication({ id: a.id, ...patch });
      if (!res.ok) toast.error(res.error);
      else toast.success("Saved");
    });

  return (
    <li className="space-y-3 rounded-[16px] border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-ink">{a.businessName}</p>
          <p className="text-sm text-muted">
            {a.categoryLabel ?? "Other"} · {a.area}, {a.city} · {a.ownerName} · {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </p>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", STATUS_STYLE[a.status])}>{a.status}</span>
      </div>
      {a.details && <p className="text-sm leading-relaxed text-ink">{a.details}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <a href={`tel:${a.phone}`} className={buttonClass("secondary", "sm", "font-mono")}>
          <Phone className="h-4 w-4" aria-hidden="true" /> {a.phone}
        </a>
        {a.email && <a href={`mailto:${a.email}`} className="break-all rounded-[4px] text-sm text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{a.email}</a>}
      </div>
      <label className="block text-xs font-medium text-muted" htmlFor={`notes-${a.id}`}>Call notes</label>
      <textarea
        id={`notes-${a.id}`}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => notes !== (a.adminNotes ?? "") && update({ adminNotes: notes })}
        rows={2}
        maxLength={1000}
        placeholder="Spoke on… verified address… documents seen…"
        className={cn(inputClass, "min-h-20 py-2.5")}
      />
      <div className="flex flex-wrap gap-2">
        {a.status === "approved" && a.vendorId ? (
          <Link href={`/admin/vendors/${a.vendorId}`} className={buttonClass("dark", "sm")}>Open store & login</Link>
        ) : (
          <>
            <Link href={`/admin/vendors/new?application=${a.id}`} className={buttonClass("primary", "sm")}>Approve & create login</Link>
            {a.status !== "contacted" && <button type="button" disabled={pending} onClick={() => update({ status: "contacted" })} className={buttonClass("secondary", "sm")}>Mark called</button>}
            {a.status !== "rejected" && <button type="button" disabled={pending} onClick={() => window.confirm(`Reject ${a.businessName}'s application?`) && update({ status: "rejected" })} className={"inline-flex min-h-10 select-none items-center justify-center rounded-control px-3 text-[13px] font-semibold text-bad transition hover:bg-bad/5 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"}>Reject</button>}
          </>
        )}
      </div>
    </li>
  );
}
