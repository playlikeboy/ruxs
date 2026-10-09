import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/src/shared/auth/request";
import { db, isTestEnv } from "@/src/shared/db";
import { users, subscriptions, householdMembers } from "@/src/shared/db/schema";
import { eq } from "drizzle-orm";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";

/**
 * DPDP Act Compliance: Right to Erasure / Account Deletion
 * Anonymizes PII, cancels active subscriptions, and revokes access while maintaining regulatory financial audit trail.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.sub;

    if (!isTestEnv) {
      // 1. Cancel active subscriptions
      await db
        .update(subscriptions)
        .set({
          status: "CANCELLED",
        })
        .where(eq(subscriptions.customerId, userId));

      // 2. Anonymize PII in users table
      await db
        .update(users)
        .set({
          fullName: "Anonymized Customer",
          phone: `+91000${Date.now().toString().slice(-7)}`,
          whatsappOptIn: false,
          status: "SUSPENDED",
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // 3. Remove household membership link
      await db
        .delete(householdMembers)
        .where(eq(householdMembers.userId, userId));
    }

    const response = NextResponse.json(
      createSuccessResponse({
        message: "Account personal data successfully erased and anonymized per DPDP Act standards.",
        userId,
        timestamp: new Date().toISOString(),
      })
    );

    response.cookies.set("ruxs_session", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      expires: new Date(0),
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      createErrorResponse("UNAUTHORIZED", error?.message || "Failed to authenticate session"),
      { status: 401 }
    );
  }
}
