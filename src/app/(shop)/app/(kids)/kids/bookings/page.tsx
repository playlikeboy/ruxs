import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getMyKidsBookings, getMyKidsEnrollments } from "@/features/kids/queries";
import { BookingsManager } from "@/features/kids/components/bookings-manager";

export const metadata: Metadata = {
  title: "My Kids Activities & Bookings · RUXs",
  description: "View and manage scheduled classes, weekend workshops, and activity bookings for your children.",
};

export default async function KidsBookingsPage() {
  await requireUser();

  const [bookings, enrollments] = await Promise.all([
    getMyKidsBookings(),
    getMyKidsEnrollments(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-black tracking-tight text-kids-ink">
            My Activities & Bookings 📅
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-kids-ink/60">
            Upcoming sessions and holiday camp enrollments for your family
          </p>
        </div>

        <Link
          href="/app/kids/children"
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-kids-grape/15 bg-white px-3 py-1 text-xs font-black text-kids-ink shadow-[0_2px_0_rgba(155,92,246,0.18)] hover:bg-slate-50"
        >
          <UserPlus className="h-3.5 w-3.5 text-pink-600" />
          <span>My Kids</span>
        </Link>
      </div>

      <BookingsManager
        initialBookings={bookings}
        initialEnrollments={enrollments}
      />
    </div>
  );
}
