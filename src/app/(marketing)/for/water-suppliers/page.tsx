import Link from "next/link";
import { buildMetadata, breadcrumbsJsonLd } from "@/lib/seo";
import { WaterCanIllustration } from "@/components/marketing/illustrations";

export const metadata = buildMetadata({
  title: "20L Water Delivery Software — Track Empty Cans & Deposits",
  description:
    "The simple app 20L water can suppliers use to track bottle deposits, count empty cans collected at the door, and collect monthly payments via direct UPI.",
  path: "/for/water-suppliers",
});

export default function ForWaterSuppliersPage() {
  return (
    <div className="space-y-16 pt-8 sm:pt-16 max-w-4xl mx-auto px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbsJsonLd([
              { name: "Home", path: "/" },
              { name: "Water Suppliers", path: "/for/water-suppliers" },
            ]),
          ]),
        }}
      />

      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E2EEFA] text-ink rounded-full text-xs font-semibold">
          💧 Dedicated for 20L Water Can Suppliers
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink max-w-2xl mx-auto leading-tight">
          Never lose another 20L empty can.
        </h1>
        <p className="text-base text-muted max-w-xl mx-auto">
          Driver run sheet records bottles given out and empty cans collected at the door with one tap. Bottle deposits tracked automatically.
        </p>
        <div className="pt-2">
          <Link
            href="/app"
            className="inline-block px-6 py-3 bg-accent text-white font-semibold text-sm rounded-[10px] hover:opacity-90 shadow-sm"
          >
            Start Free for Water Delivery →
          </Link>
        </div>
      </div>

      <div className="p-6 bg-surface border border-line rounded-[16px] shadow-xs flex flex-col md:flex-row items-center gap-8">
        <WaterCanIllustration className="w-28 h-28 shrink-0" />
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-ink">Built for Empty Can Accounting</h2>
          <p className="text-xs text-muted leading-relaxed">
            Empty 20L cans cost ₹150+ each to replace. When drivers drop off cans and forget to tally empty returns in their diary, you lose tens of thousands every year. RUXS gives your driver a clean 1-out, 1-in stepper right at the customer&apos;s door.
          </p>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-surface border border-line rounded-[12px] space-y-2 shadow-xs">
          <span className="text-xs font-bold text-accent">01. At-the-Door Stepper</span>
          <h3 className="text-sm font-semibold text-ink">Defaults to 1 Out, 1 In</h3>
          <p className="text-xs text-muted leading-relaxed">
            One tap marks delivered. If the customer returned 2 empty cans or kept an extra, your driver adjusts the stepper in two seconds.
          </p>
        </div>

        <div className="p-5 bg-surface border border-line rounded-[12px] space-y-2 shadow-xs">
          <span className="text-xs font-bold text-accent">02. Deposit Khata</span>
          <h3 className="text-sm font-semibold text-ink">First-Time Bottle Deposit</h3>
          <p className="text-xs text-muted leading-relaxed">
            New customers get container deposit entries added to their khata ledger automatically with unique idempotency keys.
          </p>
        </div>

        <div className="p-5 bg-surface border border-line rounded-[12px] space-y-2 shadow-xs">
          <span className="text-xs font-bold text-accent">03. Universal UPI</span>
          <h3 className="text-sm font-semibold text-ink">Zero Gateway Fee</h3>
          <p className="text-xs text-muted leading-relaxed">
            Bills link straight to your UPI ID (Google Pay, PhonePe, BHIM). Households tap and pay. You mark paid in one tap.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-6">
        <Link
          href="/app"
          className="px-6 py-3 bg-accent text-white font-semibold text-sm rounded-[10px] hover:opacity-90 transition-all shadow-xs"
        >
          Register Your Water Business Now →
        </Link>
      </div>
    </div>
  );
}
