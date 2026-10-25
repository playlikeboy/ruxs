import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, MapPin, UsersRound } from "lucide-react";
import { CoverArt } from "@/components/ui/cover-art";
import { getKidsWorkshopById, getMyChildren } from "@/features/kids/queries";
import { hexclave } from "@/lib/auth/hexclave";
import { WorkshopEnrollForm } from "@/features/kids/components/workshop-enroll-form";
import { KidsBackLink, KidsSection, KidsTag, kidsCard, kidsPrimaryButton } from "@/features/kids/components/kids-ui";
import { formatAgeRange, formatClassesList } from "@/core/kids/age-eligibility";
import { formatINR } from "@/core/money";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getKidsWorkshopById(id);
  if (!data) return { title: "Workshop not found" };
  return {
    title: `${data.workshop.title} · RUXs Kids`,
    description: data.workshop.description ?? `Reserve a seat for ${data.workshop.title} by ${data.vendor.name} on RUXs Kids.`,
  };
}

export default async function KidsWorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getKidsWorkshopById(id);
  if (!data) notFound();

  const user = await hexclave.getUser();
  const children = user ? await getMyChildren() : [];
  const classes = (data.workshop.eligibleClasses as string[] | null) ?? [];
  const ageText = formatAgeRange(data.workshop.minAge, data.workshop.maxAge) + (classes.length ? ` · ${formatClassesList(classes)}` : "");
  const { remainingSeats, isAlmostFull } = data.availability;

  return (
    <div className="space-y-6">
      <KidsBackLink href="/app/kids/workshops" label="Workshops" />

      <section className={`${kidsCard} group overflow-hidden`}>
        <CoverArt theme={`${data.category.id} ${data.category.name}`} label={data.category.name} className="h-36 w-full" />
        <div className="p-5">
          <p className="text-sm font-medium text-kids-ink/60">{data.category.name}</p>
          <h1 className="mt-0.5 font-kids text-[28px] font-semibold leading-tight tracking-tight">{data.workshop.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <KidsTag><UsersRound className="h-3.5 w-3.5" aria-hidden="true" />{ageText}</KidsTag>
            <KidsTag tone={isAlmostFull ? "warn" : "good"}>{remainingSeats} of {data.workshop.capacity} seats left</KidsTag>
          </div>
          {data.workshop.description && <p className="mt-4 text-[15px] leading-relaxed text-kids-ink/75">{data.workshop.description}</p>}
          <dl className="mt-4 grid gap-2 border-t border-kids-ink/10 pt-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-kids-ink/50" aria-hidden="true" />
              <dt className="sr-only">Dates</dt>
              <dd>{data.workshop.startDate === data.workshop.endDate ? data.workshop.startDate : `${data.workshop.startDate} to ${data.workshop.endDate}`}</dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-kids-ink/50" aria-hidden="true" />
              <dt className="sr-only">Where</dt>
              <dd>{data.workshop.venueOrMode}{data.workshop.address ? ` · ${data.workshop.address}` : ""}</dd>
            </div>
          </dl>
          <p className="mt-4">
            <span className="text-2xl font-bold tabular-nums">{formatINR(data.workshop.pricePaise)}</span>
            <span className="ml-1.5 text-sm text-kids-ink/60">per child</span>
          </p>
        </div>
      </section>

      <KidsSection title={`Schedule (${data.sessions.length} ${data.sessions.length === 1 ? "session" : "sessions"})`}>
        {data.sessions.length === 0 ? (
          <p className={`${kidsCard} p-4 text-sm text-kids-ink/60`}>Session times will be shared before the first day.</p>
        ) : (
          <ol className={`${kidsCard} divide-y divide-kids-ink/10`}>
            {data.sessions.map((sess, idx) => (
              <li key={sess.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kids-sunny text-sm font-semibold tabular-nums">{idx + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{sess.sessionDate}</span>
                  <span className="block text-[13px] text-kids-ink/60">{sess.startTime} – {sess.endTime}</span>
                </span>
                <span className="text-[13px] text-kids-ink/60">{sess.venueOrMode}</span>
              </li>
            ))}
          </ol>
        )}
      </KidsSection>

      <section className={`${kidsCard} space-y-3 p-4 text-sm`}>
        <div>
          <h2 className="font-semibold">What&apos;s included</h2>
          <p className="mt-0.5 text-kids-ink/70">{data.workshop.materialsDescription || "Ask the host what to bring; materials are listed here when they add them."}</p>
        </div>
        <div className="border-t border-kids-ink/10 pt-3">
          <h2 className="font-semibold">Cancellation</h2>
          <p className="mt-0.5 text-kids-ink/70">{data.workshop.cancellationPolicy}</p>
        </div>
      </section>

      <Link href={`/app/kids/providers/${data.vendor.slug}`} className={`${kidsCard} flex items-center gap-3 p-4 hover:border-kids-ink/25`}>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] text-kids-ink/60">Hosted by</span>
          <span className="block font-semibold">{data.vendor.name}</span>
        </span>
        <ChevronRight className="h-5 w-5 text-kids-ink/40" aria-hidden="true" />
      </Link>

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
        <div className={`${kidsCard} p-6 text-center`}>
          <h2 className="text-lg font-semibold">Sign in to reserve a seat</h2>
          <p className="mt-1 text-sm text-kids-ink/65">Choose your child and hold their seat.</p>
          <Link href={`/sign-in?next=/app/kids/workshops/${data.workshop.id}`} className={`${kidsPrimaryButton} mt-4`}>Sign in</Link>
        </div>
      )}
    </div>
  );
}
