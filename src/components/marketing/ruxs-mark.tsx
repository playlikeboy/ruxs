import type { SVGProps } from "react";

const INK = "#3A2A22";

/**
 * RUXs neighbourhood mark, drawn as vector: a smiling home ringed by learning,
 * fresh food, water and gifts. Raster copies in /public/brand remain only for
 * PWA icons and social previews, which need PNG.
 */
export function RuxsMark(props: SVGProps<SVGSVGElement>) {
  const line = { stroke: INK, strokeWidth: 9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 512 512" fill="none" role="img" aria-label="RUXs" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="512" height="512" rx="112" fill="#FFF7EC" />
      <path d="M96 300a160 160 0 0 1 320 0" stroke="#E95135" strokeWidth="8" strokeDasharray="22 18" strokeLinecap="round" />

      {/* Book */}
      <circle cx="170" cy="150" r="46" fill="#FFF4D8" />
      <path d="M140 140c12-6 22-6 30 2v34c-8-8-18-8-30-2Zm60 0c-12-6-22-6-30 2v34c8-8 18-8 30-2Z" fill="#FFFFFF" {...line} strokeWidth={7} />
      {/* Leaf */}
      <circle cx="342" cy="150" r="46" fill="#DFF0D8" />
      <path d="M342 186v-36m0 10c-22 0-30-14-30-30 22 0 30 14 30 30Zm0-6c18 0 28-12 28-28-20 0-28 12-28 28Z" fill="#4E9A4B" {...line} strokeWidth={7} />
      {/* Water drop */}
      <circle cx="96" cy="262" r="42" fill="#E3F1FB" />
      <path d="M96 232c-14 18-20 28-20 38a20 20 0 0 0 40 0c0-10-6-20-20-38Z" fill="#5AAFE0" {...line} strokeWidth={7} />
      {/* Gift */}
      <circle cx="416" cy="262" r="42" fill="#FCE5E8" />
      <rect x="394" y="258" width="44" height="30" rx="4" fill="#F59AA0" {...line} strokeWidth={7} />
      <path d="M390 246h52v12h-52Zm26 0v42m0-42c-4-12-18-14-18-6s14 6 18 6Zm0 0c4-12 18-14 18-6s-14 6-18 6Z" fill="#F59AA0" {...line} strokeWidth={7} />

      {/* Home */}
      <path d="M150 400c20-24 50-28 70-14 24-18 52-18 72 0 20-14 50-10 70 14Z" fill="#7FBF6A" />
      <rect x="182" y="262" width="148" height="132" rx="20" fill="#FFFFFF" {...line} />
      <path d="M150 284l106-92 106 92" fill="none" stroke="#E95135" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M150 284l106-92 106 92" fill="none" {...line} strokeWidth={6} />
      <rect x="306" y="200" width="22" height="42" rx="4" fill="#E95135" {...line} strokeWidth={6} />
      <circle cx="226" cy="312" r="7" fill={INK} />
      <circle cx="286" cy="312" r="7" fill={INK} />
      <circle cx="212" cy="330" r="9" fill="#F6B8AC" />
      <circle cx="300" cy="330" r="9" fill="#F6B8AC" />
      <path d="M240 330c8 10 24 10 32 0" {...line} strokeWidth={7} />
      <path d="M236 394v-34a20 20 0 0 1 40 0v34" fill="#E95135" {...line} strokeWidth={7} />
    </svg>
  );
}
