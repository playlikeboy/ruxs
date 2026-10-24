import type { SVGProps } from "react";

/**
 * RUXs neighbourhood mark.
 * Friendly neighbourhood home with food, water, learning and gift symbols.
 */
export function RuxsMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      role="img"
      aria-label="RUXs neighbourhood mark"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <image href="/brand/ruxs-app-icon-512.png" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}


