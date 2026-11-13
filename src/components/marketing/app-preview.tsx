import { Check, ShoppingBag } from "lucide-react";
import { CoverArt } from "@/components/ui/cover-art";
import { cn } from "@/components/ui/cn";
import { RuxsMark } from "@/components/marketing/ruxs-mark";

const essentials = [
  { theme: "tiffin", label: "Tiffin" },
  { theme: "water", label: "Water" },
  { theme: "milk", label: "Milk" },
  { theme: "store", label: "Stores" },
];

/** A drawn card that drifts beside the phone. Rotation sits on the outer element so the float keeps it. */
function FloatingCard({ theme, label, className, delay }: { theme: string; label: string; className: string; delay?: string }) {
  return (
    <div className={cn("absolute z-20", className)}>
      <div
        style={delay ? { animationDelay: delay } : undefined}
        className="w-[72px] overflow-hidden rounded-[14px] bg-surface shadow-[0_14px_28px_-16px_rgba(32,36,31,0.55)] motion-safe:animate-float sm:w-[112px]"
      >
        <CoverArt theme={theme} className="aspect-[4/3] w-full" />
        <p className="px-1.5 py-1.5 text-center text-[10px] font-semibold leading-tight text-ink sm:text-xs">{label}</p>
      </div>
    </div>
  );
}

/**
 * The household app, drawn from the same cover art the app uses. It is a picture, not a control:
 * hidden from assistive tech, with one sentence describing it instead. No prices or provider names,
 * so it never implies availability.
 */
export function AppPreview({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-[272px] sm:w-[300px]", className)}>
      <p className="sr-only">
        A preview of the RUXs app: Kids Zone classes and workshops, tiffin, water, milk and local stores, the RUXs Store, and tomorrow&apos;s lunch set to deliver.
      </p>

      <div aria-hidden="true">
        <FloatingCard theme="stem" label="Robotics" className="-left-12 top-14 -rotate-6 sm:-left-24 sm:top-16" />
        <FloatingCard theme="arts" label="Art" className="-right-12 top-[52%] rotate-6 sm:-right-24" delay="-2s" />

        <div className="relative z-10 rounded-[38px] bg-ink p-[7px] shadow-[0_28px_50px_-26px_rgba(32,36,31,0.6)]">
          <div className="overflow-hidden rounded-[31px] bg-app-canvas">
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <span className="flex items-center gap-1.5">
                <RuxsMark className="h-6 w-6" alt="" />
                <span className="text-sm font-extrabold tracking-[-0.03em] text-accent">RUXs</span>
              </span>
              <span className="flex rounded-full bg-surface p-0.5 text-[10px] font-semibold">
                <span className="rounded-full px-2.5 py-1 text-muted">Home</span>
                <span className="rounded-full bg-brand-deep px-2.5 py-1 text-white">Kids</span>
              </span>
            </div>

            <div className="space-y-2.5 px-3 pb-4">
              <div className="overflow-hidden rounded-[18px] bg-surface">
                <CoverArt theme="kids" live className="h-[104px] w-full" />
                <div className="px-3 py-2">
                  <p className="text-[13px] font-bold leading-tight text-ink">Kids Zone</p>
                  <p className="text-[11px] text-muted">Classes, workshops and camps</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {essentials.map((item) => (
                  <div key={item.theme} className="text-center">
                    <CoverArt theme={item.theme} className="aspect-square w-full rounded-[12px]" />
                    <p className="mt-1 text-[10px] font-semibold text-ink">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2.5 rounded-[18px] bg-brand-deep p-2.5">
                <CoverArt theme="kits" className="h-12 w-14 shrink-0 rounded-[10px]" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[13px] font-bold leading-tight text-white">
                    <ShoppingBag className="h-3.5 w-3.5" /> RUXs Store
                  </p>
                  <p className="text-[11px] text-brand-leaf">Shipped by RUXs</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-[18px] bg-surface px-3 py-2.5">
                <div>
                  <p className="text-[12px] font-bold leading-tight text-ink">Tomorrow&apos;s lunch</p>
                  <p className="text-[10px] text-muted">Skip before the cutoff</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold text-bg">
                  <Check className="h-3 w-3" /> Deliver
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
