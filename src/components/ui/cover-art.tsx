import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Drawn artwork for stores, items and kids classes. Replaces photos everywhere a
 * household browses, so every card shares one illustrated look.
 *
 * Wrap the art in an element with the `group` class and the motif lifts on hover
 * or tap (see `.cover-art-main` in globals.css). `live` adds a slow float for heroes.
 */

const INK = "#174737";
const DEEP = "#07583F";
const CORAL = "#E95135";
const CREAM = "#FFF7EA";
const WHITE = "#FFFFFF";

type Motif = { bg: string; blob: string; draw: () => ReactNode };

const sparkle = (x: number, y: number, r: number, fill: string) => (
  <path
    className="cover-art-spark"
    d={`M${x} ${y - r}L${x + r * 0.3} ${y - r * 0.3}L${x + r} ${y}L${x + r * 0.3} ${y + r * 0.3}L${x} ${y + r}L${x - r * 0.3} ${y + r * 0.3}L${x - r} ${y}L${x - r * 0.3} ${y - r * 0.3}Z`}
    fill={fill}
  />
);

const dot = (x: number, y: number, r: number, fill: string) => <circle className="cover-art-spark" cx={x} cy={y} r={r} fill={fill} />;

const stroke = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

const MOTIFS: Record<string, Motif> = {
  tiffin: {
    bg: "#FFF4D8",
    blob: "#FFE09B",
    draw: () => (
      <>
        <path d="M66 34c0-8 28-8 28 0" fill="none" {...stroke} />
        <rect x="56" y="38" width="48" height="16" rx="5" fill={CORAL} {...stroke} />
        <rect x="56" y="54" width="48" height="16" rx="5" fill="#FFD3BE" {...stroke} />
        <rect x="56" y="70" width="48" height="16" rx="5" fill={CORAL} {...stroke} />
        <path d="M50 62h6M104 62h6" {...stroke} />
      </>
    ),
  },
  water: {
    bg: "#E8F4FB",
    blob: "#CBE8F7",
    draw: () => (
      <>
        <rect x="70" y="28" width="20" height="10" rx="3" fill={WHITE} {...stroke} />
        <path d="M60 46c0-6 6-9 20-9s20 3 20 9v34c0 6-6 9-20 9s-20-3-20-9Z" fill="#9FD3EE" {...stroke} />
        <path d="M60 58h40" {...stroke} />
        <path d="M80 64c-5 6-7 9-7 12a7 7 0 0 0 14 0c0-3-2-6-7-12Z" fill={WHITE} {...stroke} strokeWidth={2} />
      </>
    ),
  },
  milk: {
    bg: "#E9F4E7",
    blob: "#CFE9D2",
    draw: () => (
      <>
        <rect x="64" y="26" width="18" height="8" rx="2" fill={CORAL} {...stroke} />
        <path d="M66 34h14v8l6 10v34a4 4 0 0 1-4 4H64a4 4 0 0 1-4-4V52l6-10Z" fill={WHITE} {...stroke} />
        <path d="M60 64h26" {...stroke} />
        <path d="M94 60h16l-2 28a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3Z" fill={WHITE} {...stroke} />
        <path d="M95 70h14" {...stroke} />
      </>
    ),
  },
  store: {
    bg: "#FFF0E8",
    blob: "#FFD3BE",
    draw: () => (
      <>
        <rect x="52" y="52" width="56" height="38" rx="3" fill={WHITE} {...stroke} />
        <path d="M48 52l6-18h52l6 18Z" fill={CORAL} {...stroke} />
        <path d="M62 34l-4 18M80 34v18M98 34l4 18" {...stroke} />
        <rect x="72" y="66" width="16" height="24" rx="2" fill="#FFE09B" {...stroke} />
        <rect x="58" y="60" width="9" height="9" rx="2" fill="#CBE8F7" {...stroke} strokeWidth={2} />
        <rect x="93" y="60" width="9" height="9" rx="2" fill="#CBE8F7" {...stroke} strokeWidth={2} />
      </>
    ),
  },
  gifts: {
    bg: "#FCE8EF",
    blob: "#F6B8AC",
    draw: () => (
      <>
        <rect x="56" y="52" width="48" height="36" rx="4" fill={CORAL} {...stroke} />
        <rect x="52" y="42" width="56" height="12" rx="3" fill="#FFD3BE" {...stroke} />
        <path d="M80 42v46" stroke={INK} strokeWidth={2.5} />
        <path d="M80 42c-4-10-18-12-18-4s14 4 18 4Zm0 0c4-10 18-12 18-4s-14 4-18 4Z" fill="#FFE09B" {...stroke} />
      </>
    ),
  },
  fitness: {
    bg: "#E9F4E7",
    blob: "#CFE9D2",
    draw: () => (
      <>
        <path d="M60 60h40" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <rect x="46" y="44" width="10" height="32" rx="3" fill={DEEP} {...stroke} />
        <rect x="56" y="50" width="7" height="20" rx="2" fill={CORAL} {...stroke} />
        <rect x="104" y="44" width="10" height="32" rx="3" fill={DEEP} {...stroke} />
        <rect x="97" y="50" width="7" height="20" rx="2" fill={CORAL} {...stroke} />
      </>
    ),
  },
  physio: {
    bg: "#FFF0E8",
    blob: "#FFD3BE",
    draw: () => (
      <>
        <path d="M80 90S52 74 52 54c0-10 7-16 15-16 6 0 10 3 13 8 3-5 7-8 13-8 8 0 15 6 15 16 0 20-28 36-28 36Z" fill={CORAL} {...stroke} />
        <path d="M58 62h10l5-9 7 18 5-9h17" fill="none" stroke={WHITE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  mehndi: {
    bg: "#FFF4D8",
    blob: "#FFE09B",
    draw: () => (
      <>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <ellipse key={a} cx="80" cy="44" rx="7" ry="14" transform={`rotate(${a} 80 60)`} fill={a % 90 === 0 ? CORAL : "#FFD3BE"} {...stroke} strokeWidth={2} />
        ))}
        <circle cx="80" cy="60" r="9" fill="#FFE09B" {...stroke} />
        <circle cx="80" cy="60" r="3" fill={INK} />
      </>
    ),
  },
  stem: {
    bg: "#E8F4FB",
    blob: "#CBE8F7",
    draw: () => (
      <>
        <ellipse cx="80" cy="62" rx="40" ry="14" fill="none" stroke={DEEP} strokeWidth={2} strokeDasharray="4 5" transform="rotate(-18 80 62)" />
        <path d="M80 28c10 8 14 20 14 34v14H66V62c0-14 4-26 14-34Z" fill={WHITE} {...stroke} />
        <circle cx="80" cy="54" r="6" fill="#9FD3EE" {...stroke} strokeWidth={2} />
        <path d="M66 66l-8 12h8M94 66l8 12h-8" fill={CORAL} {...stroke} />
        <path d="M74 76l6 12 6-12" fill="#FFE09B" {...stroke} />
      </>
    ),
  },
  arts: {
    bg: "#FCE8EF",
    blob: "#F6B8AC",
    draw: () => (
      <>
        <path d="M80 34c-22 0-34 14-34 28 0 12 10 22 22 22 6 0 6-6 4-10s0-8 6-8h8c12 0 22-6 22-16 0-10-12-16-28-16Z" fill={WHITE} {...stroke} />
        <circle cx="64" cy="58" r="5" fill={CORAL} />
        <circle cx="76" cy="46" r="5" fill="#FFE09B" />
        <circle cx="92" cy="46" r="5" fill="#9FD3EE" />
        <circle cx="102" cy="58" r="5" fill={DEEP} />
        <path d="M100 92l18-30" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <path d="M118 62l4-6" stroke={CORAL} strokeWidth={6} strokeLinecap="round" />
      </>
    ),
  },
  logic: {
    bg: "#E9F4E7",
    blob: "#CFE9D2",
    draw: () => (
      <>
        <g opacity="0.55">
          {[0, 1, 2, 3].map((r) =>
            [0, 1, 2, 3].map((c) => ((r + c) % 2 === 0 ? <rect key={`${r}${c}`} x={52 + c * 14} y={64 + r * 7} width="14" height="7" fill={DEEP} /> : null))
          )}
        </g>
        <circle cx="80" cy="36" r="8" fill={WHITE} {...stroke} />
        <path d="M72 46h16l-3 6 5 22H70l5-22Z" fill={WHITE} {...stroke} />
        <rect x="64" y="74" width="32" height="8" rx="3" fill={CORAL} {...stroke} />
      </>
    ),
  },
  sports: {
    bg: "#E9F4E7",
    blob: "#CFE9D2",
    draw: () => (
      <>
        <path d="M66 28l14 24 14-24" fill="none" stroke={CORAL} strokeWidth={8} strokeLinejoin="round" />
        <path d="M66 28l14 24 14-24" fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <circle cx="80" cy="68" r="20" fill="#FFE09B" {...stroke} />
        <circle cx="80" cy="68" r="12" fill="none" stroke={INK} strokeWidth={2} />
        <path d="M80 61l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5Z" fill={CORAL} />
      </>
    ),
  },
  music: {
    bg: "#FFF0E8",
    blob: "#FFD3BE",
    draw: () => (
      <>
        <path d="M70 80V40l34-8v40" fill="none" {...stroke} strokeWidth={3} />
        <path d="M70 46l34-8" stroke={INK} strokeWidth={6} />
        <ellipse cx="63" cy="80" rx="9" ry="7" fill={CORAL} {...stroke} />
        <ellipse cx="97" cy="72" rx="9" ry="7" fill={CORAL} {...stroke} />
        <path d="M40 96c10-8 20 8 30 0s20 8 30 0 20 8 30 0" fill="none" stroke={DEEP} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
  },
  kits: {
    bg: "#FFF4D8",
    blob: "#FFE09B",
    draw: () => (
      <>
        <path d="M50 54l30-12 30 12-30 12Z" fill="#FFD3BE" {...stroke} />
        <path d="M50 54v28l30 12V66Z" fill={CORAL} {...stroke} />
        <path d="M110 54v28L80 94V66Z" fill="#F08A6E" {...stroke} />
        <path d="M74 30h6a4 4 0 1 1 8 0h6v6a4 4 0 1 1 0 8v6H74Z" fill="#9FD3EE" {...stroke} strokeWidth={2} />
      </>
    ),
  },
  camp: {
    bg: "#E9F4E7",
    blob: "#CFE9D2",
    draw: () => (
      <>
        <circle cx="112" cy="34" r="9" fill="#FFE09B" {...stroke} strokeWidth={2} />
        <path d="M46 88l34-52 34 52Z" fill={CORAL} {...stroke} />
        <path d="M80 36l-12 52h24Z" fill="#FFD3BE" {...stroke} />
        <path d="M38 88h84" {...stroke} />
      </>
    ),
  },
  kids: {
    bg: "#E8F4FB",
    blob: "#CBE8F7",
    draw: () => (
      <>
        <circle cx="58" cy="40" r="11" fill="#FFE09B" {...stroke} />
        <path d="M90 30l20 16-12 22-18-14Z" fill={CORAL} {...stroke} />
        <path d="M90 30l8 38M80 54l30-8" stroke={INK} strokeWidth={1.5} />
        <path d="M98 68c-4 8 4 12 0 20" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        <path d="M44 84c0-8 8-12 14-10 2-8 16-10 20-2 8-2 14 4 12 12Z" fill={WHITE} {...stroke} />
      </>
    ),
  },
};

const ALIASES: [RegExp, string][] = [
  [/tiffin|meal|thali|food|kitchen/i, "tiffin"],
  [/water|can\b/i, "water"],
  [/milk|dairy|paneer|curd/i, "milk"],
  [/gift|hamper|flower/i, "gifts"],
  [/physio|health|clinic|therapy/i, "physio"],
  [/fit|gym|yoga|trainer/i, "fitness"],
  [/mehndi|henna|beauty|salon/i, "mehndi"],
  [/stem|robot|cod|science|electronic|space/i, "stem"],
  [/music|dance|perform|sing|guitar|keyboard|drama/i, "music"],
  [/art|craft|clay|paint|pottery|origami|draw/i, "arts"],
  [/chess|logic|brain|math|academ|tutor|school|project/i, "logic"],
  [/sport|karate|martial|gymnast|skate|swim|life.?skill/i, "sports"],
  [/kit|product|box|toy/i, "kits"],
  [/camp|workshop|holiday/i, "camp"],
  [/kid|child|all/i, "kids"],
];

export function coverTheme(name: string | null | undefined): string {
  if (!name) return "store";
  if (MOTIFS[name]) return name;
  return ALIASES.find(([re]) => re.test(name))?.[1] ?? "store";
}

export function CoverArt({
  theme,
  label,
  className,
  live = false,
}: {
  theme: string | null | undefined;
  label?: string;
  className?: string;
  live?: boolean;
}) {
  const m = MOTIFS[coverTheme(theme)] ?? MOTIFS.store!;
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };
  return (
    <svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" className={cn("block", className)} {...a11y}>
      <rect width="160" height="120" fill={m.bg} />
      <circle cx="80" cy="62" r="44" fill={m.blob} />
      <circle cx="132" cy="102" r="26" fill={CREAM} opacity="0.7" />
      {sparkle(30, 30, 6, CORAL)}
      {dot(134, 24, 3, DEEP)}
      {dot(26, 92, 2.5, DEEP)}
      <g className={live ? "cover-art-main cover-art-live" : "cover-art-main"}>{m.draw()}</g>
    </svg>
  );
}
