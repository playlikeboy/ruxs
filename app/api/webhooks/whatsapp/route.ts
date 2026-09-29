import { WhatsAppGateway } from "@/src/modules/whatsapp/whatsapp-gateway";
import { createErrorResponse } from "@/src/shared/errors";
import { getEnv } from "@/src/shared/config/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  try {
    const expectedToken = getEnv().WHATSAPP_VERIFY_TOKEN;
    if (mode === "subscribe" && expectedToken && token === expectedToken) {
      return new Response(challenge || "", { status: 200 });
    }
  } catch {}
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const rawPayload = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    const env = getEnv();

    if (!signature || !env.WHATSAPP_APP_SECRET) {
      return Response.json(createErrorResponse("FORBIDDEN", "Webhook signature required"), { status: 403 });
    }

    if (!await WhatsAppGateway.verifyMetaSignature(rawPayload, signature, env.WHATSAPP_APP_SECRET)) {
      return Response.json(createErrorResponse("FORBIDDEN", "Invalid Meta webhook signature"), { status: 403 });
    }

    const payload = JSON.parse(rawPayload);
    const result = await WhatsAppGateway.processInboundWebhook(payload);
    return new Response(JSON.stringify({ status: "ok", ...result }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("WhatsApp webhook processing error", error);
    return new Response(JSON.stringify({ status: "error" }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}
