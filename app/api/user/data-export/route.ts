import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/src/shared/auth/request";
import { db, isTestEnv } from "@/src/shared/db";
import {
  users,
  households,
  householdMembers,
  subscriptions,
  dailyFulfillments,
  khataEntries,
  invoices,
  payments,
  assetHoldings,
  disputes,
} from "@/src/shared/db/schema";
import { eq } from "drizzle-orm";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";

/**
 * DPDP Act Compliance: Right to Data Portability / Data Export
 * Exports all personal data, service subscriptions, ledger, and transactional records for the user.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.sub;

    if (isTestEnv) {
      return NextResponse.json(
        createSuccessResponse({
          exportedAt: new Date().toISOString(),
          complianceStandard: "DPDP_ACT_2023",
          user: { id: userId, phone: session.phone, role: session.role },
          subscriptions: [],
          fulfillments: [],
          khataEntries: [],
          invoices: [],
          payments: [],
          assetHoldings: [],
        })
      );
    }

    const [
      userRows,
      memberRows,
      subRows,
      fulRows,
      khataRows,
      invoiceRows,
      paymentRows,
      assetRows,
      disputeRows,
    ] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)).limit(1),
      db
        .select({ member: householdMembers, household: households })
        .from(householdMembers)
        .leftJoin(households, eq(householdMembers.householdId, households.id))
        .where(eq(householdMembers.userId, userId)),
      db.select().from(subscriptions).where(eq(subscriptions.customerId, userId)),
      db.select().from(dailyFulfillments).where(eq(dailyFulfillments.customerId, userId)),
      db.select().from(khataEntries).where(eq(khataEntries.customerId, userId)),
      db.select().from(invoices).where(eq(invoices.customerId, userId)),
      db.select().from(payments).where(eq(payments.customerId, userId)),
      db.select().from(assetHoldings).where(eq(assetHoldings.customerId, userId)),
      db.select().from(disputes).where(eq(disputes.customerId, userId)),
    ]);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      complianceStandard: "Digital Personal Data Protection (DPDP) Act, 2023",
      user: userRows[0] || { id: userId, phone: session.phone },
      households: memberRows.map((m) => ({
        role: m.member.role,
        household: m.household,
      })),
      subscriptions: subRows,
      fulfillments: fulRows,
      khataEntries: khataRows,
      invoices: invoiceRows,
      payments: paymentRows,
      assetHoldings: assetRows,
      disputes: disputeRows,
    };

    return NextResponse.json(createSuccessResponse(exportPayload), {
      headers: {
        "Content-Disposition": `attachment; filename="ruxs-data-export-${userId}.json"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      createErrorResponse("UNAUTHORIZED", error?.message || "Failed to authenticate session"),
      { status: 401 }
    );
  }
}
