"use client";

import { useState } from "react";
import { ChevronDown, Sparkles, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
  category: "Residents" | "Vendors" | "RWAs";
}

const FAQS: FaqItem[] = [
  {
    category: "Residents",
    question: "How does RUXS work without ringing my doorbell at 06:00 AM?",
    answer:
      "RUXS establishes designated drop zones with your society security and your apartment door (e.g. your milk basket, door hook, or shoe-rack crate). Delivery runners follow a silent checklist and drop items between 05:30 AM and 06:15 AM. You receive a silent WhatsApp notification confirmation without interrupting your morning sleep.",
  },
  {
    category: "Residents",
    question: "What happens if I need to pause or change my order at the last minute?",
    answer:
      "You have until 10:00 PM (22:00 IST) every night to make adjustments. Simply reply 'PAUSE' or '+1 packet' on WhatsApp, or toggle it in the web app. At 10:00 PM, the manifest locks so vendors can procure exact fresh supplies from dairies and markets. No unexpected charges or spoiled items left outside your door.",
  },
  {
    category: "Vendors",
    question: "Can our society bring our trusted existing milkman, ironman, and coconut vendor?",
    answer:
      "Yes! RUXS is not a supermarket aggregator that replaces local vendors with dark stores. We digitize your existing trusted neighborhood vendors, giving them automated WhatsApp orders, aggregated batch manifests, and guaranteed digital payments without paper dairies.",
  },
  {
    category: "RWAs",
    question: "How do RUXS delivery runners pass gated security (MyGate / NoBrokerHood)?",
    answer:
      "RUXS creates verified digital Gate Run Passes for each tower. Instead of 40 separate intercom calls to residents at 06:00 AM, security guards scan one batch roster QR code. The runner ascends to the top floor once and delivers downward in 18 minutes, minimizing elevator crowding.",
  },
  {
    category: "Residents",
    question: "How does the monthly Khata bill and UPI payment work?",
    answer:
      "Every single fulfillment, pause credit, and returned bottle deposit is recorded in your digital ledger with integer paise precision. On the 1st of every month, you receive a single consolidated itemized invoice on WhatsApp with a 1-tap UPI link (Google Pay, PhonePe, Paytm).",
  },
  {
    category: "RWAs",
    question: "Is resident data protected under the Indian DPDP Act 2023?",
    answer:
      "Strictly yes. Delivery staff see only flat numbers and door hook locations; resident phone numbers, emails, and financial history are cryptographically masked. RUXS never sells resident contact details or displays third-party commercial advertisements.",
  },
];

export function ImpeccableFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [filter, setFilter] = useState<"All" | "Residents" | "Vendors" | "RWAs">("All");

  const filteredFaqs = filter === "All" ? FAQS : FAQS.filter((f) => f.category === filter);

  return (
    <section id="faq" className="relative py-24 px-4 sm:px-6 lg:px-8 border-b border-[var(--c-border-subtle)] bg-[var(--c-canvas-subtle)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--c-accent-soft)] border border-[var(--c-accent-border)] text-[var(--c-accent)] text-xs font-semibold mb-4">
            <span className="cc-led cc-led--amber" />
            <span>NO MARKETING SLOP · TRANSPARENT ANSWERS</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[var(--c-text-primary)] tracking-tight">
            Frequently Answered Questions
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--c-text-secondary)]">
            Everything you need to know about society onboarding, cutoff rules, and digital khata.
          </p>

          {/* Filter Pills */}
          <div className="mt-8 inline-flex p-1 rounded-full bg-[var(--c-canvas)] border border-[var(--c-border-subtle)] shadow-xs">
            <div className="ks-instrument-strip">
              {(["All", "Residents", "RWAs", "Vendors"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setFilter(cat);
                    setOpenIndex(null);
                  }}
                  className={`ks-instrument-key ${filter === cat ? "is-active" : ""}`}
                >
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Accordion Stack */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-[var(--c-border-subtle)] bg-[var(--c-canvas)] transition-all overflow-hidden shadow-xs hover:border-[var(--c-accent-border)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-medium text-[var(--c-text-primary)] text-sm sm:text-base"
                >
                  <span className="leading-snug">{faq.question}</span>
                  <div
                    className={`p-1.5 rounded-full bg-[var(--c-canvas-subtle)] border border-[var(--c-border-subtle)] transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180 text-[var(--c-accent)]" : "text-[var(--c-text-muted)]"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-[var(--c-text-secondary)] leading-relaxed border-t border-[var(--c-border-subtle)]/60 bg-[var(--c-surface)]/30">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Society Onboarding Contact Callout */}
        <div className="mt-12 p-6 rounded-2xl bg-[var(--c-canvas)] border border-[var(--c-accent-border)] text-center sm:flex sm:items-center sm:justify-between shadow-xs">
          <div className="text-left mb-4 sm:mb-0">
            <h4 className="font-semibold text-sm text-[var(--c-text-primary)]">
              Want to onboard your residential society or apartment complex?
            </h4>
            <p className="text-xs text-[var(--c-text-secondary)] mt-1">
              Pilot run takes 48 hours. Zero setup fee for RWA management committees.
            </p>
          </div>
          <a
            href="mailto:support@ruxs.in?subject=Society%20Onboarding%20Inquiry"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[var(--c-accent)] text-white text-xs font-semibold hover:bg-[var(--c-accent-hover)] transition-colors shrink-0 shadow-xs"
          >
            Request Society Pilot
          </a>
        </div>
      </div>
    </section>
  );
}
