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

export default async function BookPage({ params }: { params: Promise<{ slug: string; productId: string }> }) {
  const { slug, productId } = await params;
  const [service, { profile }, category] = await Promise.all([getBookableService(productId), getMyProfile(), getCategoryMap()]);
  if (!service || service.vendor.slug !== slug) notFound();
  const { product, vendor } = service;
  const duration = product.durationMinutes ?? 60;
  const calendar = await getSlotCalendar({ vendorId: vendor.id, durationMinutes: duration, noticeMinutes: vendor.bookingNoticeMinutes, days: 14 });

  return (
    <div>
      <PageHeader title="Book a session" subtitle={vendor.name} back={`/app/store/${slug}`} />
      <div className="px-4 pt-4">
        <div className="flex items-center gap-4">
          <StoreCover cover={category(product.kind)} imageUrl={product.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-2xl" emojiClass="text-4xl" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink">{product.name}</h2>
            <p className="flex items-center gap-1.5 text-sm text-neutral-500">
              <span className="font-semibold text-ink tabular-nums">{formatINR(product.pricePaise)}</span> · <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {duration} min
            </p>
            <p className="text-xs text-neutral-500">Free cancellation up to {vendor.cancelCutoffHours} h before</p>
          </div>
        </div>
        {product.description && <p className="mt-3 text-sm leading-6 text-neutral-600">{product.description}</p>}
        <div className="mt-6">
          <BookingPicker
            productId={product.id}
            pricePaise={product.pricePaise}
            modes={vendor.serviceModes}
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
