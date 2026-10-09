import { DeliveryEngine } from "@/src/modules/delivery/delivery-engine";
import { GenerateRunSheetInputSchema } from "@/src/modules/delivery/delivery-schema";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession, requireRole, assertTenant } from "@/src/shared/auth/request";

import { maskIndianPhone } from "@/src/shared/auth/phone";

function maskRunForStaff(run: any): any {
  if (!run || !Array.isArray(run.stops)) return run;
  return {
    ...run,
    stops: run.stops.map((stop: any) => ({
      ...stop,
      customerPhone: maskIndianPhone(stop.customerPhone),
    })),
  };
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["DELIVERY_STAFF", "VENDOR_ADMIN", "PLATFORM_ADMIN"]);
    const p = new URL(request.url).searchParams;
    const runId = p.get("runId");
    const driverId = p.get("driverId") || undefined;
    const tenantId = p.get("tenantId") || undefined;
    const shift = p.get("shift") || undefined;

    if (session.role === "DELIVERY_STAFF") {
      if (driverId && driverId !== session.sub) return Response.json(createErrorResponse("FORBIDDEN", "Drivers may only view their own runs"), { status: 403 });
    }
    if (tenantId && session.role !== "PLATFORM_ADMIN") assertTenant(session, tenantId);

    if (p.get("list") === "true") {
      const effectiveDriverId = session.role === "DELIVERY_STAFF" ? session.sub : driverId;
      const runs = await DeliveryEngine.listRunsAsync({ tenantId, driverId: effectiveDriverId, shift });
      return Response.json(createSuccessResponse(runs), { headers: { "Cache-Control": "private, no-store" }});
    }

    if (runId) {
      const run = await DeliveryEngine.getRunSheetAsync(runId);
      if (!run) return Response.json(createErrorResponse("NOT_FOUND", "Run sheet not found"), { status: 404 });
      if (session.role === "DELIVERY_STAFF" && run.driverId !== session.sub) return Response.json(createErrorResponse("FORBIDDEN", "This run does not belong to you"), { status: 403 });
      if (session.role === "VENDOR_ADMIN") assertTenant(session, run.tenantId);
      const safeRun = session.role === "DELIVERY_STAFF" ? maskRunForStaff(run) : run;
      return Response.json(createSuccessResponse(safeRun), { headers: { "Cache-Control": "private, no-store" }});
    }

    const latest = await DeliveryEngine.getLatestRunAsync({ tenantId, driverId: session.role === "DELIVERY_STAFF" ? session.sub : driverId });
    if (!latest) return Response.json(createErrorResponse("NOT_FOUND", "No active delivery runs found"), { status: 404 });
    const safeLatest = session.role === "DELIVERY_STAFF" ? maskRunForStaff(latest) : latest;
    return Response.json(createSuccessResponse(safeLatest), { headers: { "Cache-Control": "private, no-store" }});
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load delivery run"), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["DELIVERY_STAFF", "VENDOR_ADMIN", "PLATFORM_ADMIN"]);
    const validated = GenerateRunSheetInputSchema.parse(await request.json());
    if (session.role === "DELIVERY_STAFF" && validated.driverId !== session.sub) return Response.json(createErrorResponse("FORBIDDEN", "Drivers may only create their own run sheets"), { status: 403 });
    if (session.role !== "PLATFORM_ADMIN") assertTenant(session, validated.tenantId);
    return Response.json(createSuccessResponse(DeliveryEngine.generateRunSheet(validated)), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to generate delivery run"), { status: 500 });
  }
}