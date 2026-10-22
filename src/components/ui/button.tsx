import Link from "next/link";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent/90 shadow-[0_1px_0_rgba(0,0,0,0.04)]",
  secondary: "border border-line bg-surface text-ink hover:bg-bg",
  ghost: "text-muted hover:bg-bg hover:text-ink",
  danger: "border border-bad/20 bg-bad/5 text-bad hover:bg-bad/10",
  dark: "bg-ink text-white hover:bg-ink/90",
};
const SIZE: Record<Size, string> = {
  sm: "min-h-9 px-3 text-[13px] rounded-control gap-1.5",
  md: "min-h-11 px-4 text-sm rounded-control gap-2",
  lg: "min-h-12 px-5 text-[15px] rounded-[14px] gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex select-none items-center justify-center font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
    VARIANT[variant],
    SIZE[size],
    extra
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button {...props} className={buttonClass(variant, size, className)} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link {...props} className={buttonClass(variant, size, className)} />;
}
