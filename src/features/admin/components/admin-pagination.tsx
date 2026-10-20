"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function AdminPagination({
  page,
  totalPages,
  totalItems,
  limit = 20,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  limit?: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1 && totalItems <= limit) return null;

  const createPageUrl = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  };

  const start = Math.min(totalItems, (page - 1) * limit + 1);
  const end = Math.min(totalItems, page * limit);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const startPage = Math.max(2, page - 1);
      const endPage = Math.min(totalPages - 1, page + 1);
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
      <div>
        Showing <span className="font-semibold text-ink">{start}</span> to{" "}
        <span className="font-semibold text-ink">{end}</span> of{" "}
        <span className="font-semibold text-ink">{totalItems}</span> results
      </div>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={createPageUrl(page - 1)}
            className="flex h-8 items-center gap-1 rounded-[8px] border border-line bg-surface px-2.5 font-medium text-ink transition hover:bg-bg"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Prev</span>
          </Link>
        ) : (
          <span className="flex h-8 items-center gap-1 rounded-[8px] border border-line/60 bg-surface/50 px-2.5 font-medium text-muted/60 cursor-not-allowed">
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Prev</span>
          </span>
        )}

        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-1.5 text-muted">
                …
              </span>
            ) : (
              <Link
                key={`page-${p}`}
                href={createPageUrl(p)}
                aria-current={p === page ? "page" : undefined}
                className={
                  "flex h-8 min-w-8 items-center justify-center rounded-[8px] border px-2 font-semibold transition " +
                  (p === page
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-surface text-ink hover:bg-bg")
                }
              >
                {p}
              </Link>
            )
          )}
        </div>

        {page < totalPages ? (
          <Link
            href={createPageUrl(page + 1)}
            className="flex h-8 items-center gap-1 rounded-[8px] border border-line bg-surface px-2.5 font-medium text-ink transition hover:bg-bg"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        ) : (
          <span className="flex h-8 items-center gap-1 rounded-[8px] border border-line/60 bg-surface/50 px-2.5 font-medium text-muted/60 cursor-not-allowed">
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
      </nav>
    </div>
  );
}
