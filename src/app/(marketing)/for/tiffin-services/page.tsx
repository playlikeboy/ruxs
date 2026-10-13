import Link from "next/link";
import { buildMetadata, breadcrumbsJsonLd } from "@/lib/seo";
import { TiffinDabbaIllustration } from "@/components/marketing/illustrations";

export const metadata = buildMetadata({
  title: "Tiffin Service Software — Stop WhatsApp Skip Chaos",
  description:
    "The software neighbourhood tiffin kitchens use to lock morning meal counts, generate lift-optimized run sheets, and collect monthly bills via direct UPI.",
  path: "/for/tiffin-services",
});

export default function ForTiffinServicesPage() {
  return (
    <div className="space-y-16 pt-8 sm:pt-16 max-w-4xl mx-auto px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbsJsonLd([
              { name: "Home", path: "/" },
              { name: "Tiffin Services", path: "/for/tiffin-services" },
            ]),
          ]),
        }}
      />

      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFE8DD] text-accent rounded-full text-xs font-semibold">
          🍱 Dedicated for Dabba & Tiffin Kitchens
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink max-w-2xl mx-auto leading-tight">
          Cook the exact count. Never chase a dabba payment again.
        </h1>
        <p className="text-base text-muted max-w-xl mx-auto">
          Replace morning chat floods with one private link per customer. Your cook sees the exact meal count at 10:00 AM cutoff.
        </p>
        <div className="pt-2">
          <Link
            href="/app"
            className="inline-block px-6 py-3 bg-accent text-white font-semibold text-sm rounded-[10px] hover:opacity-90 shadow-sm"
          >
            Start Free for Your Kitchen →
          </Link>
        </div>
      </div>

      <div className="p-6 bg-surface border border-line rounded-[16px] shadow-xs flex flex-col md:flex-row items-center gap-8">
        <TiffinDabbaIllustration className="w-28 h-28 shrink-0" />
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-ink">Built for the Indian Tiffin Daily Loop</h2>
          <p className="text-xs text-muted leading-relaxed">
            Every tiffin kitchen has the same problem: customers message &quot;Skip lunch today&quot; at 9:55 AM while subji is already simmering on the stove. With RUXS, you set an exact cutoff (e.g. 10:00 AM). Skips before cutoff are free; skips after cutoff follow your rule (full charge, half charge, or locked).
          </p>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-surface border border-line rounded-[12px] space-y-2 shadow-xs">
          <span className="text-xs font-bold text-accent">01. Big Kitchen Display</span>
          <h3 className="text-sm font-semibold text-ink">Read Across the Room</h3>
          <p className="text-xs text-muted leading-relaxed">
            At cutoff, today&apos;s orders lock into one big 48px tabular number. Your cooks don&apos;t need to scroll chats or add up notebook scribbles.
          </p>
        </div>

        <div className="p-5 bg-surface border border-line rounded-[12px] space-y-2 shadow-xs">
          <span className="text-xs font-bold text-accent">02. Top Floor Down</span>
          <h3 className="text-sm font-semibold text-ink">Lift-Optimized Route</h3>
          <p className="text-xs text-muted leading-relaxed">
            Your delivery boy takes the elevator straight to the top floor and delivers flat-by-flat descending downwards. Saves 25 minutes per tower.
          </p>
        </div>

        <div className="p-5 bg-surface border border-line rounded-[12px] space-y-2 shadow-xs">
          <span className="text-xs font-bold text-accent">03. 1st of the Month Bills</span>
          <h3 className="text-sm font-semibold text-ink">Direct Universal UPI</h3>
          <p className="text-xs text-muted leading-relaxed">
            Bills are computed from the immutable ledger. Opening balance + deliveries - payments = total due. Customers tap and pay directly to your Google Pay or PhonePe.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-6">
        <Link
          href="/app"
          className="px-6 py-3 bg-accent text-white font-semibold text-sm rounded-[10px] hover:opacity-90 transition-all shadow-xs"
        >
          Setup Your Tiffin Service in 2 Minutes →
        </Link>
      </div>
    </div>
  );
}
