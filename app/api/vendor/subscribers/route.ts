import { db, isTestEnv } from "@/src/shared/db";
import { subscriptions, users, products, households, dailyFulfillments, khataEntries } from "@/src/shared/db/schema";
import { eq, and } from "drizzle-orm";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { SubscriptionEngine } from "@/src/modules/subscriptions/subscription-engine";
import { KhataLedgerService } from "@/src/modules/khata/khata-ledger";
import { AdminService } from "@/src/modules/admin/admin-service";
import { requireSession, requireRole, assertTenant } from "@/src/shared/auth/request";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["VENDOR_ADMIN", "PLATFORM_ADMIN"]);
    const { searchParams } = new URL(request.url);
    let tenantId = searchParams.get("tenantId");
    if (!tenantId) {
      const slug = searchParams.get("slug");
      if (slug) tenantId = (await AdminService.getVendorDetailBySlug(slug))?.vendor?.id;
    }
    if (!tenantId) tenantId = session.role === "VENDOR_ADMIN" ? session.tenantId || undefined : (await AdminService.listVendorsAsync())[0]?.id;
    if (!tenantId) return Response.json(createErrorResponse("NOT_FOUND", "Vendor not found"), { status: 404 });
    if (session.role === "VENDOR_ADMIN") assertTenant(session, tenantId);
    const todayStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!isTestEnv) {
      const subRows = await db.select({ sub: subscriptions, user: users, product: products, household: households })
        .from(subscriptions)
        .leftJoin(users, eq(subscriptions.customerId, users.id))
        .leftJoin(products, eq(subscriptions.productId, products.id))
        .leftJoin(households, eq(subscriptions.householdId, households.id))
        .where(eq(subscriptions.tenantId, tenantId));
      const fulRows = await db.select().from(dailyFulfillments).where(and(eq(dailyFulfillments.tenantId, tenantId), eq(dailyFulfillments.serviceDate, todayStr)));
      const fulMap = new Map<string, string>();
      for (const f of fulRows) fulMap.set(f.customerId, f.status);
      const khataRows = await db.select({ customerId: khataEntries.customerId, amountPaise: khataEntries.amountPaise, direction: khataEntries.direction }).from(khataEntries).where(eq(khataEntries.tenantId, tenantId));
      const balanceMap = new Map<string, number>();
      for (const k of khataRows) balanceMap.set(k.customerId, (balanceMap.get(k.customerId) || 0) + (k.direction === "DEBIT" ? k.amountPaise : -k.amountPaise));
      const subscriberList = subRows.map((r) => ({
        id: r.sub.customerId,
        subscriptionId: r.sub.id,
        name: r.user?.fullName || "Subscriber",
        phone: r.user?.phone || "",
        plan: r.product?.name || "Daily Service",
        flat: r.household ? `${r.household.societyName}, ${r.household.towerWing}-${r.household.flatNumber}` : "",
        balance: Math.round((balanceMap.get(r.sub.customerId) || 0) / 100),
        status: fulMap.get(r.sub.customerId) || r.sub.status,
      }));
      return Response.json(createSuccessResponse(subscriberList), { headers: { "Cache-Control": "private, no-store" }});
    }

    const subs = await SubscriptionEngine.listByTenant(tenantId);
    const list = await Promise.all(subs.map(async (s) => ({
      id: s.customerId, subscriptionId: s.id, name: "Test Customer", phone: "+91 99999 00000", plan: s.productName,
      flat: "Test household", balance: Math.round((await KhataLedgerService.getCustomerStatement(tenantId, s.customerId)).currentBalancePaise / 100), status: s.status,
    })));
    return Response.json(createSuccessResponse(list));
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch subscribers"), { status: 500 });
  }
}
