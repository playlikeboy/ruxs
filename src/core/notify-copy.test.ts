import { describe, expect, it } from "bun:test";
import { notificationCopy, istWhen, type NotifyEvent } from "./notify-copy";

const at = new Date("2026-10-26T11:00:00Z"); // 16:30 IST

describe("istWhen", () => {
  it("formats IST day and time", () => {
    expect(istWhen(at)).toBe("Mon 26 Oct, 4:30 PM");
  });
});

describe("notificationCopy", () => {
  it("tells a merchant about a new order with a link to orders", () => {
    const c = notificationCopy({ kind: "vendor.order.new", slug: "annapurna", number: "1042", customerName: "Riya", totalPaise: 24000, paymentMode: "cod" });
    expect(c.category).toBe("orders");
    expect(c.subject).toBe("New order #1042 from Riya");
    expect(c.path).toBe("/merchant-panel/annapurna/orders");
    expect(c.push.title).toBe("New order #1042");
    expect(c.details).toContainEqual({ label: "Total", value: "₹240" });
    expect(c.details).toContainEqual({ label: "Payment", value: "Pay on delivery" });
  });

  it("asks a kids provider to accept a request", () => {
    const c = notificationCopy({ kind: "vendor.kids.request", slug: "rahul-dance", number: "KBK-1", childName: "Aarav", serviceName: "Dance Workshop", startsAt: at });
    expect(c.subject).toBe("Booking request: Aarav, Mon 26 Oct, 4:30 PM");
    expect(c.lead).toContain("Accept or decline");
    expect(c.path).toBe("/merchant-panel/rahul-dance/bookings?view=list&tab=upcoming");
  });

  it("reminds a parent about tomorrow's class", () => {
    const c = notificationCopy({ kind: "customer.reminder", serviceName: "Dance Workshop", vendorName: "Rahul Dance Academy", startsAt: at, childName: "Aarav", path: "/app/kids/bookings" });
    expect(c.subject).toBe("Tomorrow: Dance Workshop at 4:30 PM");
    expect(c.lead).toBe("Aarav has Dance Workshop with Rahul Dance Academy tomorrow at 4:30 PM.");
    expect(c.push.body).toContain("4:30 PM");
  });

  it("explains a declined kids request with the provider's reason", () => {
    const c = notificationCopy({ kind: "customer.kids.declined", serviceName: "Dance Workshop", vendorName: "Rahul", startsAt: at, childName: "Aarav", reason: "Studio closed that day" });
    expect(c.subject).toBe("Rahul couldn't take this booking");
    expect(c.details).toContainEqual({ label: "Reason", value: "Studio closed that day" });
  });

  it("describes every order status a customer can see", () => {
    for (const status of ["accepted", "rejected", "out_for_delivery", "delivered", "cancelled"] as const) {
      const c = notificationCopy({ kind: "customer.order.status", number: "9", vendorName: "Shop", status, orderId: "o1" });
      expect(c.subject.length).toBeGreaterThan(5);
      expect(c.path).toBe("/app/orders/o1");
    }
  });

  it("never offers a payment line the order does not have", () => {
    const c = notificationCopy({ kind: "customer.order.placed", number: "7", vendorName: "Shop", paymentMode: "monthly_bill", orderId: "o7" });
    expect(c.details).toContainEqual({ label: "Payment", value: "Added to monthly bill" });
  });

  it("covers every event kind with a subject, path and push text", () => {
    const events: NotifyEvent[] = [
      { kind: "vendor.order.cancelled", slug: "s", number: "1", customerName: "A" },
      { kind: "vendor.order.paid", slug: "s", number: "1", customerName: "A", totalPaise: 100 },
      { kind: "vendor.booking.new", slug: "s", number: "B1", customerName: "A", serviceName: "Yoga", startsAt: at },
      { kind: "vendor.booking.cancelled", slug: "s", number: "B1", customerName: "A", serviceName: "Yoga", startsAt: at },
      { kind: "vendor.kids.cancelled", slug: "s", number: "K1", childName: "A", serviceName: "Art", startsAt: at },
      { kind: "vendor.enrollment.new", slug: "s", childName: "A", workshopTitle: "Camp", startDate: "2026-11-01" },
      { kind: "vendor.tomorrow", slug: "s", count: 3, first: at },
      { kind: "customer.order.paid", number: "1", vendorName: "Shop", orderId: "o" },
      { kind: "customer.booking.confirmed", number: "B1", serviceName: "Yoga", vendorName: "V", startsAt: at },
      { kind: "customer.booking.cancelled", serviceName: "Yoga", vendorName: "V", startsAt: at },
      { kind: "customer.kids.requested", serviceName: "Art", vendorName: "V", startsAt: at, childName: "A" },
      { kind: "customer.kids.accepted", serviceName: "Art", vendorName: "V", startsAt: at, childName: "A" },
      { kind: "customer.kids.cancelled", serviceName: "Art", vendorName: "V", startsAt: at, childName: "A" },
      { kind: "customer.kids.completed", serviceName: "Art", vendorName: "V", startsAt: at, childName: "A" },
      { kind: "customer.enrollment.confirmed", workshopTitle: "Camp", vendorName: "V", startDate: "2026-11-01", childName: "A", pricePaise: 80000 },
      { kind: "account.test", path: "/merchant-panel/s/today" },
    ];
    for (const e of events) {
      const c = notificationCopy(e);
      expect(c.subject.length).toBeGreaterThan(3);
      expect(c.path.startsWith("/")).toBe(true);
      expect(c.push.title.length).toBeGreaterThan(3);
    }
  });
});
