import { CalendarCheck, CircleCheck, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";

const POINTS: { icon: LucideIcon; title: string; description: string; badgeBg: string; badgeColor: string }[] = [
  { icon: ShieldCheck, title: "Reviewed providers", description: "Every kids provider is reviewed by RUXs before they can take bookings.", badgeBg: "bg-emerald-100", badgeColor: "text-emerald-800" },
  { icon: CircleCheck, title: "Confirmed by the teacher", description: "You request a time; the teacher confirms it and you see the status.", badgeBg: "bg-sky-100", badgeColor: "text-sky-800" },
  { icon: Wallet, title: "Pay at the session", description: "No advance payment. Pay the provider when the class happens.", badgeBg: "bg-amber-100", badgeColor: "text-amber-800" },
  { icon: CalendarCheck, title: "Cancel before it starts", description: "Plans change. Cancel a request or session any time before it begins.", badgeBg: "bg-pink-100", badgeColor: "text-pink-800" },
];

/** What RUXs actually does for families, in four true lines. */
export function KidsSafetyGuarantee() {
  return (
    <section aria-labelledby="kids-trust-title" className="rounded-[22px] border border-kids-mint/60 bg-gradient-to-b from-kids-mint/30 to-kids-cream/40 p-5 shadow-xs">
      <h2 id="kids-trust-title" className="flex items-center gap-2 font-kids text-xl font-semibold tracking-tight text-kids-ink">
        <span>🛡️</span>
        <span>How RUXs looks after your little ones</span>
      </h2>
      <ul className="mt-4 grid gap-3.5">
        {POINTS.map(({ icon: Icon, title, description, badgeBg, badgeColor }) => (
          <li key={title} className="flex gap-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${badgeBg} ${badgeColor} shadow-xs`}>
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div>
              <span className="block font-kids text-sm font-semibold text-kids-ink">{title}</span>
              <span className="mt-0.5 block text-xs sm:text-sm leading-snug text-kids-ink/75">{description}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
