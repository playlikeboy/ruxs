import React from "react";

export function TiffinDabbaIllustration({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      stroke="#1C1B19"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Handle */}
      <path d="M40 18C40 12 60 12 60 18" fill="none" />
      <path d="M36 18H64" />
      <path d="M50 18V26" />

      {/* Top Tier */}
      <rect x="25" y="26" width="50" height="18" rx="6" fill="#FFE8DD" />
      {/* Middle Tier */}
      <rect x="25" y="44" width="50" height="18" rx="6" fill="#FFF3C9" />
      {/* Bottom Tier */}
      <rect x="25" y="62" width="50" height="20" rx="6" fill="#E1F3E7" />

      {/* Side clasps */}
      <line x1="22" y1="32" x2="22" y2="74" />
      <line x1="78" y1="32" x2="78" y2="74" />

      {/* Smiling eyes & smile on middle tier */}
      <circle cx="43" cy="52" r="1.5" fill="#1C1B19" stroke="none" />
      <circle cx="57" cy="52" r="1.5" fill="#1C1B19" stroke="none" />
      <path d="M47 56Q50 59 53 56" fill="none" />
    </svg>
  );
}

export function WaterCanIllustration({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      stroke="#1C1B19"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Neck & Cap */}
      <rect x="42" y="14" width="16" height="8" rx="2" fill="#1C1B19" />
      <path d="M38 22H62L68 32H32L38 22Z" fill="#E2EEFA" />

      {/* Bottle Body */}
      <rect x="28" y="32" width="44" height="52" rx="10" fill="#E2EEFA" />

      {/* Ridges */}
      <line x1="32" y1="46" x2="68" y2="46" stroke="#1C1B19" strokeDasharray="2 2" />
      <line x1="32" y1="62" x2="68" y2="62" stroke="#1C1B19" strokeDasharray="2 2" />

      {/* Little friendly face */}
      <circle cx="44" cy="54" r="1.5" fill="#1C1B19" stroke="none" />
      <circle cx="56" cy="54" r="1.5" fill="#1C1B19" stroke="none" />
      <path d="M47 58Q50 61 53 58" fill="none" />
    </svg>
  );
}

export function ScooterIllustration({ className = "w-28 h-20" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 80"
      fill="none"
      stroke="#1C1B19"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Wheels */}
      <circle cx="28" cy="56" r="12" fill="#FAFAF7" />
      <circle cx="28" cy="56" r="5" fill="#1C1B19" />
      <circle cx="92" cy="56" r="12" fill="#FAFAF7" />
      <circle cx="92" cy="56" r="5" fill="#1C1B19" />

      {/* Scooter Frame */}
      <path d="M28 56H52L62 38H84" />
      <path d="M92 56L84 28H76" />
      <path d="M84 28L88 20H80" />

      {/* Delivery Box at back */}
      <rect x="24" y="24" width="26" height="24" rx="4" fill="#FFE8DD" />
      <line x1="37" y1="24" x2="37" y2="48" />

      {/* Little speed lines */}
      <line x1="8" y1="48" x2="16" y2="48" stroke="#6B6862" />
      <line x1="12" y1="54" x2="18" y2="54" stroke="#6B6862" />
    </svg>
  );
}

export function KhataCheckIllustration({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      stroke="#1C1B19"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Notebook */}
      <rect x="24" y="16" width="52" height="68" rx="8" fill="#FFF3C9" />
      <line x1="34" y1="16" x2="34" y2="84" stroke="#BD4B2A" />

      {/* Lines */}
      <line x1="42" y1="30" x2="66" y2="30" stroke="#6B6862" />
      <line x1="42" y1="42" x2="66" y2="42" stroke="#6B6862" />
      <line x1="42" y1="54" x2="60" y2="54" stroke="#6B6862" />

      {/* Green Check Badge */}
      <circle cx="68" cy="68" r="14" fill="#E1F3E7" stroke="#2F7D4F" />
      <path d="M63 68L67 72L74 64" stroke="#2F7D4F" strokeWidth="2.5" />
    </svg>
  );
}
