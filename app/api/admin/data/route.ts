import { NextResponse } from "next/server";
import { AdminService } from "@/src/modules/admin/admin-service";
import { HouseholdService } from "@/src/modules/households/household-service";
import { FulfillmentStateMachine } from "@/src/modules/fulfillment/fulfillment-fsm";
import { FulfillmentGenerator } from "@/src/modules/fulfillment/fulfillment-generator";
import { VacationService } from "@/src/modules/vacation/vacation-service";
import { SubscriptionEngine } from "@/src/modules/subscriptions/subscription-engine";
import { DisputeService } from "@/src/modules/disputes/dispute-service";
import { CutoffEngine } from "@/src/modules/cutoff/cutoff-engine";
import { AssetLedgerService } from "@/src/modules/assets/asset-ledger";
import { KhataLedgerService } from "@/src/modules/khata/khata-ledger";
import { NotificationService } from "@/src/modules/notifications/notification-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { Paise } from "@/src/shared/types/money";
import { requireSession, requireRole } from "@/src/shared/auth/request";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["PLATFORM_ADMIN"]);

    const todayStr = new Date().toISOString().split("T")[0];

    // Live queries directly from Neon PostgreSQL
    const [vendors, auditLogs, rawHouseholds, disputes, assetHoldings] = await Promise.all([
      AdminService.listVendorsAsync(),
      AdminService.getAuditLogsAsync(40),
      HouseholdService.listHouseholdsAsync(),
      DisputeService.listAllAsync(),
      AssetLedgerService.listAllHoldingsAsync(),
    ]);

    // Compute live real khata balance dynamically per household
    const households = await Promise.all(
      rawHouseholds.map(async (h) => {
        const balancePaise = await KhataLedgerService.getBalance(h.primaryOwnerId);
        return {
          ...h,
          khataBalancePaise: balancePaise,
          activeSubscriptionsCount: 2,
        };
      })
    );

    const fulfillments = await FulfillmentStateMachine.listAllAsync();

    // Default kitchen batch aggregation for lunch shift
    const defaultVendorId = vendors[0]?.id || "ten_sharma_tiffin";
    const kitchenBatches = await CutoffEngine.getKitchenBatchCounterAsync(defaultVendorId, todayStr, "LUNCH");

    const overview = {
      totalVendors: vendors.length,
      verifiedVendors: vendors.filter((v) => v.status === "VERIFIED").length,
      pendingVendors: vendors.filter((v) => v.status === "PENDING_VERIFICATION" || v.status === "PENDING_APPROVAL").length,
      suspendedVendors: vendors.filter((v) => v.status === "SUSPENDED").length,
      totalHouseholds: households.length,
      todayDeliveriesCount: fulfillments.length,
      deliveredCount: fulfillments.filter((f) => f.status === "DELIVERED").length,
      inPrepCount: fulfillments.filter((f) => f.status === "IN_PREPARATION" || f.status === "CONFIRMED").length,
      skippedCount: fulfillments.filter((f) => f.status === "SKIPPED" || f.status === "LATE_SKIP").length,
      openDisputesCount: disputes.filter((d) => d.status === "OPEN").length,
      totalAssetHoldingsCount: assetHoldings.reduce((sum, a) => sum + a.holdingCount, 0),
      monthlyGmvPaise: 0 as Paise, // Replaced with live aggregation when payment analytics are enabled
      dbConnected: true,
      serviceDate: todayStr,
    };

    return NextResponse.json(
      createSuccessResponse({
        overview,
        vendors,
        households,
        fulfillments,
        disputes,
        assetHoldings,
        kitchenBatches,
        auditLogs,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch admin dashboard data"),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["PLATFORM_ADMIN"]);
    const adminUser = { userId: session.sub, email: session.phone };

    const body = ((await request.json().catch(() => ({}))) || {}) as any;
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json(createErrorResponse("VALIDATION_FAILED", "Action is required"), { status: 400 });
    }

    switch (action) {
      case "VERIFY_VENDOR": {
        const vendor = await AdminService.verifyVendorAsync(payload.vendorId, adminUser);
        return NextResponse.json(createSuccessResponse({ vendor, message: "Vendor verified and activated" }));
      }

      case "SUSPEND_VENDOR": {
        const vendor = await AdminService.suspendVendorAsync(payload.vendorId, payload.reason || "Administrative suspension", adminUser);
        return NextResponse.json(createSuccessResponse({ vendor, message: "Vendor suspended" }));
      }

      case "REACTIVATE_VENDOR": {
        const vendor = await AdminService.reactivateVendorAsync(payload.vendorId, adminUser);
        return NextResponse.json(createSuccessResponse({ vendor, message: "Vendor re-activated successfully" }));
      }

      case "CHANGE_TIER": {
        const vendor = await AdminService.updateVendorTierAsync(payload.vendorId, payload.tier, adminUser);
        return NextResponse.json(createSuccessResponse({ vendor, message: `Vendor plan tier updated to ${payload.tier}` }));
      }

      case "CREATE_VENDOR": {
        const categories = Array.isArray(payload.serviceCategories) ? payload.serviceCategories : ["TIFFIN"];
        const vendorType = categories.includes("MILK") ? "MILKMAN" : categories.includes("WATER") ? "WATER_SERVICE" : "TIFFIN";
        const newVendor = await AdminService.provisionVendorDirect({
          businessName: String(payload.businessName || ""),
          phone: String(payload.phone || ""),
          vendorType,
          locality: String(payload.locality || "Bengaluru"),
          city: String(payload.city || "Bengaluru"),
          coveredSocieties: Array.isArray(payload.coveredSocieties) && payload.coveredSocieties.length ? payload.coveredSocieties : ["Sobha Classic"],
          upiId: payload.upiId ? String(payload.upiId) : undefined,
          tier: payload.tier || "STARTER",
          typeConfig: payload.typeConfig || {},
        }, adminUser);
        return NextResponse.json(createSuccessResponse({ vendor: newVendor, message: "New vendor registered" }), { status: 201 });
      }

      case "TRIGGER_OVERNIGHT": {
        const date = payload.serviceDate || new Date().toISOString().split("T")[0];
        await VacationService.hydrate();
        const generated = await FulfillmentGenerator.generateForDateAsync(
          await (payload.tenantId && payload.tenantId !== "ALL"
            ? SubscriptionEngine.listByTenant(payload.tenantId)
            : SubscriptionEngine.listAllAsync()),
          { serviceDate: date, cutoffTimeStr: payload.cutoffTimeStr || "10:00", shift: payload.shift || "LUNCH" }
        );
        AdminService.logAction({
          adminUserId: adminUser.userId,
          adminEmail: adminUser.email,
          action: "OVERNIGHT_RUN_TRIGGERED",
          targetType: "FULFILLMENT_FSM",
          targetId: date,
          details: `Admin manually triggered overnight subscription fulfillment generation for ${date}`,
        });
        return NextResponse.json(
          createSuccessResponse({
            message: `Overnight fulfillment generation executed for ${date}`,
            fulfillments: generated,
          })
        );
      }

      case "TRANSITION_FULFILLMENT": {
        const f = await FulfillmentStateMachine.getByIdAsync(payload.fulfillmentId);
        if (!f) throw new Error(`Fulfillment ${payload.fulfillmentId} not found`);

        const transitionByStatus: Record<string, any> = {
          CONFIRMATION_REQUIRED: { action: "REQUEST_CONFIRMATION" },
          CONFIRMED: { action: "CONFIRM" },
          IN_PREPARATION: { action: "START_PREP" },
          OUT_FOR_DELIVERY: { action: "DISPATCH" },
          DELIVERED: { action: "MARK_DELIVERED" },
          FAILED: { action: "MARK_FAILED" },
          DISPUTED: { action: "DISPUTE" },
          CANCELLED: { action: "CANCEL" },
          SKIPPED: { action: "SKIP" },
          LATE_SKIP: { action: "SKIP" },
        };

        const action = transitionByStatus[payload.toStatus];
        if (!action) throw new Error(`Unsupported fulfillment target state: ${payload.toStatus}`);

        const updated = await FulfillmentStateMachine.transitionAsync(f, {
          ...action,
          notes: payload.notes,
          actionTime: new Date().toISOString(),
          driverId: session.sub,
        });

        AdminService.logAction({
          adminUserId: adminUser.userId,
          adminEmail: adminUser.email,
          action: "FULFILLMENT_TRANSITIONED",
          targetType: "FULFILLMENT",
          targetId: updated.id,
          details: `Admin transitioned fulfillment ${updated.id} to ${updated.status}`,
        });

        return NextResponse.json(createSuccessResponse({ fulfillment: updated, message: `Status transitioned to ${updated.status}` }));
      }

      case "LOCK_CUTOFF": {
        const date = payload.serviceDate || new Date().toISOString().split("T")[0];
        let totalLocked = 0;
        const allVendors = await AdminService.listVendorsAsync();
        const targetTenants = payload.tenantId && payload.tenantId !== "ALL"
          ? [payload.tenantId]
          : allVendors.map((v) => v.id);

        for (const tId of targetTenants) {
          const res = await CutoffEngine.lockExpiredCutoffsAsync(tId, date);
          totalLocked += res.lockedCount;
        }

        AdminService.logAction({
          adminUserId: adminUser.userId,
          adminEmail: adminUser.email,
          action: "CUTOFF_LOCKED",
          targetType: "CUTOFF_ENGINE",
          targetId: payload.tenantId || "ALL_VENDORS",
          details: `Admin executed cutoff lock for ${targetTenants.length} tenants on ${date}. Locked ${totalLocked} orders`,
        });

        return NextResponse.json(createSuccessResponse({ result: { lockedCount: totalLocked }, message: `Cutoff locked. ${totalLocked} orders updated.` }));
      }

      case "RESOLVE_DISPUTE": {
        const res = await DisputeService.resolveDispute(payload.disputeId, {
          decision: payload.decision, // "FULL_REFUND" | "PARTIAL_REFUND" | "UPHELD_NO_REFUND"
          refundPaise: payload.refundPaise || 0,
          resolutionNotes: payload.resolutionNotes || "Arbitrated and resolved by Platform Admin",
          resolvedBy: adminUser.email,
        });

        AdminService.logAction({
          adminUserId: adminUser.userId,
          adminEmail: adminUser.email,
          action: payload.decision === "UPHELD_NO_REFUND" ? "DISPUTE_UPHELD" : "DISPUTE_REFUNDED",
          targetType: "DISPUTE",
          targetId: payload.disputeId,
          details: `Dispute ${payload.disputeId} arbitrated with decision ${payload.decision} (Refund ₹${(payload.refundPaise || 0) / 100})`,
        });

        return NextResponse.json(createSuccessResponse({ result: res, message: `Dispute arbitrated: ${payload.decision}` }));
      }

      case "RECORD_ASSET_EXCHANGE": {
        if (!payload.tenantId || !payload.customerId || !payload.assetType) {
          return NextResponse.json(createErrorResponse("VALIDATION_FAILED", "tenantId, customerId, and assetType are required"), { status: 400 });
        }
        const exchange = await AssetLedgerService.recordExchange({
          tenantId: payload.tenantId,
          customerId: payload.customerId,
          assetType: payload.assetType,
          quantityDelivered: payload.quantityDelivered || 0,
          quantityCollected: payload.quantityCollected || 0,
          driverStaffId: session.sub,
        });

        AdminService.logAction({
          adminUserId: adminUser.userId,
          adminEmail: adminUser.email,
          action: "ASSET_EXCHANGE_RECORDED",
          targetType: "ASSET_LEDGER",
          targetId: `${payload.customerId}:${payload.assetType}`,
          details: `Doorstep exchange recorded: Delivered ${payload.quantityDelivered}, Collected ${payload.quantityCollected} (${payload.assetType})`,
        });

        return NextResponse.json(createSuccessResponse({ exchange, message: "Asset container exchange recorded" }));
      }

      case "ADD_KHATA_ENTRY": {
        const defaultVendorId = (await AdminService.listVendorsAsync())[0]?.id;
        const tenantId = payload.tenantId || defaultVendorId;
        if (!tenantId || !payload.customerId || !payload.direction || !payload.amountPaise) {
          return NextResponse.json(createErrorResponse("VALIDATION_FAILED", "tenantId, customerId, direction, and amountPaise are required"), { status: 400 });
        }
        const entry = await KhataLedgerService.recordEntry({
          tenantId,
          customerId: payload.customerId,
          entryType: payload.direction === "CREDIT" ? "PAYMENT_RECEIVED" : "DELIVERY_CHARGE",
          direction: payload.direction, // "CREDIT" | "DEBIT"
          amountPaise: (payload.amountPaise || 10000) as Paise,
          referenceType: "MANUAL_ADJUSTMENT",
          referenceId: `adj_${Date.now()}`,
          notes: payload.notes || "Manual administrative khata balance adjustment",
        });

        AdminService.logAction({
          adminUserId: adminUser.userId,
          adminEmail: adminUser.email,
          action: "KHATA_ADJUSTMENT_POSTED",
          targetType: "KHATA_LEDGER",
          targetId: entry.id,
          details: `Manual Khata ${payload.direction} of ₹${(payload.amountPaise || 10000) / 100} applied to customer ${payload.customerId}`,
        });

        return NextResponse.json(createSuccessResponse({ entry, message: `Khata ${payload.direction} recorded` }));
      }

      case "DISPATCH_NOTIFICATION": {
        const defaultVendorId = (await AdminService.listVendorsAsync())[0]?.id;
        const tenantId = payload.tenantId || defaultVendorId;
        if (!tenantId || !payload.customerId || !payload.phone) {
          return NextResponse.json(createErrorResponse("VALIDATION_FAILED", "tenantId, customerId, and phone are required"), { status: 400 });
        }
        const notif = await NotificationService.dispatchNotification({
          tenantId,
          customerId: payload.customerId,
          recipientPhone: payload.phone || "+919876543212",
          eventType: "DAILY_POLL",
          params: payload.data || { cutoffTime: "10:00 AM", name: "Priya Sharma", serviceName: "Homestyle Lunch Thali" },
          whatsappOptIn: payload.channel !== "SMS",
        });

        AdminService.logAction({
          adminUserId: adminUser.userId,
          adminEmail: adminUser.email,
          action: "NOTIFICATION_DISPATCHED",
          targetType: "NOTIFICATION_ENGINE",
          targetId: notif.id,
          details: `Test ${payload.channel || "WHATSAPP"} notification dispatched to ${payload.phone || "+919876543212"}`,
        });

        return NextResponse.json(createSuccessResponse({ notif, message: "Notification dispatched successfully" }));
      }

      default:
        return NextResponse.json(createErrorResponse("VALIDATION_FAILED", `Unknown admin action: ${action}`), {
          status: 400,
        });
    }
  } catch (error: any) {
    return NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to execute admin action"),
      { status: 500 }
    );
  }
}
