import { UiIcon } from "@/components/ui/app-icon";
import Link from "next/link";

/** The Kids mode welcome card: candy gradient, a friendly mascot and floating stickers. */
export function KidsHeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-peach via-brand-butter to-brand-leaf p-5 shadow-[0_18px_32px_-28px_rgba(23,71,55,0.5)] ring-1 ring-white">

      <div className="relative z-10 max-w-[78%]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-kids-grape shadow-sm">
          <UiIcon name="sparkle" /> Kids Zone · ages 3–16
        </span>
        <h2 className="mt-3 text-[26px] font-bold leading-[1.1] tracking-tight text-kids-ink">
          Little hands,
          <br />
          big adventures!
        </h2>
        <p className="mt-2 text-[13px] font-medium leading-5 text-kids-ink/70">Robotics, chess, clay, dance and DIY kits from friendly mentors near you.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/app/kids/activities"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-kids-grape px-4 text-[13px] font-bold text-white shadow-[0_3px_8px_-5px_rgba(23,71,55,0.45)] transition active:scale-[0.98]"
          >
            Book a trial <UiIcon name="sparkle" />
          </Link>
          <Link
            href="/app/kids/kits"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-[13px] font-bold text-kids-ink shadow-[0_3px_8px_-5px_rgba(23,71,55,0.2)] transition active:scale-[0.98]"
          >
            DIY kits <UiIcon name="kit" />
          </Link>
        </div>
      </div>
    </div>
  );
}
