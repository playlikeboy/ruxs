import { Search } from "lucide-react";

/** Plain GET form so search works without client JS. */
export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/app/search" role="search" className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink" aria-hidden="true" />
      <input
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search tiffin, water cans, thali…"
        aria-label="Search stores and items"
        className="h-14 w-full rounded-full border border-black/10 bg-white pl-12 pr-4 text-[15px] text-ink shadow-[0_3px_14px_rgba(0,0,0,0.08)] placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-ink/80"
      />
    </form>
  );
}
