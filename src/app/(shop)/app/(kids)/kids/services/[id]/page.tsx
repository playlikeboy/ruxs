import { UiIcon } from "@/components/ui/app-icon";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { getKidsServiceById, getMyChildren } from "@/features/kids/queries";
import { hexclave } from "@/lib/auth/hexclave";
import { ServiceBookingForm } from "@/features/kids/components/service-booking-form";
import { formatAgeRange, formatClassesList } from "@/core/kids/age-eligibility";
import { formatINR } from "@/core/money";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getKidsServiceById(id);
  if (!data) return { title: "Activity Not Found" };

  return {
    title: `${data.service.title} · Kids Activities`,
    description:
      data.service.description ??
      `Book ${data.service.title} for kids by ${data.vendor.name} on RUXs Kids Zone.`,
  };
}

export default async function KidsServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getKidsServiceById(id);

  if (!data) notFound();

  const user = await hexclave.getUser();
  const children = user ? await getMyChildren() : [];

  const ageText = formatAgeRange(data.service.minAge, data.service.maxAge);
  const classText = formatClassesList(data.service.suitableClasses as any);

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/app/kids/activities"
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-kids-grape/15 bg-white px-3 py-1 text-xs font-black text-slate-800 shadow-[0_3px_0_rgba(155,92,246,0.18)] transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Classes</span>
        </Link>
      </div>

      {/* Service Header Card */}
      <div className="rounded-[26px] border-2 border-kids-grape/15 bg-white p-5 shadow-[0_5px_0_rgba(155,92,246,0.14),0_12px_24px_-14px_rgba(59,31,92,0.35)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-kids-grape/20 bg-amber-200 px-2.5 py-0.5 text-[11px] font-black text-kids-ink">
            {data.category.name}
          </span>
          <span className="rounded-full border border-kids-grape/20 bg-pink-100 px-2.5 py-0.5 text-[11px] font-black text-kids-ink">
            <UiIcon name="age" /> {ageText} ({classText})
          </span>
          <span className="rounded-full border border-kids-grape/20 bg-sky-100 px-2.5 py-0.5 text-[11px] font-black text-kids-ink">
            <UiIcon name="time" /> {data.service.durationMinutes} mins
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-black tracking-tight text-kids-ink">
          {data.service.title}
        </h1>

        {data.service.description && (
          <p className="mt-2 text-xs font-medium leading-relaxed text-kids-ink/70">
            {data.service.description}
          </p>
        )}

        {/* Pricing badge */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Session Price
            </span>
            <span className="text-xl font-black text-kids-ink">
              {formatINR(data.service.pricePaise)}
            </span>
          </div>

          <div className="text-right">
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Modes
            </span>
            <span className="text-xs font-bold capitalize text-kids-ink/80">
              {data.service.deliveryModes.join(" · ")}
            </span>
          </div>
        </div>
      </div>

      {/* Provider trust card */}
      <div className="rounded-[26px] border-2 border-kids-grape/15 bg-amber-100/70 p-4 shadow-[0_3px_0_rgba(155,92,246,0.18)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                Verified Child Mentor
              </span>
            </div>
            <Link
              href={`/app/kids/providers/${data.vendor.slug}`}
              className="mt-0.5 block text-base font-black text-kids-ink hover:text-kids-bubblegum"
            >
              {data.vendor.name}
            </Link>
            <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-kids-ink/70">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{data.vendor.area}</span>
              </span>
              <span>·</span>
              <span>{data.profile?.headline ?? "Specialist Mentor"}</span>
            </div>
          </div>

          <Link
            href={`/app/kids/providers/${data.vendor.slug}`}
            className="shrink-0 rounded-full border-2 border-kids-grape/15 bg-white px-3 py-1 text-[11px] font-black text-kids-ink shadow-[0_2px_0_rgba(155,92,246,0.18)] hover:bg-slate-50"
          >
            View Profile →
          </Link>
        </div>

        {data.profile?.safetyNotes && (
          <div className="mt-2.5 rounded-2xl border border-slate-300 bg-white/80 p-2.5 text-[11px] font-medium text-kids-ink/80">
            <span className="font-bold text-kids-ink">Safety & Verification: </span>
            {data.profile.safetyNotes}
          </div>
        )}
      </div>

      {/* Booking Form or Sign-in Prompt */}
      {user ? (
        <ServiceBookingForm
          service={{
            id: data.service.id,
            title: data.service.title,
            description: data.service.description,
            minAge: data.service.minAge,
            maxAge: data.service.maxAge,
            suitableClasses: data.service.suitableClasses as string[],
            durationMinutes: data.service.durationMinutes,
            deliveryModes: data.service.deliveryModes,
            pricePaise: data.service.pricePaise,
            materialFeePolicy: data.service.materialFeePolicy,
            materialFeePaise: data.service.materialFeePaise,
            vendor: {
              id: data.vendor.id,
              name: data.vendor.name,
              slug: data.vendor.slug,
              area: data.vendor.area,
            },
            materials: data.materials,
          }}
          childProfiles={children}
        />
      ) : (
        <div className="rounded-[26px] border-2 border-kids-grape/15 bg-white p-6 text-center shadow-[0_5px_0_rgba(155,92,246,0.14),0_12px_24px_-14px_rgba(59,31,92,0.35)]">
          <UiIcon name="lock" className="h-6 w-6 text-accent" />
          <h2 className="mt-2 text-base font-black text-kids-ink">
            Sign in to Book for Your Child
          </h2>
          <p className="mt-1 text-xs font-semibold text-kids-ink/70">
            Create or select your child&apos;s private profile and schedule this class with verified mentors.
          </p>
          <div className="mt-4">
            <Link
              href={`/sign-in?next=/app/kids/services/${data.service.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-kids-grape/15 bg-kids-sunny px-6 py-2.5 text-xs font-black text-kids-ink shadow-[0_3px_0_rgba(155,92,246,0.18)] transition active:translate-y-0.5"
            >
              Sign In to Continue →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
