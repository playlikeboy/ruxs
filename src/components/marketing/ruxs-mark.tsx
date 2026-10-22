import type { SVGProps } from "react";

/**
 * RUXs neighbourhood mark.
 * A little home is the shared centre; the surrounding service dots keep the
 * identity broad enough for family learning, essentials, gifts and specialists.
 */
export function RuxsMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      role="img"
      aria-label="RUXs neighbourhood home logo"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="1" y="1" width="94" height="94" rx="25" fill="#FFF3E9" stroke="#E7E5DF" strokeWidth="2" />
      {/* Small service markers: care, learning, daily essentials and thoughtful gifts. */}
      <circle cx="19" cy="35" r="10" fill="#E1F3E7" />
      <path d="M15 37c0-8 9-11 13-10-1 8-5 12-13 10Z" fill="#2F7D4F" />
      <path d="M17 37l7-7" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="76" cy="29" r="9" fill="#E2EEFA" />
      <path d="M76 22c-2.5 4-4.5 6.2-4.5 8.5a4.5 4.5 0 0 0 9 0c0-2.3-2-4.5-4.5-8.5Z" fill="#478FCB" />
      <circle cx="22" cy="69" r="8" fill="#FCE4EC" />
      <path d="M18 67h8v5h-8zM18 67l4-3 4 3" stroke="#BD4B2A" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="77" cy="68" r="8" fill="#FFF3C9" />
      <path d="M72.5 67.5h9v6h-9zM72.5 67.5l4.5 3 4.5-3M77 70.5v3" stroke="#9A5B00" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      {/* The welcoming neighbourhood home. */}
      <path d="M29 48.5 48 32l19 16.5" stroke="#BD4B2A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 46.5V70c0 2.2 1.8 4 4 4h20c2.2 0 4-1.8 4-4V46.5" fill="#FFFDF9" stroke="#BD4B2A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M44 74V61c0-2.2 1.8-4 4-4s4 1.8 4 4v13" fill="#FFE8DD" stroke="#BD4B2A" strokeWidth="2.5" />
      <circle cx="42" cy="51.5" r="1.9" fill="#1C1B19" />
      <circle cx="54" cy="51.5" r="1.9" fill="#1C1B19" />
      <path d="M44.5 54.5c1.8 2.2 5.2 2.2 7 0" stroke="#1C1B19" strokeWidth="2" strokeLinecap="round" />
      <circle cx="37.5" cy="55" r="2.3" fill="#F4A59A" />
      <circle cx="58.5" cy="55" r="2.3" fill="#F4A59A" />
      <path d="M47.8 66.5c-1.8-2.2-5-4.4-5-1.5 0 2 2.5 3.7 5 5.3 2.5-1.6 5-3.3 5-5.3 0-2.9-3.2-.7-5 1.5Z" fill="#BD4B2A" />
      <path d="M48 14v3M36 18l2 2M60 18l-2 2" stroke="#D9A52D" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="48" cy="13" r="3.5" fill="#FFD979" />
    </svg>
  );
}
