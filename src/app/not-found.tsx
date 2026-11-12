import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg p-6 text-center text-ink">
      <p className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-peach text-xl font-bold tabular-nums text-accent">
        404
      </p>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink">Page not found</h1>
      <p className="mb-6 max-w-sm text-sm text-muted">This link might have expired, been mistyped, or moved.</p>
      <ButtonLink href="/">Return to home</ButtonLink>
    </main>
  );
}
