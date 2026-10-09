import { SubscriptionEngine } from "@/src/modules/subscriptions/subscription-engine";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession, requireRole, assertTenant } from "@/src/shared/auth/request";
import { db, isTestEnv, products } from "@/src/shared/db";
import { and, eq } from "drizzle-orm";
import { HouseholdService } from "@/src/modules/households/household-service";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const tenantId = searchParams.get("tenantId");

    if (customerId) {
      if (session.role !== "PLATFORM_ADMIN" && session.sub !== customerId) {
        return Response.json(createErrorResponse("FORBIDDEN", "You may only access your own subscriptions"), { status: 403 });
      }
      return Response.json(createSuccessResponse(await SubscriptionEngine.listByCustomer(customerId)), {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    if (tenantId) {
      requireRole(session, ["VENDOR_ADMIN", "PLATFORM_ADMIN"]);
      if (session.role === "VENDOR_ADMIN") assertTenant(session, tenantId);
      return Response.json(createSuccessResponse(await SubscriptionEngine.listByTenant(tenantId)), {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    return Response.json(createErrorResponse("VALIDATION_FAILED", "Please provide customerId or tenantId"), { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") {
      return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    }
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load subscriptions"), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["CUSTOMER", "HOUSEHOLD_MEMBER"]);
    const body = ((await request.json().catch(() => ({}))) || {}) as Record<string, any>;

    if (body.customerId && body.customerId !== session.sub) {
      return Response.json(createErrorResponse("FORBIDDEN", "Customer identity must come from the session"), { status: 403 });
    }

    if (body.householdId) {
      const household = await HouseholdService.getHouseholdAsync(String(body.householdId));
      if (!household || !household.members.some((m) => m.userId === session.sub)) {
        return Response.json(createErrorResponse("FORBIDDEN", "You may only subscribe for your own household"), { status: 403 });
      }
    }

    let input: Record<string, any> = { ...body, customerId: session.sub };

    if (!isTestEnv) {
      const productId = String(body.productId || "");
      const productRows = await db.select({
        id: products.id,
        tenantId: products.tenantId,
        name: products.name,
        basePricePaise: products.basePricePaise,
      }).from(products).where(and(eq(products.id, productId), eq(products.isActive, true))).limit(1);

      const product = productRows[0];
      if (!product) return Response.json(createErrorResponse("NOT_FOUND", "Product not found or inactive"), { status: 404 });

      input = {
        ...input,
        tenantId: product.tenantId,
        productName: product.name,
        unitPricePaise: product.basePricePaise,
      };
    } else if (!input.tenantId || !input.productName || !input.unitPricePaise) {
      return Response.json(createErrorResponse("VALIDATION_FAILED", "tenantId, productId, productName and unitPricePaise are required in test mode"), { status: 400 });
    }

    const sub = await SubscriptionEngine.createSubscription(input);
    return Response.json(createSuccessResponse(sub), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to create subscription"), { status: 500 });
  }
}
