import { UiIcon } from "@/components/ui/app-icon";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { getKidsWorkshopById, getMyChildren } from "@/features/kids/queries";
import { hexclave } from "@/lib/auth/hexclave";
import { WorkshopEnrollForm } from "@/features/kids/components/workshop-enroll-form";
import { formatAgeRange, formatClassesList } from "@/core/kids/age-eligibility";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getKidsWorkshopById(id);
  if (!data) return { title: "Workshop Not Found" };

  return {
    title: `${data.workshop.title} · Kids Camps`,
    description:
      data.workshop.description ??
      `Reserve spot for ${data.workshop.title} organized by ${data.vendor.name} on RUXs Kids Zone.`,
  };
}

export default async function KidsWorkshopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getKidsWorkshopById(id);

  if (!data) notFound();

  const user = await hexclave.getUser();
  const children = user ? await getMyChildren() : [];

  const ageText = formatAgeRange(data.workshop.minAge, data.workshop.maxAge);
  const classText = formatClassesList(data.workshop.eligibleClasses as any);

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-12">
      {/* Back link */}
      <div>
        <Link
          href="/app/kids/workshops"
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-kids-grape/15 bg-white px-3 py-1 text-xs font-black text-slate-800 shadow-[0_3px_0_rgba(155,92,246,0.18)] transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Workshops</span>
        </Link>
      </div>

      {/* Workshop Header Card */}
      <div className="rounded-[26px] border-2 border-kids-grape/15 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-[0_5px_0_rgba(155,92,246,0.14),0_12px_24px_-14px_rgba(59,31,92,0.35)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-kids-grape/20 bg-emerald-200 px-2.5 py-0.5 text-[11px] font-black text-emerald-950">
            {data.category.name}
          </span>
          <span className="rounded-full border border-kids-grape/20 bg-pink-100 px-2.5 py-0.5 text-[11px] font-black text-kids-ink">
            <UiIcon name="age" /> {ageText} ({classText})
          </span>
          <span
            className={`rounded-full border border-kids-grape/20 px-2.5 py-0.5 text-[11px] font-black ${
              data.availability.isAlmostFull
                ? "bg-rose-200 text-rose-950 animate-pulse"
                : "bg-amber-200 text-kids-ink"
            }`}
          >
            <UiIcon name="fire" /> {data.availability.remainingSeats} of {data.workshop.capacity} seats left
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-black tracking-tight text-kids-ink">
          {data.workshop.title}
        </h1>

        {data.workshop.description && (
          <p className="mt-2 text-xs font-medium leading-relaxed text-kids-ink/80">
            {data.workshop.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-kids-ink/80 border-t border-slate-200 pt-3">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-amber-600" />
            <span>
              {data.workshop.startDate} to {data.workshop.endDate}
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-kids-ink/60" />
            <span>{data.workshop.venueOrMode}</span>
          </span>
          {data.workshop.address && (
            <span className="text-kids-ink/60">({data.workshop.address})</span>
          )}
        </div>
      </div>

      {/* Multi-session Schedule */}
      <section className="space-y-3">
        <h2 className="px-1 text-base font-black text-kids-ink">
          Camp Schedule ({data.sessions.length} Sessions)
        </h2>

        {data.sessions.length === 0 ? (
          <div className="rounded-[20px] border-2 border-dashed border-slate-300 bg-white p-4 text-xs font-semibold text-kids-ink/60">
            Session dates will be announced before camp kick-off.
          </div>
        ) : (
          <div className="space-y-2">
            {data.sessions.map((sess, idx) => (
              <div
                key={sess.id}
                className="flex items-center justify-between rounded-[20px] border-2 border-kids-grape/15 bg-white p-3.5 shadow-[0_3px_0_rgba(155,92,246,0.18)]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-kids-grape/20 bg-kids-sunny/80 text-xs font-black text-kids-ink">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="block text-xs font-black text-kids-ink">
                      {sess.sessionDate}
                    </span>
                    <span className="block text-[11px] font-semibold text-kids-ink/60">
                      {sess.startTime} – {sess.endTime}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-kids-ink/70">
                  {sess.venueOrMode}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Materials and Policies */}
      <div className="rounded-[20px] border-2 border-kids-grape/15 bg-white p-4 shadow-[0_3px_0_rgba(155,92,246,0.18)]">
        <h3 className="text-xs font-black uppercase tracking-wider text-kids-ink/60">
          Materials & Take-Homes
        </h3>
        <p className="mt-1 text-xs font-semibold text-kids-ink/80">
          {data.workshop.materialsDescription ||
            "All project kits, tools, non-toxic art supplies and completion certificates are provided at the workshop."}
        </p>

        <div className="mt-3 border-t border-slate-100 pt-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Cancellation Policy
          </span>
          <p className="text-[11px] font-medium text-kids-ink/70">
            {data.workshop.cancellationPolicy}
          </p>
        </div>
      </div>

      {/* Provider trust card */}
      <div className="rounded-[20px] border-2 border-kids-grape/15 bg-amber-100/70 p-4 shadow-[0_3px_0_rgba(155,92,246,0.18)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                Verified Workshop Host
              </span>
            </div>
            <Link
              href={`/app/kids/providers/${data.vendor.slug}`}
              className="mt-0.5 block text-sm font-black text-kids-ink hover:underline"
            >
              {data.vendor.name}
            </Link>
          </div>

          <Link
            href={`/app/kids/providers/${data.vendor.slug}`}
            className="rounded-full border-2 border-kids-grape/15 bg-white px-3 py-1 text-[11px] font-black text-kids-ink shadow-[0_2px_0_rgba(155,92,246,0.18)] hover:bg-slate-50"
          >
            Profile →
          </Link>
        </div>
      </div>

      {/* Interactive Enrollment Form */}
      {user ? (
        <WorkshopEnrollForm
          workshopId={data.workshop.id}
          pricePaise={data.workshop.pricePaise}
          capacity={data.workshop.capacity}
          enrolledCount={data.enrolledCount}
          isFull={data.availability.isFull}
          childProfiles={children}
        />
      ) : (
        <div className="rounded-[26px] border-2 border-kids-grape/15 bg-white p-6 text-center shadow-[0_5px_0_rgba(155,92,246,0.14),0_12px_24px_-14px_rgba(59,31,92,0.35)]">
          <UiIcon name="camp" className="h-6 w-6 text-accent" />
          <h2 className="mt-2 text-base font-black text-kids-ink">
            Sign in to Reserve a Seat
          </h2>
          <p className="mt-1 text-xs font-semibold text-kids-ink/70">
            Sign in to your RUXs account to choose your child and enroll into this bootcamp.
          </p>
          <div className="mt-4">
            <Link
              href={`/sign-in?next=/app/kids/workshops/${data.workshop.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-kids-grape/15 bg-emerald-400 px-6 py-2.5 text-xs font-black text-kids-ink shadow-[0_3px_0_rgba(155,92,246,0.18)] transition active:translate-y-0.5"
            >
              Sign In to Continue →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
