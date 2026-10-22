import { cn } from "./cn";

type Tone = "neutral" | "accent" | "good" | "warn" | "bad" | "info";

const TONE: Record<Tone, string> = {
  neutral: "bg-bg text-muted border-line",
  accent: "bg-peach text-accent border-accent/10",
  good: "bg-mint text-good border-good/10",
  warn: "bg-butter text-warn border-warn/10",
  bad: "bg-bad/5 text-bad border-bad/10",
  info: "bg-sky text-[#1E5A8A] border-[#1E5A8A]/10",
};

export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      {...props}
      className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4", TONE[tone], className)}
    />
  );
}
