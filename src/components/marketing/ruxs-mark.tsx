/* eslint-disable @next/next/no-img-element */
import type { ImgHTMLAttributes } from "react";

/**
 * Official RUXs brand icon using /brand/ruxs-app-icon.svg.
 */
export function RuxsMark({ className, alt = "RUXs", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/brand/ruxs-app-icon.svg"
      alt={alt}
      width={40}
      height={40}
      className={className}
      {...props}
    />
  );
}
