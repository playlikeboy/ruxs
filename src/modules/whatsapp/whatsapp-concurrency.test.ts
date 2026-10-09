import { describe, it, expect, beforeEach } from "bun:test";
import { WhatsAppGateway } from "./whatsapp-gateway";
import { FulfillmentStateMachine } from "../fulfillment/fulfillment-fsm";

describe("WhatsApp Inbound Deduplication & Concurrency", () => {
  beforeEach(() => {
    WhatsAppGateway.clearStore();
    FulfillmentStateMachine.clearStore();
  });

  it("safely deduplicates concurrent identical message events from Meta webhook", async () => {
    const fulfillment = {
      id: "ful_test_whatsapp_conc",
      tenantId: "ten_sharma_tiffin",
      subscriptionId: "sub_1",
      customerId: "usr_priya",
      serviceDate: "2026-09-12",
      shift: "LUNCH" as any,
      status: "CONFIRMATION_REQUIRED" as any,
      items: [
        {
          productId: "prod_1",
          productName: "Veg Thali",
          quantity: 1,
          unitPricePaise: 12000 as any,
          totalPricePaise: 12000 as any,
        },
      ],
      totalPricePaise: 12000 as any,
      cutoffTime: "2026-09-12T10:00:00.000Z",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    FulfillmentStateMachine.save(fulfillment);

    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "wh_entry_1",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "919876543210", phone_number_id: "pn_1" },
                messages: [
                  {
                    from: "919876543210",
                    id: "wamid.duplicate.message.999",
                    timestamp: "1726113600",
                    type: "interactive",
                    interactive: {
                      type: "button_reply",
                      button_reply: { id: `CONFIRM_${fulfillment.id}`, title: "Deliver Today" },
                    },
                  },
                ],
              },
              field: "messages",
            },
          ],
        },
      ],
    };

    // Simulate 3 concurrent deliveries of the exact same event
    const results = await Promise.all([
      WhatsAppGateway.processInboundWebhook(payload),
      WhatsAppGateway.processInboundWebhook(payload),
      WhatsAppGateway.processInboundWebhook(payload),
    ]);

    const totalProcessed = results.reduce((sum, r) => sum + r.processedCount, 0);
    expect(totalProcessed).toBe(1);

    const updated = FulfillmentStateMachine.getById(fulfillment.id);
    expect(updated?.status).toBe("CONFIRMED");
  });
});
