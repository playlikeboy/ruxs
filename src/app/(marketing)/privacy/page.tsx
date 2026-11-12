import Link from "next/link";
import { buildMetadata, breadcrumbsJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy & DPDP Act 2023 Notice",
  description:
    "Plain English privacy policy and Digital Personal Data Protection Act (DPDP Act 2023) notice for RUXs vendors and customers.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 pb-12 pt-8 text-ink sm:px-6 sm:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbsJsonLd([
              { name: "Home", path: "/" },
              { name: "Privacy Policy", path: "/privacy" },
            ]),
          ]),
        }}
      />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted">
          Last updated: October 2026 • Compliant with the Digital Personal Data Protection Act (DPDP Act 2023)
        </p>
      </div>

      <div className="max-w-[70ch] space-y-8 text-base leading-relaxed text-ink/80">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">1. Our Promise to You</h2>
          <p>
            RUXs is software built for local tiffin kitchens and 20L water suppliers. We do not sell your data, run third-party advertisement trackers, or share customer telephone numbers with marketing brokers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">2. What Data We Store</h2>
          <p>
            To deliver your daily meals and water cans accurately, we store:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="font-semibold text-ink">Vendor details:</strong> Business name, contact phone, city, locality, and direct UPI VPA.</li>
            <li><strong className="font-semibold text-ink">Household customer details:</strong> Customer name, delivery address (society, tower, floor, flat), and contact telephone number.</li>
            <li><strong className="font-semibold text-ink">Transaction records:</strong> Append-only khata ledger entries (amounts stored as integer paise), delivery confirmations, bottle movements, and monthly invoices.</li>
            <li><strong className="font-semibold text-ink">Authentication:</strong> Authentication is securely processed via Hexclave. RUXs never stores plain-text passwords.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">3. Digital Personal Data Protection (DPDP Act 2023) Notice</h2>
          <p>
            Under India&apos;s DPDP Act 2023, you have the right to know what personal data is processed, request corrections, or withdraw your consent. Customer private links (/c/[token]) are hashed with SHA-256 tokens and accessible only by the household and their designated kitchen vendor.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">4. Payments & Financial Data</h2>
          <p>
            RUXs never processes or touches your money. When you tap &quot;Pay via UPI&quot;, your browser opens your chosen UPI application (Google Pay, PhonePe, Paytm, BHIM) with a universal deep link pointing directly to your vendor&apos;s UPI ID. We do not collect credit card, debit card, or net banking credentials.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">5. Data Retention & Deletion</h2>
          <p>
            If a vendor closes their business or requests data deletion, their vendor records and associated customer delivery profiles will be permanently erased. To request data deletion, contact your vendor directly or email us at adminruxs@gmail.com or WhatsApp 9610201507 (WhatsApp only).
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
