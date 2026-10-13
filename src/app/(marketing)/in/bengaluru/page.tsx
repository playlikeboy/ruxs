import Link from "next/link";
import { buildMetadata, breadcrumbsJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tiffin & Water Delivery Software in Bengaluru — Koramangala, HSR, Bellandur",
  description:
    "The software Bengaluru tiffin kitchens and 20L water suppliers use across HSR Layout, Koramangala, Bellandur, Whitefield, and Electronic City.",
  path: "/in/bengaluru",
});

const clusters = [
  {
    area: "HSR Layout & BTM",
    description: "High density PG clusters, startup apartments, and residential layouts.",
  },
  {
    area: "Koramangala & Indiranagar",
    description: "Daily office lunch thalis, multi-tower gated apartments, and independent homes.",
  },
  {
    area: "Bellandur & Marathahalli",
    description: "ORR tech corridor, massive gated societies with multi-wing high-rise delivery routes.",
  },
  {
    area: "Whitefield & Electronic City",
    description: "Large 20L water bottle routes, tech park meal deliveries, and PG accommodations.",
  },
];

export default function BengaluruPage() {
  return (
    <div className="space-y-16 pt-8 sm:pt-16 max-w-4xl mx-auto px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbsJsonLd([
              { name: "Home", path: "/" },
              { name: "Bengaluru", path: "/in/bengaluru" },
            ]),
          ]),
        }}
      />

      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFE8DD] text-accent rounded-full text-xs font-semibold">
          📍 Built for Bengaluru Neighbourhoods
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink max-w-2xl mx-auto leading-tight">
          Delivering across Bengaluru without WhatsApp mess.
        </h1>
        <p className="text-base text-muted max-w-xl mx-auto">
          From HSR Sector 1 to Whitefield high-rises. Lift-optimized apartment run sheets and direct UPI payments.
        </p>
        <div className="pt-2">
          <Link
            href="/app"
            className="inline-block px-6 py-3 bg-accent text-white font-semibold text-sm rounded-[10px] hover:opacity-90 shadow-sm"
          >
            Start Free in Bengaluru →
          </Link>
        </div>
      </div>

      {/* Local Clusters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clusters.map((c, idx) => (
          <div
            key={idx}
            className="p-5 bg-surface border border-line rounded-[12px] space-y-1.5 shadow-xs"
          >
            <h3 className="text-sm font-bold text-ink">{c.area}</h3>
            <p className="text-xs text-muted leading-relaxed">{c.description}</p>
          </div>
        ))}
      </div>

      {/* Localized Bengaluru Advantages */}
      <div className="p-6 bg-surface border border-line rounded-[16px] space-y-4 shadow-xs">
        <h2 className="text-lg font-bold text-ink">
          Optimized for Bengaluru Apartment Security Gates & Lifts
        </h2>
        <p className="text-xs text-muted leading-relaxed">
          Bengaluru delivery drivers face tight morning schedules navigating gate security and multi-tower apartment complexes (Prestige, Sobha, Mantri, Salarpuria). RUXS automatically groups stops by Society → Tower → Floor (descending) → Flat. Your delivery boy takes the elevator straight to the top floor and delivers on the way down, shaving 20-30 minutes off every morning delivery run.
        </p>
        <div className="pt-2">
          <Link
            href="/app"
            className="text-xs font-bold text-accent hover:underline"
          >
            Register your Bengaluru kitchen or supply route →
          </Link>
        </div>
      </div>
    </div>
  );
}
