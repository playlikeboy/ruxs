"use client";

import React from "react";
import { ShieldCheck, Star } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  society: string;
  flat: string;
  initial: string;
  role: "Resident" | "RWA President" | "Vendor Partner";
  service: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "No more checking WhatsApp at 6 AM wondering if milk came. Bottle is at the doorstep before 6:15 AM every single day.",
    name: "Priya Nair",
    society: "Sobha Classic",
    flat: "Tower 2, Flat 804",
    initial: "P",
    role: "Resident",
    service: "A2 Farm Milk · Daily",
  },
  {
    quote: "We onboarded RUXS vendors with pre-approved gate passes. Delivery boys don't crowd the security gate, and morning intercom calls dropped 90%.",
    name: "Col. R. Sharma (Retd.)",
    society: "Purva Fairmont",
    flat: "RWA Management",
    initial: "R",
    role: "RWA President",
    service: "Society Gate Security",
  },
  {
    quote: "The Khata ledger solved 10 years of notebook tally arguments with our milkman. When we travel, 1-tap vacation mode pauses everything.",
    name: "Arvind K. Swamy",
    society: "Prestige Lakeside",
    flat: "Tower 4, Flat 1201",
    initial: "A",
    role: "Resident",
    service: "Milk & 20L Water",
  },
  {
    quote: "I deliver 380 milk bottles across 3 societies every morning. The elevator top-down route cut my delivery time from 3 hours to 1.5 hours.",
    name: "Suresh Gowda",
    society: "Gowda Dairy Farm",
    flat: "Verified Vendor",
    initial: "S",
    role: "Vendor Partner",
    service: "380 Daily Deliveries",
  },
  {
    quote: "Splitting 20L water cans and breakfast tiffins between 3 flatmates used to be messy. RUXS splits it to exact paise with 1-tap UPI deep links.",
    name: "Ananya & Divya",
    society: "DLF Cybercity",
    flat: "Tower C, Flat 502",
    initial: "D",
    role: "Resident",
    service: "Tiffin & Water Split",
  },
  {
    quote: "Transparent monthly statements with NPCI UPI links. I pay with Apple Pay / UPI in 5 seconds. Easiest bill of the month.",
    name: "Vikramaditya S.",
    society: "Godrej Woods",
    flat: "Tower 1, Flat 1403",
    initial: "V",
    role: "Resident",
    service: "Daily Breakfast Tiffin",
  },
];

export function ImpeccableTestimonials() {
  return (
    <section className="py-16 sm:py-24 border-b border-[#5A554B]/10 bg-[#FFF8ED]" id="testimonials">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="ks-tag">Community Verified</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#5A554B] tracking-tight">
              Quietly loved across 4,200+ flats.
            </h2>
          </div>
          <p className="text-sm text-[#746E63] max-w-md">
            What apartment residents, housing committee presidents, and local dairy vendors say about their daily routines.
          </p>
        </div>

        {/* Plinth Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className="t-card--plinth flex flex-col justify-between">
              <div>
                {/* Five star indicator */}
                <div className="flex items-center gap-1 text-[#FF804E] mb-3.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-[#FF804E]" />
                  ))}
                  <span className="ml-1 text-[10px] font-mono font-bold text-[#746E63]">
                    5.0
                  </span>
                </div>

                <blockquote className="text-sm text-[#5A554B] font-medium leading-relaxed italic">
                  "{t.quote}"
                </blockquote>
              </div>

              {/* Author Meta Plinth */}
              <div className="mt-6 pt-4 border-t border-[#5A554B]/8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF2DF] border border-[#5A554B]/15 font-bold text-xs text-[#BD4B2A]">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-[#5A554B] leading-tight">
                      {t.name}
                    </p>
                    <p className="text-[11px] text-[#746E63] font-medium">
                      {t.society} · <span className="text-[#9B958B]">{t.flat}</span>
                    </p>
                  </div>
                </div>

                <span className="ks-tag text-[9px]">
                  {t.service}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
