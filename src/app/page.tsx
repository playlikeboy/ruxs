import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm text-muted">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span>Local delivery operating system</span>
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Your kitchen&apos;s day, sorted by 10 AM.
        </h1>

        <p className="text-lg text-muted">
          {siteConfig.description}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/onboarding"
            className="inline-flex h-12 items-center justify-center rounded-[10px] bg-accent px-6 font-medium text-white transition hover:opacity-90 active:scale-[0.98]"
          >
            Start free
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center justify-center rounded-[10px] border border-line bg-surface px-6 font-medium text-ink transition hover:bg-bg active:scale-[0.98]"
          >
            View pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
