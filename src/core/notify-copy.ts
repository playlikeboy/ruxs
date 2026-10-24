/**
 * Wording for every email and push notification RUXs sends.
 * Pure: the dispatcher decides who receives it; this decides what it says.
 */
import { formatINR } from "./money";

type When = { startsAt: Date };
type Kid = { childName: string };

export type NotifyEvent =
  // To the merchant
  | { kind: "vendor.order.new"; slug: string; number: string; customerName: string; totalPaise: number; paymentMode: string }
  | { kind: "vendor.order.paid"; slug: string; number: string; customerName: string; totalPaise: number }
  | { kind: "vendor.order.cancelled"; slug: string; number: string; customerName: string }
  | ({ kind: "vendor.booking.new"; slug: string; number: string; customerName: string; serviceName: string } & When)
  | ({ kind: "vendor.booking.cancelled"; slug: string; number: string; customerName: string; serviceName: string } & When)
  | ({ kind: "vendor.kids.request"; slug: string; number: string; serviceName: string } & When & Kid)
  | ({ kind: "vendor.kids.cancelled"; slug: string; number: string; serviceName: string } & When & Kid)
  | ({ kind: "vendor.enrollment.new"; slug: string; workshopTitle: string; startDate: string } & Kid)
  | { kind: "vendor.tomorrow"; slug: string; count: number; first: Date }
  // To the household
  | { kind: "customer.order.placed"; number: string; vendorName: string; paymentMode: string; orderId: string }
  | { kind: "customer.order.paid"; number: string; vendorName: string; orderId: string }
  | { kind: "customer.order.status"; number: string; vendorName: string; orderId: string; status: "accepted" | "rejected" | "out_for_delivery" | "delivered" | "cancelled"; reason?: string }
  | ({ kind: "customer.booking.confirmed"; number: string; serviceName: string; vendorName: string } & When)
  | ({ kind: "customer.booking.cancelled"; serviceName: string; vendorName: string; reason?: string } & When)
  | ({ kind: "customer.kids.requested"; serviceName: string; vendorName: string } & When & Kid)
  | ({ kind: "customer.kids.accepted"; serviceName: string; vendorName: string } & When & Kid)
  | ({ kind: "customer.kids.declined"; serviceName: string; vendorName: string; reason?: string } & When & Kid)
  | ({ kind: "customer.kids.cancelled"; serviceName: string; vendorName: string; reason?: string } & When & Kid)
  | ({ kind: "customer.kids.completed"; serviceName: string; vendorName: string } & When & Kid)
  | ({ kind: "customer.enrollment.confirmed"; workshopTitle: string; vendorName: string; startDate: string; pricePaise: number } & Kid)
  | ({ kind: "customer.reminder"; serviceName: string; vendorName: string; path: string; childName?: string } & When)
  // To anyone, from their own settings
  | { kind: "account.test"; path: string };

export type Category = "orders" | "plans" | "bills" | "reviews" | "welcome" | "alerts";

export interface NotificationCopy {
  category: Category;
  subject: string;
  heading: string;
  lead: string;
  details: { label: string; value: string }[];
  actionText: string;
  path: string;
  push: { title: string; body: string };
}

const IST = "Asia/Kolkata";

export function istTime(d: Date) {
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: IST }).replace(/am|pm/, (m) => m.toUpperCase());
}

export function istWhen(d: Date) {
  const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: IST });
  return `${day.replace(",", "")}, ${istTime(d)}`;
}

function istDate(ymd: string) {
  return new Date(`${ymd}T12:00:00+05:30`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: IST }).replace(",", "");
}

const PAYMENT: Record<string, string> = { cod: "Pay on delivery", monthly_bill: "Added to monthly bill", online: "Paid online" };

const merchant = (slug: string, page: string) => `/merchant-panel/${slug}/${page}`;
const requests = (slug: string) => merchant(slug, "bookings?view=list&tab=upcoming");

function copy(c: Omit<NotificationCopy, "details" | "push"> & { details?: NotificationCopy["details"]; push?: NotificationCopy["push"] }): NotificationCopy {
  return { details: [], push: { title: c.heading, body: c.lead }, ...c };
}

const ORDER_STATUS: Record<"accepted" | "rejected" | "out_for_delivery" | "delivered" | "cancelled", (v: string) => [string, string]> = {
  accepted: (v) => [`${v} accepted your order`, "It is being prepared."],
  rejected: (v) => [`${v} couldn't take your order`, "Nothing is charged for it."],
  out_for_delivery: (v) => [`Your order from ${v} is on the way`, "Keep your phone handy."],
  delivered: (v) => [`Delivered by ${v}`, "Thanks for ordering from your neighbourhood."],
  cancelled: (v) => [`Your order from ${v} was cancelled`, "Any online payment will be refunded."],
};

