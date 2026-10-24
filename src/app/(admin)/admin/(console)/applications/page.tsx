import Link from "next/link";
import { cn } from "@/components/ui/cn";
import { getApplications, type ApplicationStatus } from "@/features/applications/queries";
import { ApplicationRow } from "@/features/applications/components/application-row";

export const metadata = { title: "Applications · Admin" };

const TABS: { v: ApplicationStatus | ""; label: string }[] = [
  { v: "new", label: "New" },
  { v: "contacted", label: "Called" },
  { v: "approved", label: "Approved" },
  { v: "rejected", label: "Rejected" },
  { v: "", label: "All" },
];

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = (["new", "contacted", "approved", "rejected"].includes(raw ?? "") ? raw : raw === "all" ? "" : "new") as ApplicationStatus | "";
  const { rows, counts } = await getApplications({ status: status || undefined });

  return (
    <div className="max-w-3xl space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Merchant applications</h1>
        <p className="mt-1 text-sm text-muted">From the public form at /apply. Call to verify, then approve to create the store and its login.</p>
      </div>
      <nav aria-label="Application status" className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = status === t.v;
          const n = t.v ? counts[t.v] ?? 0 : Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
          return (
            <Link key={t.label} href={`/admin/applications?status=${t.v || "all"}`} aria-current={active ? "page" : undefined} className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold", active ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink")}>
              {t.label} <span className="tabular-nums opacity-70">{n}</span>
            </Link>
          );
        })}
      </nav>
      {rows.length === 0 ? (
        <p className="rounded-[16px] border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">Nothing here. New applications from /apply appear in the New tab.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ app, categoryLabel }) => (
            <ApplicationRow
              key={app.id}
              a={{
                id: app.id,
                businessName: app.businessName,
                ownerName: app.ownerName,
                phone: app.phone,
                email: app.email,
                categoryLabel,
                area: app.area,
                city: app.city,
                details: app.details,
                status: app.status,
                adminNotes: app.adminNotes,
                vendorId: app.vendorId,
                createdAt: app.createdAt.toISOString(),
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
