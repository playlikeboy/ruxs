import { ButtonLink } from "@/components/ui/button";

export default function SellerPortalNotFound() {
  return (
    <div className="mx-4 my-8 max-w-sm space-y-4 rounded-card border border-line bg-surface p-6 text-center sm:mx-auto">
      <div>
        <h1 className="text-base font-semibold text-ink">Nothing here</h1>
        <p className="mt-1 text-sm text-muted">That order, product or page doesn&apos;t exist, or it was removed.</p>
      </div>
      <ButtonLink href="/seller-portal" variant="secondary" size="sm">
        Back to the dashboard
      </ButtonLink>
    </div>
  );
}
