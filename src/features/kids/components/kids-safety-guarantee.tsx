import { ShieldCheck, HeartHandshake, Users, Sparkles } from "lucide-react";

export function KidsSafetyGuarantee() {
  const TRUST_POINTS = [
    {
      icon: ShieldCheck,
      title: "Verified Mentors",
      description: "Police and credential verified educators only.",
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      emoji: "🛡️",
    },
    {
      icon: Users,
      title: "Small Batches",
      description: "Max 4 to 6 kids so every child gets personal care.",
      bg: "bg-sky-50",
      border: "border-sky-300",
      emoji: "👥",
    },
    {
      icon: Sparkles,
      title: "Mess-Free & Safe",
      description: "Non-toxic, kid-tested materials and safety gear.",
      bg: "bg-amber-50",
      border: "border-amber-300",
      emoji: "🧼",
    },
    {
      icon: HeartHandshake,
      title: "Free Reschedule",
      description: "Shift class slots or swap dates with zero hassle.",
      bg: "bg-pink-50",
      border: "border-pink-300",
      emoji: "🔄",
    },
  ];

  return (
    <div className="rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-[3px_3px_0_0_#0f172a]">
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">🌟</span>
        <h3 className="text-base font-black tracking-tight text-slate-950">
          Why Parents Trust Ruxs Kids
        </h3>
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500">
        Safe, supervised, high-engagement activities designed to build real-world confidence.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {TRUST_POINTS.map((pt, idx) => (
          <div
            key={idx}
            className={`flex flex-col justify-between rounded-2xl border-2 ${pt.border} ${pt.bg} p-3`}
          >
            <span className="text-2xl mb-1" aria-hidden="true">{pt.emoji}</span>
            <div>
              <span className="block text-xs font-black text-slate-900">{pt.title}</span>
              <span className="mt-0.5 block text-[11px] font-medium leading-snug text-slate-600">
                {pt.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
