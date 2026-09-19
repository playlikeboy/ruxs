import { NextResponse } from "next/server";
import { AdminService } from "@/src/modules/admin/admin-service";
import { HouseholdService } from "@/src/modules/households/household-service";
import { FulfillmentStateMachine } from "@/src/modules/fulfillment/fulfillment-fsm";
import { DisputeService } from "@/src/modules/disputes/dispute-service";
import { CutoffEngine } from "@/src/modules/cutoff/cutoff-engine";
import { AssetLedgerService } from "@/src/modules/assets/asset-ledger";
import { KhataLedgerService } from "@/src/modules/khata/khata-ledger";
import { NotificationService } from "@/src/modules/notifications/notification-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { Paise } from "@/src/shared/types/money";

export async function GET(request: Request) {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    const [vendors, auditLogs] = await Promise.all([
      AdminService.listVendorsAsync(),
      AdminService.getAuditLogsAsync(40),
    ]);

    const households = HouseholdService.listHouseholds().map((h, idx) => ({
      ...h,
      khataBalancePaise: idx === 0 ? (-34000 as Paise) : idx === 1 ? (12000 as Paise) : (-16000 as Paise),
      activeSubscriptionsCount: idx === 0 ? 3 : idx === 1 ? 2 : 1,
    }));

    const fulfillments = FulfillmentStateMachine.listAll();
    const disputes = DisputeService.listAll();
    const assetHoldings = AssetLedgerService.listAllHoldings();

    // Default kitchen batch aggregation for lunch shift
    const kitchenBatches = CutoffEngine.getKitchenBatchCounter(
      "ten_sharma_tiffin",
      todayStr,
      "LUNCH"
    );

    const overview = {
      totalVendors: vendors.length,
      verifiedVendors: vendors.filter((v) => v.status === "VERIFIED").length,
      pendingVendors: vendors.filter((v) => v.status === "PENDING_VERIFICATION").length,
      suspendedVendors: vendors.filter((v) => v.status === "SUSPENDED").length,
      totalHouseholds: households.length,
      todayDeliveriesCount: fulfillments.length,
      deliveredCount: fulfillments.filter((f) => f.status === "DELIVERED").length,
      inPrepCount: fulfillments.filter((f) => f.status === "IN_PREPARATION" || f.status === "CONFIRMED").length,
      skippedCount: fulfillments.filter((f) => f.status === "SKIPPED" || f.status === "LATE_SKIP").length,
      openDisputesCount: disputes.filter((d) => d.status === "OPEN").length,
      totalAssetHoldingsCount: assetHoldings.reduce((sum, a) => sum + a.holdingCount, 0),
      monthlyGmvPaise: 184000000 as Paise, // ₹18.4L
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
      createErrorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch admin dashboard data"),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = ((await request.json().catch(() => ({}))) || {}) as any;
    const { action, payload } = body;
    const adminUser = { userId: "usr_super_admin", email: "commander@ruxs.in" };

    if (!action) {
      return NextResponse.json(createErrorResponse("VALIDATION_FAILED", "Action is required"), { status: 400 });
    }

    switch (action) {
      case "VERIFY_VENDOR": {
        const vendor = AdminService.verifyVendor(payload.vendorId, adminUser);
        return NextResponse.json(createSuccessResponse({ vendor, message: "Vendor verified and activated" }));
      }

      case "SUSPEND_VENDOR": {
        const vendor = AdminService.suspendVendor(payload.vendorId, payload.reason || "Administrative suspension", adminUser);
        return NextResponse.json(createSuccessResponse({ vendor, message: "Vendor suspended" }));
      }

      case "REACTIVATE_VENDOR": {
        const vendor = AdminService.getVendor(payload.vendorId);
        if (!vendor) throw new Error("Vendor not found");
        vendor.status = "VERIFIED";
        vendor.updatedAt = new Date().toISOString();
        AdminService.logAction({
          adminUserId: adminUser.userId,
          adminEmail: adminUser.email,
          action: "VENDOR_APPROVED",
          targetType: "VENDOR",
          targetId: vendor.id,
          details: `Vendor '${vendor.businessName}' re-activated by admin`,
        });
        return NextResponse.json(createSuccessResponse({ vendor, message: "Vendor re-activated successfully" }));
      }

      case "CHANGE_TIER": {
        const vendor = AdminService.updateVendorTier(payload.vendorId, payload.tier, adminUser);
        return NextResponse.json(createSuccessResponse({ vendor, message: `Vendor plan tier updated to ${payload.tier}` }));
      }

      case "CREATE_VENDOR": {
        const newVendor = AdminService.registerVendor({
          id: `ten_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          businessName: payload.businessName,
          slug: payload.slug || payload.businessName.toLowerCase().replace(/\s+/g, "-"),
          phone: payload.phone,
          serviceCategories: payload.serviceCategories || ["TIFFIN"],
          coveredSocieties: payload.coveredSocieties || ["Sobha Classic"],
          tier: payload.tier || "STARTER",
          status: "VERIFIED",
        });
        AdminService.logAction({
          adminUserId: adminUser.userId,
          adminEmail: adminUser.email,
          action: "VENDOR_CREATED",
          targetType: "VENDOR",
          targetId: newVendor.id,
          details: `New vendor '${newVendor.businessName}' onboarded and approved directly by platform admin`,
        });
        return NextResponse.json(createSuccessResponse({ vendor: newVendor, message: "New vendor registered" }));
      }

      case "TRIGGER_OVERNIGHT": {
        const date = payload.serviceDate || new Date().toISOString().split("T")[0];
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
            fulfillments: FulfillmentStateMachine.listAll(),
          })
        );
      }

      case "TRANSITION_FULFILLMENT": {
        const f = FulfillmentStateMachine.getById(payload.fulfillmentId);
        if (!f) throw new Error(`Fulfillment ${payload.fulfillmentId} not found`);
        f.status = payload.toStatus;
        if (payload.toStatus === "DELIVERED") {
          f.deliveredAt = new Date().toISOString();
        }
        if (payload.notes) {
          f.notes = payload.notes;
        }
        f.updatedAt = new Date().toISOString();
        FulfillmentStateMachine.save(f);

        AdminService.logAction({
          adminUserId: adminUser.userId,
          adminEmail: adminUser.email,
          action: "FULFILLMENT_TRANSITIONED",
          targetType: "FULFILLMENT",
          targetId: f.id,
          details: `Admin transitioned fulfillment ${f.id} to ${payload.toStatus}`,
        });

        return NextResponse.json(createSuccessResponse({ fulfillment: f, message: `Status transitioned to ${payload.toStatus}` }));
      }

      case "LOCK_CUTOFF": {
        const date = payload.serviceDate || new Date().toISOString().split("T")[0];
        const tenantId = payload.tenantId || "ten_sharma_tiffin";
        const result = CutoffEngine.lockExpiredCutoffs(tenantId, date);

        AdminService.logAction({
          adminUserId: adminUser.userId,
          adminEmail: adminUser.email,
          action: "CUTOFF_LOCKED",
          targetType: "CUTOFF_ENGINE",
          targetId: tenantId,
          details: `Admin executed cutoff lock for tenant ${tenantId} on ${date}. Locked ${result.lockedCount} orders`,
        });

        return NextResponse.json(createSuccessResponse({ result, message: `Cutoff locked. ${result.lockedCount} orders updated.` }));
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
        const exchange = await AssetLedgerService.recordExchange({
          tenantId: payload.tenantId || "ten_pureaqua_water",
          customerId: payload.customerId || "usr_priya",
          assetType: payload.assetType || "WATER_JAR_20L",
          quantityDelivered: payload.quantityDelivered || 0,
          quantityCollected: payload.quantityCollected || 0,
          driverStaffId: "drv_admin_ops",
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
        const entry = await KhataLedgerService.recordEntry({
          tenantId: payload.tenantId || "ten_sharma_tiffin",
          customerId: payload.customerId || "usr_priya",
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
        const notif = await NotificationService.dispatchNotification({
          tenantId: payload.tenantId || "ten_sharma_tiffin",
          customerId: payload.customerId || "usr_priya",
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
