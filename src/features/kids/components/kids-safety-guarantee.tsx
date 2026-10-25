import { CalendarCheck, CircleCheck, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";

const POINTS: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: ShieldCheck, title: "Reviewed providers", description: "Every kids provider is reviewed by RUXs before they can take bookings." },
  { icon: CircleCheck, title: "Confirmed by the teacher", description: "You request a time; the teacher confirms it and you see the status." },
  { icon: Wallet, title: "Pay at the session", description: "No advance payment. Pay the provider when the class happens." },
  { icon: CalendarCheck, title: "Cancel before it starts", description: "Plans change. Cancel a request or session any time before it begins." },
];

/** What RUXs actually does for families, in four true lines. */
export function KidsSafetyGuarantee() {
  return (
    <section aria-labelledby="kids-trust-title" className="rounded-[20px] bg-kids-mint/40 p-5">
      <h2 id="kids-trust-title" className="font-kids text-xl font-semibold tracking-tight text-kids-ink">How RUXs looks after families</h2>
      <ul className="mt-4 grid gap-3.5">
        {POINTS.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-kids-ink">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-kids-ink">{title}</span>
              <span className="mt-0.5 block text-sm leading-snug text-kids-ink/70">{description}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
