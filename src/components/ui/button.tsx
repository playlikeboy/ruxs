import Link from "next/link";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-white shadow-[0_2px_5px_rgba(189,75,42,0.14)] hover:bg-accent/90",
  secondary: "border border-line bg-surface text-ink hover:border-brand-coral/30 hover:bg-brand-peach/40",
  ghost: "text-muted hover:bg-brand-peach/40 hover:text-ink",
  danger: "border border-bad/20 bg-bad/5 text-bad hover:bg-bad/10",
  dark: "bg-ink text-white hover:bg-ink/90",
};
const SIZE: Record<Size, string> = {
  sm: "min-h-10 px-3 text-[13px] rounded-control gap-1.5",
  md: "min-h-11 px-4 text-sm rounded-control gap-2",
  lg: "min-h-12 px-5 text-[15px] rounded-control gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex select-none items-center justify-center font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
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
