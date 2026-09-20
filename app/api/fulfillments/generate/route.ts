import { FulfillmentGenerator } from "@/src/modules/fulfillment/fulfillment-generator";
import { SubscriptionEngine } from "@/src/modules/subscriptions/subscription-engine";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      tenantId?: string;
      serviceDate?: string;
      cutoffTimeStr?: string;
    };

    const serviceDate = body.serviceDate || new Date().toISOString().split("T")[0];
    const requestedTenantId = body.tenantId;

    if (!requestedTenantId || requestedTenantId === "ALL") {
      const allSubscriptions = await SubscriptionEngine.listAllAsync();
      const generated = FulfillmentGenerator.generateForDate(allSubscriptions, {
        serviceDate,
        cutoffTimeStr: body.cutoffTimeStr || "10:00",
        shift: "LUNCH",
      });
      return Response.json(createSuccessResponse(generated), { status: 201 });
    }

    const subscriptions = await SubscriptionEngine.listByTenant(requestedTenantId);
    const generated = FulfillmentGenerator.generateForDate(subscriptions, {
      serviceDate,
      cutoffTimeStr: body.cutoffTimeStr || "10:00",
      shift: "LUNCH",
    });

    return Response.json(createSuccessResponse(generated), { status: 201 });
  } catch (error) {
    return Response.json(
      createErrorResponse(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Internal Server Error"
      ),
      { status: 500 }
    );
  }
}
