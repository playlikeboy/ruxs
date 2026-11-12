import Link from "next/link";
import { buildMetadata, breadcrumbsJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "Terms of service for RUXs: the marketplace for local services and kids' activity providers, the merchant tools, and orders from the RUXs Store.",
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
            RUXs is a marketplace and set of software tools for independent local businesses: tiffin kitchens, water suppliers, dairies, local stores, gift sellers, fitness trainers, physiotherapists, mehndi artists and kids&apos; class, workshop and learning-kit providers. Merchants use RUXs to manage their listings, orders, bookings, subscriptions, delivery run sheets and customer khatas. RUXs is not a food caterer, water filtration provider, clinic, trainer or class provider. Each independent vendor remains solely responsible for the service they provide, including meal preparation, water purification, hygiene, delivery, instruction, and the supervision and safety of children in their care.
          </p>
          <p>
            The RUXs Store is the one exception: RUXs itself sells the kids&apos; kits and supplies listed there, sets their prices, and is responsible for fulfilling those orders. It delivers in Ranchi for now.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">2. Khata & Ledger Accounting</h2>
          <p>
            All financial calculations within RUXs are executed using immutable, append-only integer paise. Entries once committed cannot be edited or deleted; corrections are handled exclusively via new reversing adjustment entries. Monthly bills are calculated directly from ledger transactions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">3. Payments & Commission</h2>
          <p>
            RUXs charges no commission on pay-on-delivery or monthly-bill orders, which are paid directly to the vendor. Online payments are processed by Razorpay and may carry a small fee, shown before you pay. Questions about a vendor&apos;s service, refunds or bank failures on vendor orders are settled between the household and the vendor; you can also raise a support ticket in the app. Payments and refunds for RUXs Store orders are handled by RUXs.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">4. Acceptable Use & Account Suspension</h2>
          <p>
            Vendors must maintain valid local registrations and deliver legitimate services. Kids&apos; activity providers must pass RUXs review before they can take bookings. Any abuse, harassment, fraudulent claims, or unauthorized spamming will result in immediate suspension of vendor access by the platform admin.
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
