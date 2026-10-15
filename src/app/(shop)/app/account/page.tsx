import Link from "next/link";
import { ChevronRight, Store } from "lucide-react";
import { getMyLocation, getMyProfile } from "@/features/consumer/queries";
import { PageHeader } from "@/features/consumer/components/page-header";
import { ProfileForm } from "@/features/consumer/components/profile-form";
import { SignOutButton } from "@/features/consumer/components/sign-out-button";

export const metadata = { title: "Account" };

function num(v: string | undefined): number | null {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; area?: string; city?: string; lat?: string; lng?: string }>;
}) {
  const sp = await searchParams;
  const { user, profile } = await getMyProfile();
  const location = await getMyLocation();
  const gps = location.source === "gps" ? location : null;
  const next = sp.next?.startsWith("/app") ? sp.next : undefined;

  const defaults = {
    name: profile?.name ?? user.displayName ?? "",
    phone: profile?.phone.replace(/^\+91/, "") ?? "",
    society: profile?.society ?? "",
    tower: profile?.tower ?? "",
    floor: profile?.floor ?? "",
    flat: profile?.flat ?? "",
    landmark: profile?.landmark ?? "",
    area: profile?.area ?? sp.area?.slice(0, 80) ?? "",
    city: profile?.city ?? sp.city?.slice(0, 60) ?? "",
    latitude: profile?.latitude ?? num(sp.lat) ?? gps?.latitude ?? null,
    longitude: profile?.longitude ?? num(sp.lng) ?? gps?.longitude ?? null,
  };

  return (
    <div className="pb-10">
      <PageHeader title="Account" back={next} />
      <div className="px-4 pt-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-2xl font-bold text-white">
            {(defaults.name || user.primaryEmail || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold text-ink">{defaults.name || "Welcome"}</p>
            <p className="truncate text-sm text-neutral-500">{user.primaryEmail}</p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-ink">{profile ? "Delivery address" : "Where should we deliver?"}</h2>
          {!profile && <p className="mt-1 text-sm text-neutral-500">Add your address once to order and subscribe.</p>}
          <div className="mt-4">
            <ProfileForm defaults={defaults} next={next} />
          </div>
        </section>

        <section className="mt-10 divide-y divide-black/5 border-y border-black/5">
          <Link href="/app/orders" className="flex items-center justify-between py-4 text-[15px] text-ink">Order history <ChevronRight className="h-5 w-5 text-neutral-400" /></Link>
          <Link href="/app/plans" className="flex items-center justify-between py-4 text-[15px] text-ink">My plans &amp; bills <ChevronRight className="h-5 w-5 text-neutral-400" /></Link>
          <Link href="/privacy" className="flex items-center justify-between py-4 text-[15px] text-ink">Privacy <ChevronRight className="h-5 w-5 text-neutral-400" /></Link>
        </section>

        <Link href="/merchant-panel/sign-in" className="mt-6 flex items-center gap-3 rounded-2xl border border-black/10 p-4">
          <Store className="h-6 w-6 text-accent" aria-hidden="true" />
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-ink">Run a kitchen or water business?</span>
            <span className="block text-sm text-neutral-500">Go to the merchant panel</span>
          </span>
          <ChevronRight className="h-5 w-5 text-neutral-400" />
        </Link>

        <SignOutButton className="mt-8 h-12 w-full justify-center rounded-xl border border-black/10 text-ink" />
      </div>
    </div>
  );
}
