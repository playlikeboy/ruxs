import Link from "next/link";
import { Sparkles } from "lucide-react";

export function KidsHeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-slate-900 bg-gradient-to-br from-amber-100 via-sky-100 to-pink-100 p-5 shadow-[4px_4px_0_0_#0f172a]">
      {/* Playful floating sticker icons */}
      <span className="absolute -right-2 -top-2 text-3xl rotate-12 select-none" aria-hidden="true">🚀</span>
      <span className="absolute right-12 bottom-2 text-2xl -rotate-12 select-none opacity-80" aria-hidden="true">🎨</span>
      <span className="absolute left-2 -bottom-2 text-2xl rotate-6 select-none opacity-70" aria-hidden="true">🧩</span>

      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-900/20 bg-white/90 px-3 py-1 text-[11px] font-black text-amber-950 shadow-sm">
          <Sparkles className="h-3 w-3 text-amber-600" />
          <span>RUXS KIDS ZONE</span>
          <span className="text-neutral-400">·</span>
          <span>AGES 3–16</span>
        </div>

        <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-slate-950">
          Where Young Minds Build, Create & Play! 🎈
        </h2>

        <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-700">
          Robotics, Chess, Clay Art, Karate & DIY Science Kits by top-rated neighbourhood mentors in safe, small batches.
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href="/app/kids/activities"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 shadow-[2px_2px_0_0_#0f172a] transition active:translate-y-0.5 active:shadow-none"
          >
            <span>Book a Trial</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/app/kids/kits"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black text-slate-900 shadow-[2px_2px_0_0_#0f172a] transition active:translate-y-0.5 active:shadow-none"
          >
            <span>DIY Kits</span>
            <span aria-hidden="true">🧩</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
