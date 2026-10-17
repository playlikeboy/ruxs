import { getAvailability } from "@/features/bookings/queries";
import { redirect } from "next/navigation";
import { BookingRulesForm, TimeOffEditor, WeeklyHoursEditor } from "@/features/bookings/components/availability-editor";

export const metadata = { title: "Availability" };

export default async function AvailabilityPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const { access, rules, blocks } = await getAvailability(slug);
  if (access.vendor.businessType !== "booking") redirect(`/merchant-panel/${slug}/today`);

  return (
    <div className="max-w-4xl space-y-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Availability</h1>
        <p className="mt-0.5 text-sm text-muted">Clients can only book times you mark free here. Times are in IST.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Weekly hours</h2>
        <WeeklyHoursEditor slug={slug} initial={rules.map((r) => ({ weekday: r.weekday, startTime: r.startTime, endTime: r.endTime }))} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Time off</h2>
        <p className="text-sm text-muted">Block holidays or busy hours. Existing bookings stay; cancel them from Bookings if needed.</p>
        <TimeOffEditor slug={slug} blocks={blocks.map((b) => ({ id: b.id, startsAt: b.startsAt.toISOString(), endsAt: b.endsAt.toISOString(), reason: b.reason }))} />
      </section>

      {access.role === "owner" && (
        <section className="space-y-3 rounded-[14px] border border-line bg-surface p-5">
          <h2 className="text-lg font-semibold text-ink">Booking rules</h2>
          <BookingRulesForm slug={slug} noticeMinutes={access.vendor.bookingNoticeMinutes} cancelCutoffHours={access.vendor.cancelCutoffHours} />
        </section>
      )}
    </div>
  );
}
