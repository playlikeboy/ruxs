import type { Metadata } from "next";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getMyKidsBookings, getMyKidsEnrollments } from "@/features/kids/queries";
import { BookingsManager } from "@/features/kids/components/bookings-manager";
import { KidsPageHeader, kidsSecondaryButton } from "@/features/kids/components/kids-ui";

export const metadata: Metadata = {
  title: "Bookings · RUXs Kids",
  description: "Class requests, upcoming sessions and workshop seats for your children.",
};

export default async function KidsBookingsPage() {
  await requireUser();
  const [bookings, enrollments] = await Promise.all([getMyKidsBookings(), getMyKidsEnrollments()]);

  return (
    <div className="space-y-5">
      <KidsPageHeader
        title="Bookings"
        lead="Requests, upcoming classes and workshop seats."
        action={
          <Link href="/app/kids/children" className={`${kidsSecondaryButton} shrink-0 px-4`}>
            <UsersRound className="h-4 w-4" aria-hidden="true" /> Children
          </Link>
        }
      />
      <BookingsManager initialBookings={bookings} initialEnrollments={enrollments} />
    </div>
  );
}
