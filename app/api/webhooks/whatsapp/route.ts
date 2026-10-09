import { WhatsAppGateway } from "@/src/modules/whatsapp/whatsapp-gateway";
import { createErrorResponse } from "@/src/shared/errors";
import { getEnv } from "@/src/shared/config/env";

import { checkRateLimit, getClientIp } from "@/src/shared/utils/rate-limit";

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  try {
    const expectedToken = getEnv().WHATSAPP_VERIFY_TOKEN;
    if (mode === "subscribe" && expectedToken && token && constantTimeEqual(token, expectedToken)) {
      return new Response(challenge || "", { status: 200 });
    }
  } catch {}
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers);
    const ipLimit = await checkRateLimit(`wa_wh_ip:${ip}`, 100, 60);
    if (!ipLimit.allowed) {
      return Response.json(createErrorResponse("RATE_LIMITED", "Too many webhook requests"), { status: 429 });
    }

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
