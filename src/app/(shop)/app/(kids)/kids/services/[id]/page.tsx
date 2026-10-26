import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, MapPin, UsersRound } from "lucide-react";
import { CoverArt } from "@/components/ui/cover-art";
import { getKidsServiceById, getMyChildren } from "@/features/kids/queries";
import { hexclave } from "@/lib/auth/hexclave";
import { ServiceBookingForm } from "@/features/kids/components/service-booking-form";
import { KidsBackLink, KidsTag, kidsCard, kidsPrimaryButton } from "@/features/kids/components/kids-ui";
import { formatAgeRange, formatClassesList } from "@/core/kids/age-eligibility";
import { formatINR } from "@/core/money";
import { getSlotCalendar } from "@/features/bookings/queries";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getKidsServiceById(id);
  if (!data) return { title: "Class not found" };
  return {
    title: `${data.service.title} · RUXs Kids`,
    description: data.service.description ?? `Book ${data.service.title} by ${data.vendor.name} on RUXs Kids.`,
  };
}

const MODE_LABEL: Record<string, string> = { home: "At your home", studio: "At the studio", online: "Online" };

export default async function KidsServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getKidsServiceById(id);
  if (!data) notFound();

  const user = await hexclave.getUser();
  const [children, calendar] = user
    ? await Promise.all([
        getMyChildren(),
        getSlotCalendar({ vendorId: data.vendor.id, durationMinutes: data.service.durationMinutes, noticeMinutes: data.vendor.bookingNoticeMinutes, days: 14 }),
      ])
    : [[], []];
  const ageText = formatAgeRange(data.service.minAge, data.service.maxAge);
  const classes = (data.service.suitableClasses as string[] | null) ?? [];
  const classText = classes.length > 0 ? formatClassesList(classes) : "";

  return (
    <div className="space-y-3">
      <KidsBackLink href="/app/kids/activities" label="Classes" />

      <section className={`${kidsCard} group overflow-hidden`}>
        <CoverArt theme={`${data.category.id} ${data.category.name}`} label={data.category.name} className="h-36 w-full" />
        <div className="p-5">
          <p className="text-sm font-medium text-kids-ink/60">{data.category.name}</p>
          <h1 className="mt-0.5 font-kids text-[28px] font-semibold leading-tight tracking-tight">{data.service.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <KidsTag><UsersRound className="h-3.5 w-3.5" aria-hidden="true" />{ageText}{classText ? ` · ${classText}` : ""}</KidsTag>
            <KidsTag><Clock className="h-3.5 w-3.5" aria-hidden="true" />{data.service.durationMinutes} min</KidsTag>
            {data.service.deliveryModes.map((m) => <KidsTag key={m}>{MODE_LABEL[m] ?? m}</KidsTag>)}
          </div>
          {data.service.description && <p className="mt-4 text-[15px] leading-relaxed text-kids-ink/75">{data.service.description}</p>}
          <p className="mt-4 border-t border-kids-ink/10 pt-4">
            <span className="text-2xl font-bold tabular-nums">{formatINR(data.service.pricePaise)}</span>
            <span className="ml-1.5 text-sm text-kids-ink/60">per session, paid at the class</span>
          </p>
        </div>
      </section>

      <Link href={`/app/kids/providers/${data.vendor.slug}`} className={`${kidsCard} flex items-center gap-3 p-4 hover:border-kids-ink/25`}>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] text-kids-ink/60">Taught by</span>
          <span className="block font-semibold">{data.vendor.name}</span>
          <span className="mt-0.5 flex items-center gap-1 text-[13px] text-kids-ink/60">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />{data.vendor.area}{data.profile?.headline ? ` · ${data.profile.headline}` : ""}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 text-kids-ink/40" aria-hidden="true" />
      </Link>

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
            vendor: { id: data.vendor.id, name: data.vendor.name, slug: data.vendor.slug, area: data.vendor.area },
            materials: data.materials,
          }}
          childProfiles={children}
          calendar={calendar}
        />
      ) : (
        <div className={`${kidsCard} p-6 text-center`}>
          <h2 className="text-lg font-semibold">Sign in to book</h2>
          <p className="mt-1 text-sm text-kids-ink/65">Pick your child, choose a time, and the teacher confirms it.</p>
          <Link href={`/sign-in?next=/app/kids/services/${data.service.id}`} className={`${kidsPrimaryButton} mt-4`}>Sign in</Link>
        </div>
      )}
    </div>
  );
}
