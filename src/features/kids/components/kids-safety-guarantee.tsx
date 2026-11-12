import { CalendarCheck, CircleCheck, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";

const POINTS: { icon: LucideIcon; title: string; description: string; badgeBg: string; badgeColor: string }[] = [
  { icon: ShieldCheck, title: "Reviewed providers", description: "Every kids provider is reviewed by RUXs before they can take bookings.", badgeBg: "bg-kids-mint", badgeColor: "text-good" },
  { icon: CircleCheck, title: "Confirmed by the teacher", description: "You request a time; the teacher confirms it and you see the status.", badgeBg: "bg-kids-sky/70", badgeColor: "text-kids-ink" },
  { icon: Wallet, title: "Pay at the session", description: "No advance payment. Pay the provider when the class happens.", badgeBg: "bg-kids-sunny/70", badgeColor: "text-kids-ink" },
  { icon: CalendarCheck, title: "Cancel before it starts", description: "Plans change. Withdraw a request or cancel a session from Bookings before it begins.", badgeBg: "bg-kids-peach/60", badgeColor: "text-kids-ink" },
];

/** What RUXs actually does for families, in four true lines. */
export function KidsSafetyGuarantee() {
  return (
    <section aria-labelledby="kids-trust-title" className="rounded-[20px] border border-kids-mint/70 bg-kids-mint/25 p-5">
      <h2 id="kids-trust-title" className="flex items-center gap-2 font-kids text-xl font-semibold tracking-tight text-kids-ink">
        <span aria-hidden="true">🛡️</span>
        <span>How RUXs looks after your little ones</span>
      </h2>
      <ul className="mt-4 grid gap-3.5">
        {POINTS.map(({ icon: Icon, title, description, badgeBg, badgeColor }) => (
          <li key={title} className="flex gap-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${badgeBg} ${badgeColor}`}>
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div>
              <span className="block font-kids text-sm font-semibold text-kids-ink">{title}</span>
              <span className="mt-0.5 block text-sm leading-snug text-kids-ink/75">{description}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
