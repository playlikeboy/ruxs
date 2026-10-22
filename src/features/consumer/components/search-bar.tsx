import { Search } from "lucide-react";

/** Plain GET form so search works without client JS. */
export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/app/search" role="search" className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search tiffin, water cans, thali…"
        aria-label="Search stores and items"
        className="h-14 w-full rounded-2xl border border-line bg-white pl-12 pr-4 text-base text-ink placeholder:text-muted transition-colors focus:border-accent focus:outline-2 focus:outline-offset-2 focus:outline-accent"
      />
    </form>
  );
}
