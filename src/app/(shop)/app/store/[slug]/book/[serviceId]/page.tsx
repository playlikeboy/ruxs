import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { formatINR } from "@/core/money";
import { razorpayKeyId } from "@/lib/razorpay";
import { getMyProfile } from "@/features/consumer/queries";
import { getBookableService, getSlotCalendar } from "@/features/bookings/queries";
import { getCategoryMap } from "@/features/platform/queries";
import { PageHeader } from "@/features/consumer/components/page-header";
import { StoreCover } from "@/features/consumer/components/store-cover";
import { BookingPicker } from "@/features/bookings/components/booking-picker";

export const metadata = { title: "Book a session" };

export default async function BookPage({ params }: { params: Promise<{ slug: string; serviceId: string }> }) {
  const { slug, serviceId } = await params;
  const [found, { profile }, category] = await Promise.all([getBookableService(serviceId), getMyProfile(), getCategoryMap()]);
  if (!found || found.vendor.slug !== slug) notFound();
  const { service, vendor } = found;
  const calendar = await getSlotCalendar({ vendorId: vendor.id, durationMinutes: service.durationMinutes, noticeMinutes: vendor.bookingNoticeMinutes, days: 14 });

  return (
    <div>
      <PageHeader title="Book a session" subtitle={vendor.name} back={`/app/store/${slug}`} />
      <div className="px-4 pt-4">
        <div className="flex items-center gap-4">
          <StoreCover cover={category(service.categoryId)} alt="" className="h-20 w-20 shrink-0 rounded-2xl" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink">{service.name}</h2>
            <p className="flex items-center gap-1.5 text-sm text-neutral-500">
              <span className="font-semibold text-ink tabular-nums">{formatINR(service.pricePaise)}</span> · <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {service.durationMinutes} min
            </p>
            <p className="text-xs text-neutral-500">Free cancellation up to {vendor.cancelCutoffHours} h before</p>
          </div>
        </div>
        {service.description && <p className="mt-3 text-sm leading-6 text-neutral-600">{service.description}</p>}
        <div className="mt-6">
          <BookingPicker
            serviceId={service.id}
            pricePaise={service.pricePaise}
            modes={service.modes}
            calendar={calendar}
            hasProfile={!!profile}
            onlineEnabled={!!razorpayKeyId()}
            studioAddress={`${vendor.area}, ${vendor.city}`}
          />
        </div>
      </div>
    </div>
  );
}
