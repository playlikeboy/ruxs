import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ title, back, subtitle }: { title: string; back?: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 flex min-h-14 items-center gap-2 border-b border-black/5 bg-white/95 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      {back ? (
        <Link href={back} aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100">
          <ChevronLeft className="h-6 w-6" />
        </Link>
      ) : (
        <span className="w-2" />
      )}
      <div className="min-w-0 py-2">
        <h1 className="truncate text-[17px] font-semibold text-ink">{title}</h1>
        {subtitle && <p className="truncate text-xs text-neutral-500">{subtitle}</p>}
      </div>
    </header>
  );
}
