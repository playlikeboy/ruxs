import Link from "next/link";
import { buildMetadata, breadcrumbsJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "Terms of service for RUXs software. Clear commercial terms, zero commission, and software responsibilities.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="space-y-10 pt-8 sm:pt-16 max-w-3xl mx-auto px-4 sm:px-6 text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbsJsonLd([
              { name: "Home", path: "/" },
              { name: "Terms of Service", path: "/terms" },
            ]),
          ]),
        }}
      />

      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs text-muted">
          Last updated: October 2026
        </p>
      </div>

      <div className="prose prose-sm max-w-none space-y-6 text-xs text-muted leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-ink">1. Software Role & Disclaimers</h2>
          <p>
            RUXs provides software tools for neighborhood tiffin kitchens and water suppliers to manage daily schedules, delivery run sheets, and customer khatas. RUXs is not a food caterer, restaurant, or water filtration provider. All meal preparation, water purification, delivery execution, and hygiene standards remain the sole responsibility of the independent vendor.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-ink">2. Khata & Ledger Accounting</h2>
          <p>
            All financial calculations within RUXs are executed using immutable, append-only integer paise. Entries once committed cannot be edited or deleted; corrections are handled exclusively via new reversing adjustment entries. Monthly bills are calculated directly from ledger transactions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-ink">3. Payments & Zero Commission</h2>
          <p>
            RUXs charges zero payment commission. Transactions occur peer-to-peer via universal UPI deep links directly into the vendor&apos;s verified UPI ID. Any transaction disputes, bank failures, or refunds must be settled directly between the household and the vendor.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-ink">4. Acceptable Use & Account Suspension</h2>
          <p>
            Vendors must maintain valid local registrations and deliver legitimate services. Any abuse, harassment, fraudulent claims, or unauthorized spamming will result in immediate suspension of vendor access by the platform admin.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-ink">5. Contact</h2>
          <p>
            For questions about these terms or software billing, contact us at adminruxs@gmail.com or WhatsApp 9610201507 (Contact Only on WhatsApp).
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-line text-xs text-muted">
        <Link href="/" className="text-accent font-semibold hover:underline">
          ← Return to RUXs Home
        </Link>
      </div>
    </div>
  );
}
