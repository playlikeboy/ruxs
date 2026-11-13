import Link from "next/link";
import { ChevronRight, Store } from "lucide-react";
import { getMyLocation, getMyProfile } from "@/features/consumer/queries";
import { PageHeader } from "@/features/consumer/components/page-header";
import { ProfileForm } from "@/features/consumer/components/profile-form";
import { SignOutButton } from "@/features/consumer/components/sign-out-button";
import { NotificationSettings } from "@/features/notifications/components/notification-settings";
import { getMyNotificationPreferences } from "@/features/notifications/actions";
import { InstallAppPrompt } from "@/components/pwa/install-app-prompt";
import { TapFeedbackSwitch } from "@/components/ui/tap-feedback";

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
  const [{ user, profile }, location, notificationPrefs] = await Promise.all([
    getMyProfile(),
    getMyLocation(),
    getMyNotificationPreferences(),
  ]);
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
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ink text-2xl font-bold text-white" aria-hidden="true">
            {(defaults.name || user.primaryEmail || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold text-ink">{defaults.name || "Welcome"}</p>
            <p className="truncate text-sm text-muted">{user.primaryEmail}</p>
          </div>
        </div>

        <InstallAppPrompt variant="card" className="mt-5" />
        <div className="mt-5 rounded-[16px] border border-line bg-surface px-4">
          <TapFeedbackSwitch />
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-ink">{profile ? "Delivery address" : "Where should we deliver?"}</h2>
          {!profile && <p className="mt-1 text-sm text-muted">Add your address once to order and subscribe.</p>}
          <div className="mt-4">
            <ProfileForm defaults={defaults} next={next} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-ink">Notifications</h2>
          <p className="mt-1 text-sm text-muted">Manage email and device notifications for your home.</p>
          <div className="mt-4">
            <NotificationSettings initial={notificationPrefs} userEmail={user.primaryEmail} />
          </div>
        </section>

        <section className="mt-10 divide-y divide-black/5 border-y border-black/5">
          <Link href="/app/orders" className="flex min-h-12 items-center justify-between gap-3 py-4 text-[15px] text-ink transition-colors hover:text-accent">Order history <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" /></Link>
          <Link href="/app/plans" className="flex min-h-12 items-center justify-between gap-3 py-4 text-[15px] text-ink transition-colors hover:text-accent">My plans &amp; bills <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" /></Link>
          <Link href="/app/tickets" className="flex min-h-12 items-center justify-between gap-3 py-4 text-[15px] text-ink transition-colors hover:text-accent">
            <span className="min-w-0">
              <span className="block font-medium">Help and support</span>
              <span className="block text-xs text-muted">Raise a ticket, dispute an order, or check resolutions</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          </Link>
          <Link href="/privacy" className="flex min-h-12 items-center justify-between gap-3 py-4 text-[15px] text-ink transition-colors hover:text-accent">Privacy <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" /></Link>
        </section>

        <Link href="/merchant-panel/sign-in" className="mt-6 flex items-center gap-3 rounded-2xl border border-black/10 p-4 transition-colors hover:border-ink/25">
          <Store className="h-6 w-6 text-accent" aria-hidden="true" />
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-ink">Run a local business or teach kids?</span>
            <span className="block text-sm text-muted">Kitchens, stores, trainers and kids class providers: go to the merchant panel</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
        </Link>

        <SignOutButton className="mt-8 h-12 w-full justify-center rounded-xl border border-black/10 text-ink" />
      </div>
    </div>
  );
}
