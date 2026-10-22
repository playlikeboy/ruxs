import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireVendorModule } from "@/lib/auth/session";
import { VENDOR_TYPE_INFO } from "@/core/vendor-types";
import { vendorNav } from "@/components/nav/vendor-nav-items";
import { MODULE_ICON } from "@/components/nav/vendor-icons";
import { PageHeader } from "@/components/ui/card";

export default async function MorePage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const access = await requireVendorModule(slug, "more");
  const info = VENDOR_TYPE_INFO[access.vendorType];
  const groups = vendorNav(access.vendorType, access.role);
  const publicHref = access.vendorType === "kids" ? "/app/kids/providers/" + slug : "/app/store/" + slug;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader eyebrow={`${info.emoji} ${info.label}`} title="All tools" description={`Everything for running ${access.vendor.name}.`} />
      {groups.map((g) => (
        <section key={g.title} aria-labelledby={`more-${g.title}`}>
          <h2 id={`more-${g.title}`} className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            {g.title}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {g.items.map((item) => {
              const Icon = MODULE_ICON[item.module];
              return (
                <Link
                  key={item.module}
                  href={`/merchant-panel/${slug}/${item.module}`}
                  className="group flex items-center gap-3 rounded-card border border-line bg-surface p-3.5 transition-colors hover:border-accent/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-bg text-accent" aria-hidden="true">
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink group-hover:text-accent">{item.label}</span>
                    <span className="block truncate text-sm text-muted">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      <Link href={publicHref} className="flex items-center gap-2 text-sm font-semibold text-accent">
        <ExternalLink className="h-4 w-4" aria-hidden="true" /> See your page as households see it
      </Link>
    </div>
  );
}