export function notificationCopy(e: NotifyEvent): NotificationCopy {
  switch (e.kind) {
    case "vendor.order.new":
      return copy({
        category: "orders",
        subject: `New order #${e.number} from ${e.customerName}`,
        heading: `New order #${e.number}`,
        lead: `${e.customerName} placed an order. Accept or decline it so they know what to expect.`,
        details: [{ label: "Total", value: formatINR(e.totalPaise) }, { label: "Payment", value: PAYMENT[e.paymentMode] ?? e.paymentMode }],
        actionText: "Open orders",
        path: merchant(e.slug, "orders"),
        push: { title: `New order #${e.number}`, body: `${e.customerName} · ${formatINR(e.totalPaise)} · tap to accept` },
      });
    case "vendor.order.paid":
      return copy({
        category: "orders",
        subject: `Paid order #${e.number} from ${e.customerName}`,
        heading: `New paid order #${e.number}`,
        lead: `${e.customerName} paid online. Accept the order to start preparing it.`,
        details: [{ label: "Total", value: formatINR(e.totalPaise) }, { label: "Payment", value: "Paid online" }],
        actionText: "Open orders",
        path: merchant(e.slug, "orders"),
        push: { title: `Paid order #${e.number}`, body: `${e.customerName} · ${formatINR(e.totalPaise)} · tap to accept` },
      });
    case "vendor.order.cancelled":
      return copy({ category: "orders", subject: `Order #${e.number} was cancelled`, heading: `Order #${e.number} cancelled`, lead: `${e.customerName} cancelled this order. You don't need to prepare it.`, actionText: "Open orders", path: merchant(e.slug, "orders") });
    case "vendor.booking.new":
      return copy({
        category: "orders",
        subject: `New booking: ${e.serviceName}, ${istWhen(e.startsAt)}`,
        heading: "New booking",
        lead: `${e.customerName} booked ${e.serviceName} for ${istWhen(e.startsAt)}.`,
        details: [{ label: "Ref", value: e.number }],
        actionText: "Open calendar",
        path: merchant(e.slug, "bookings"),
        push: { title: "New booking", body: `${e.customerName} · ${e.serviceName} · ${istWhen(e.startsAt)}` },
      });
    case "vendor.booking.cancelled":
      return copy({ category: "orders", subject: `Booking cancelled: ${e.serviceName}, ${istWhen(e.startsAt)}`, heading: "Booking cancelled", lead: `${e.customerName} cancelled ${e.serviceName} on ${istWhen(e.startsAt)}. The slot is free again.`, details: [{ label: "Ref", value: e.number }], actionText: "Open calendar", path: merchant(e.slug, "bookings") });
    case "vendor.kids.request":
      return copy({
        category: "orders",
        subject: `Booking request: ${e.childName}, ${istWhen(e.startsAt)}`,
        heading: "New booking request",
        lead: `A parent asked for ${e.serviceName} for ${e.childName} on ${istWhen(e.startsAt)}. Accept or decline it so they know.`,
        details: [{ label: "Ref", value: e.number }],
        actionText: "Accept or decline",
        path: requests(e.slug),
        push: { title: "New booking request", body: `${e.childName} · ${e.serviceName} · ${istWhen(e.startsAt)}` },
      });
    case "vendor.kids.cancelled":
      return copy({ category: "orders", subject: `Cancelled: ${e.childName}, ${istWhen(e.startsAt)}`, heading: "Session cancelled by the parent", lead: `${e.childName}'s ${e.serviceName} on ${istWhen(e.startsAt)} was cancelled.`, details: [{ label: "Ref", value: e.number }], actionText: "Open calendar", path: merchant(e.slug, "bookings") });
    case "vendor.enrollment.new":
      return copy({ category: "orders", subject: `New enrolment: ${e.childName} in ${e.workshopTitle}`, heading: "New workshop enrolment", lead: `${e.childName} enrolled in ${e.workshopTitle}, starting ${istDate(e.startDate)}.`, actionText: "Open workshops", path: merchant(e.slug, "kids") });
    case "vendor.tomorrow":
      return copy({
        category: "orders",
        subject: `Tomorrow: ${e.count} ${e.count === 1 ? "session" : "sessions"}, first at ${istTime(e.first)}`,
        heading: "Your day tomorrow",
        lead: `You have ${e.count} ${e.count === 1 ? "session" : "sessions"} tomorrow. The first starts at ${istTime(e.first)}.`,
        actionText: "See tomorrow",
        path: merchant(e.slug, "bookings?view=day"),
      });
    case "customer.order.placed":
      return copy({ category: "orders", subject: `Order placed: #${e.number} from ${e.vendorName}`, heading: `Order placed: #${e.number}`, lead: `${e.vendorName} has your order and will accept it shortly.`, details: [{ label: "Store", value: e.vendorName }, { label: "Payment", value: PAYMENT[e.paymentMode] ?? e.paymentMode }], actionText: "View order", path: `/app/orders/${e.orderId}` });
    case "customer.order.paid":
      return copy({ category: "orders", subject: `Payment received: order #${e.number}`, heading: "Payment received", lead: `Your payment went through and ${e.vendorName} has your order.`, details: [{ label: "Payment", value: "Paid online" }], actionText: "View order", path: `/app/orders/${e.orderId}` });
    case "customer.order.status": {
      const [heading, lead] = ORDER_STATUS[e.status](e.vendorName);
      return copy({ category: "orders", subject: `${heading} (#${e.number})`, heading, lead, details: e.reason ? [{ label: "Reason", value: e.reason }] : [], actionText: "View order", path: `/app/orders/${e.orderId}` });
    }
    case "customer.booking.confirmed":
      return copy({ category: "orders", subject: `Booked: ${e.serviceName}, ${istWhen(e.startsAt)}`, heading: "Your booking is confirmed", lead: `${e.serviceName} with ${e.vendorName} on ${istWhen(e.startsAt)}.`, details: [{ label: "Ref", value: e.number }], actionText: "View booking", path: "/app/bookings" });
    case "customer.booking.cancelled":
      return copy({ category: "orders", subject: `Cancelled: ${e.serviceName}, ${istWhen(e.startsAt)}`, heading: "Your booking was cancelled", lead: `${e.vendorName} cancelled ${e.serviceName} on ${istWhen(e.startsAt)}. Any online payment will be refunded.`, details: e.reason ? [{ label: "Reason", value: e.reason }] : [], actionText: "Book another time", path: "/app/bookings" });
    case "customer.kids.requested":
      return copy({ category: "orders", subject: `Request sent: ${e.serviceName} for ${e.childName}`, heading: "Booking request sent", lead: `${e.vendorName} will confirm ${e.serviceName} for ${e.childName} on ${istWhen(e.startsAt)}. We'll email you when they do.`, actionText: "View bookings", path: "/app/kids/bookings" });
    case "customer.kids.accepted":
      return copy({ category: "orders", subject: `Confirmed: ${e.serviceName}, ${istWhen(e.startsAt)}`, heading: "Booking confirmed", lead: `${e.vendorName} confirmed ${e.serviceName} for ${e.childName} on ${istWhen(e.startsAt)}. Pay at the session.`, actionText: "View bookings", path: "/app/kids/bookings" });
    case "customer.kids.declined":
      return copy({ category: "orders", subject: `${e.vendorName} couldn't take this booking`, heading: "Booking not accepted", lead: `${e.vendorName} couldn't take ${e.serviceName} for ${e.childName} on ${istWhen(e.startsAt)}. Try another time.`, details: e.reason ? [{ label: "Reason", value: e.reason }] : [], actionText: "Find another time", path: "/app/kids" });
    case "customer.kids.cancelled":
      return copy({ category: "orders", subject: `Cancelled: ${e.serviceName}, ${istWhen(e.startsAt)}`, heading: "Session cancelled by the provider", lead: `${e.vendorName} cancelled ${e.childName}'s ${e.serviceName} on ${istWhen(e.startsAt)}.`, details: e.reason ? [{ label: "Reason", value: e.reason }] : [], actionText: "View bookings", path: "/app/kids/bookings" });
    case "customer.kids.completed":
      return copy({ category: "reviews", subject: `How was ${e.serviceName}?`, heading: `How was ${e.serviceName}?`, lead: `${e.vendorName} marked ${e.childName}'s session done. A short review helps other parents.`, actionText: "Leave a review", path: "/app/kids/bookings" });
    case "customer.enrollment.confirmed":
      return copy({ category: "orders", subject: `Enrolled: ${e.childName} in ${e.workshopTitle}`, heading: "Seat reserved", lead: `${e.childName} has a seat in ${e.workshopTitle} with ${e.vendorName}, starting ${istDate(e.startDate)}. Pay ${formatINR(e.pricePaise)} at the venue.`, actionText: "View bookings", path: "/app/kids/bookings" });
    case "account.test":
      return copy({
        category: "alerts",
        subject: "RUXs alerts are working",
        heading: "Alerts are on",
        lead: "This is a test. New orders, booking requests and reminders will reach you like this.",
        actionText: "Open RUXs",
        path: e.path,
        push: { title: "Alerts are on", body: "New orders and booking requests will show up here." },
      });
    case "customer.reminder": {
      const who = e.childName ? `${e.childName} has` : "You have";
      return copy({
        category: "orders",
        subject: `Tomorrow: ${e.serviceName} at ${istTime(e.startsAt)}`,
        heading: "Reminder for tomorrow",
        lead: `${who} ${e.serviceName} with ${e.vendorName} tomorrow at ${istTime(e.startsAt)}.`,
        actionText: "View booking",
        path: e.path,
        push: { title: `Tomorrow: ${e.serviceName}`, body: `${istTime(e.startsAt)} with ${e.vendorName}` },
      });
    }
  }
}
