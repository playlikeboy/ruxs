import Link from "next/link";
import { buildMetadata, breadcrumbsJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy & DPDP Act 2023 Notice",
  description:
    "Plain English privacy policy and Digital Personal Data Protection Act (DPDP Act 2023) notice for RUXS vendors and customers.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="space-y-10 pt-8 sm:pt-16 max-w-3xl mx-auto px-4 sm:px-6 text-ink">
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
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-muted">
          Last updated: October 2026 • Compliant with the Digital Personal Data Protection Act (DPDP Act 2023)
        </p>
      </div>

      <div className="prose prose-sm max-w-none space-y-6 text-xs text-muted leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-ink">1. Our Promise to You</h2>
          <p>
            RUXS is software built for local tiffin kitchens and 20L water suppliers. We do not sell your data, run third-party advertisement trackers, or share customer telephone numbers with marketing brokers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-ink">2. What Data We Store</h2>
          <p>
            To deliver your daily meals and water cans accurately, we store:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Vendor details:</strong> Business name, contact phone, city, locality, and direct UPI VPA.</li>
            <li><strong>Household customer details:</strong> Customer name, delivery address (society, tower, floor, flat), and contact telephone number.</li>
            <li><strong>Transaction records:</strong> Append-only khata ledger entries (amounts stored as integer paise), delivery confirmations, bottle movements, and monthly invoices.</li>
            <li><strong>Authentication:</strong> Authentication is securely processed via Hexclave. RUXS never stores plain-text passwords.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-ink">3. Digital Personal Data Protection (DPDP Act 2023) Notice</h2>
          <p>
            Under India&apos;s DPDP Act 2023, you have the right to know what personal data is processed, request corrections, or withdraw your consent. Customer private links (/c/[token]) are hashed with SHA-256 tokens and accessible only by the household and their designated kitchen vendor.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-ink">4. Payments & Financial Data</h2>
          <p>
            RUXS never processes or touches your money. When you tap &quot;Pay via UPI&quot;, your browser opens your chosen UPI application (Google Pay, PhonePe, Paytm, BHIM) with a universal deep link pointing directly to your vendor&apos;s UPI ID. We do not collect credit card, debit card, or net banking credentials.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-ink">5. Data Retention & Deletion</h2>
          <p>
            If a vendor closes their business or requests data deletion, their vendor records and associated customer delivery profiles will be permanently erased. To request data deletion, contact your vendor directly or email us at support@ruxs.in.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-line text-xs text-muted">
        <Link href="/" className="text-accent font-semibold hover:underline">
          ← Return to RUXS Home
        </Link>
      </div>
    </div>
  );
}
