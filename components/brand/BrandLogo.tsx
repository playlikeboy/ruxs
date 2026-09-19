import Image from "next/image";

type BrandLogoProps = {
  variant?: "dark" | "light";
  compact?: boolean;
  priority?: boolean;
  className?: string;
};

export function BrandLogo({
  variant = "dark",
  compact = false,
  priority = false,
  className = "",
}: BrandLogoProps) {
  const src = compact
    ? "/brand/logo-mark.svg"
    : variant === "light"
      ? "/brand/logo-horizontal-light.svg"
      : "/brand/logo-horizontal.svg";

  return (
    <Image
      src={src}
      alt="RUXS"
      width={compact ? 36 : 132}
      height={compact ? 36 : 33}
      priority={priority}
      className={className}
    />
  );
}
