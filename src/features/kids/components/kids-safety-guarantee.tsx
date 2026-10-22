import { AnimateShieldCheckIcon } from "@/components/ui/animate-icons";

export function KidsSafetyGuarantee() {
  const TRUST_POINTS = [
    {
      title: "Verified Mentors",
      description: "Police and credential verified educators only.",
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      emoji: "🛡️",
    },
    {
      title: "Guardian-Present Sessions",
      description: "Mandatory adult guardian supervision for home classes.",
      bg: "bg-sky-50",
      border: "border-sky-300",
      emoji: "🏡",
    },
    {
      title: "Mess-Free & Safe",
      description: "Non-toxic, child-safe tested materials and safety gear.",
      bg: "bg-amber-50",
      border: "border-amber-300",
      emoji: "🧼",
    },
    {
      title: "Free Reschedule",
      description: "Shift class slots or swap dates with zero hassle.",
      bg: "bg-pink-50",
      border: "border-pink-300",
      emoji: "🔄",
    },
  ];

  return (
    <div className="rounded-[26px] border-2 border-kids-grape/15 bg-white p-5 shadow-[0_5px_0_rgba(155,92,246,0.14),0_12px_24px_-14px_rgba(59,31,92,0.35)]">
      <div className="flex items-center gap-2">
        <AnimateShieldCheckIcon size={22} />
        <h3 className="text-base font-black tracking-tight text-kids-ink">
          Why Parents Trust Ruxs Kids
        </h3>
      </div>
      <p className="mt-1 text-xs font-semibold text-kids-ink/60">
        Safe, supervised, high-engagement activities designed to build real-world confidence.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {TRUST_POINTS.map((pt, idx) => (
          <div
            key={idx}
            className={`flex flex-col justify-between rounded-[20px] border-2 ${pt.border} ${pt.bg} p-3`}
          >
            <span className="text-2xl mb-1" aria-hidden="true">{pt.emoji}</span>
            <div>
              <span className="block text-xs font-black text-kids-ink">{pt.title}</span>
              <span className="mt-0.5 block text-[11px] font-medium leading-snug text-kids-ink/70">
                {pt.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
