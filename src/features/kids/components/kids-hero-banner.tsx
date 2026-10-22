import Link from "next/link";

/** The Kids mode welcome card: candy gradient, a friendly mascot and floating stickers. */
export function KidsHeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FFE1EF] via-[#EDE3FF] to-[#D9F4FF] p-5 shadow-[0_6px_0_rgba(155,92,246,0.14),0_18px_30px_-16px_rgba(59,31,92,0.4)] ring-2 ring-white">
      <span className="absolute -right-1 top-3 animate-float text-3xl" aria-hidden="true">🚀</span>
      <span className="absolute right-16 top-16 animate-float text-xl [animation-delay:600ms]" aria-hidden="true">⭐</span>
      <span className="absolute bottom-3 right-24 animate-float text-2xl [animation-delay:1200ms]" aria-hidden="true">🎨</span>
      <span className="absolute -bottom-3 right-3 animate-wiggle text-[64px] leading-none" aria-hidden="true">🧸</span>

      <div className="relative z-10 max-w-[78%]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-kids-grape shadow-sm">
          🎈 Kids Zone · ages 3–16
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
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-kids-grape px-4 text-[13px] font-bold text-white shadow-[0_4px_0_#7C3AED] transition active:translate-y-1 active:shadow-none"
          >
            Book a trial ✨
          </Link>
          <Link
            href="/app/kids/kits"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-bold text-kids-ink shadow-[0_4px_0_rgba(155,92,246,0.25)] transition active:translate-y-1 active:shadow-none"
          >
            DIY kits 🧩
          </Link>
        </div>
      </div>
    </div>
  );
}
