/**
 * A drawn neighbourhood street: homes, a kitchen, a dairy and a class studio,
 * with a delivery bicycle. Pure SVG, so the static marketing page ships no photo.
 */
const INK = "#20241F";
const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function House({ x, w, h, wall, roof, door }: { x: number; w: number; h: number; wall: string; roof: string; door: string }) {
  const base = 300;
  const top = base - h;
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} rx="6" fill={wall} {...line} />
      <path d={`M${x - 12} ${top + 6}L${x + w / 2} ${top - 46}L${x + w + 12} ${top + 6}Z`} fill={roof} {...line} />
      <rect x={x + w / 2 - 14} y={base - 50} width="28" height="50" rx="4" fill={door} {...line} />
      <rect x={x + 14} y={top + 22} width="24" height="22" rx="3" fill="#E8F4FB" {...line} />
      <rect x={x + w - 38} y={top + 22} width="24" height="22" rx="3" fill="#E8F4FB" {...line} />
    </g>
  );
}

function Tree({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 4} y="250" width="8" height="50" fill="#8A5A3C" {...line} strokeWidth={2.5} />
      <circle cx={x} cy="236" r="26" fill="#7FBF6A" {...line} />
    </g>
  );
}

export function NeighbourhoodScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 380" role="img" aria-label="A drawn neighbourhood street with homes, shops, trees and a delivery bicycle" className={className}>
      <rect width="1200" height="380" fill="#FFF4D8" />
      <circle cx="1040" cy="86" r="42" fill="#FFE09B" {...line} />
      <path d="M150 90c0-16 18-24 32-16 6-18 36-18 42 2 16-2 24 14 14 24H150Z" fill="#FFFFFF" {...line} />
      <path d="M720 70c0-12 14-18 24-12 5-14 28-14 32 2 12-2 18 10 10 18h-66Z" fill="#FFFFFF" {...line} />
      <path d="M0 300h1200v80H0Z" fill="#E9F4E7" />
      <path d="M0 318h1200" {...line} />
      <path d="M40 346h80M200 346h80M360 346h80M520 346h80M680 346h80M840 346h80M1000 346h80" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />

      <Tree x={60} />
      <House x={110} w={150} h={150} wall="#FFFFFF" roof="#E95135" door="#FFD3BE" />
      {/* Home kitchen with a tiffin sign */}
      <g>
        <rect x="320" y="150" width="190" height="150" rx="6" fill="#FFF0E8" {...line} />
        <path d="M310 150l14-34h162l14 34Z" fill="#E95135" {...line} />
        <path d="M350 116l-6 34M392 116l-2 34M432 116l2 34M472 116l6 34" {...line} />
        <rect x="350" y="200" width="60" height="100" rx="4" fill="#FFE09B" {...line} />
        <rect x="430" y="196" width="56" height="46" rx="4" fill="#E8F4FB" {...line} />
        <rect x="438" y="170" width="16" height="10" rx="2" fill="#E95135" {...line} strokeWidth={2} />
        <rect x="438" y="180" width="16" height="10" rx="2" fill="#FFD3BE" {...line} strokeWidth={2} />
      </g>
      <Tree x={548} />
      {/* Dairy with a milk-bottle sign */}
      <g>
        <rect x="590" y="170" width="160" height="130" rx="6" fill="#FFFFFF" {...line} />
        <path d="M580 170l90-56 90 56Z" fill="#07583F" {...line} />
        <rect x="642" y="230" width="56" height="70" rx="4" fill="#CFE9D2" {...line} />
        <path d="M664 130h12v8l4 6v22h-20v-22l4-6Z" fill="#FFFFFF" {...line} strokeWidth={2.5} />
      </g>
      {/* Class studio with a music note */}
      <g>
        <rect x="790" y="140" width="170" height="160" rx="6" fill="#E8F4FB" {...line} />
        <path d="M778 146l97-62 97 62Z" fill="#F6B8AC" {...line} />
        <rect x="846" y="232" width="58" height="68" rx="4" fill="#FFFFFF" {...line} />
        <path d="M818 220v-40l26-6v34" fill="none" {...line} />
        <circle cx="812" cy="220" r="7" fill="#E95135" {...line} strokeWidth={2} />
        <circle cx="838" cy="208" r="7" fill="#E95135" {...line} strokeWidth={2} />
        <rect x="912" y="176" width="34" height="30" rx="3" fill="#FFFFFF" {...line} />
      </g>
      <House x={1000} w={140} h={130} wall="#FFF0E8" roof="#07583F" door="#FFE09B" />

      {/* Delivery bicycle with a water can */}
      <g>
        <circle cx="470" cy="336" r="22" fill="none" {...line} />
        <circle cx="560" cy="336" r="22" fill="none" {...line} />
        <path d="M470 336l30-40h40l20 40M500 296l20 40h-50M540 296l-6-14h-14" fill="none" {...line} />
        <rect x="446" y="276" width="34" height="22" rx="4" fill="#9FD3EE" {...line} />
        <circle cx="528" cy="258" r="12" fill="#FFD3BE" {...line} />
        <path d="M528 270l-6 28M522 284l18 10" fill="none" {...line} />
      </g>
    </svg>
  );
}
