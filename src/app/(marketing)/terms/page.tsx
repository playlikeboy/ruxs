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
    <div className="mx-auto max-w-3xl space-y-10 px-4 pb-12 pt-8 text-ink sm:px-6 sm:pt-16">
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
        <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
          Terms of Service
        </h1>
        <p className="text-sm text-muted">
          Last updated: October 2026
        </p>
      </div>

      <div className="max-w-[70ch] space-y-8 text-base leading-relaxed text-ink/80">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">1. Software Role & Disclaimers</h2>
          <p>
            RUXs provides software tools for neighborhood tiffin kitchens and water suppliers to manage daily schedules, delivery run sheets, and customer khatas. RUXs is not a food caterer, restaurant, or water filtration provider. All meal preparation, water purification, delivery execution, and hygiene standards remain the sole responsibility of the independent vendor.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">2. Khata & Ledger Accounting</h2>
          <p>
            All financial calculations within RUXs are executed using immutable, append-only integer paise. Entries once committed cannot be edited or deleted; corrections are handled exclusively via new reversing adjustment entries. Monthly bills are calculated directly from ledger transactions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">3. Payments & Zero Commission</h2>
          <p>
            RUXs charges zero payment commission. Transactions occur peer-to-peer via universal UPI deep links directly into the vendor&apos;s verified UPI ID. Any transaction disputes, bank failures, or refunds must be settled directly between the household and the vendor.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">4. Acceptable Use & Account Suspension</h2>
          <p>
            Vendors must maintain valid local registrations and deliver legitimate services. Any abuse, harassment, fraudulent claims, or unauthorized spamming will result in immediate suspension of vendor access by the platform admin.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">5. Contact</h2>
          <p>
            For questions about these terms or software billing, contact us at adminruxs@gmail.com or WhatsApp 9610201507 (Contact Only on WhatsApp).
          </p>
        </section>
      </div>

      <div className="border-t border-line pt-6 text-sm">
        <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">
          Back to RUXs home
        </Link>
      </div>
    </div>
  );
}
