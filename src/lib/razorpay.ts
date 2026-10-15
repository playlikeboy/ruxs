import "server-only";
import crypto from "crypto";
import { getServerEnv } from "@/lib/env";

/**
 * Minimal Razorpay client: create orders, refund payments, and verify the
 * signatures Razorpay sends to the browser and to our webhook.
 * Docs: https://razorpay.com/docs/api/
 */

function keys() {
  const env = getServerEnv();
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured");
  }
  return { keyId: env.RAZORPAY_KEY_ID, keySecret: env.RAZORPAY_KEY_SECRET, webhookSecret: env.RAZORPAY_WEBHOOK_SECRET };
}

export function razorpayKeyId(): string | null {
  return getServerEnv().RAZORPAY_KEY_ID ?? null;
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const { keyId, keySecret } = keys();
  const res = await fetch("https://api.razorpay.com/v1" + path, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) {
    throw new Error("Razorpay: " + (json.error?.description ?? `HTTP ${res.status}`));
  }
  return json;
}

export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) {
    throw new Error("Online payments must be at least ₹1");
  }
  return call("/orders", {
    amount: input.amountPaise,
    currency: "INR",
    receipt: input.receipt.slice(0, 40),
    notes: input.notes,
  });
}

export async function refundRazorpayPayment(paymentId: string, amountPaise: number, note: string) {
  return call<{ id: string; status: string }>(`/payments/${encodeURIComponent(paymentId)}/refund`, {
    amount: amountPaise,
    notes: { reason: note.slice(0, 250) },
  });
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Checkout success handler signature: HMAC-SHA256(order_id + "|" + payment_id, key secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto.createHmac("sha256", keys().keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC-SHA256(raw request body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = keys().webhookSecret;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
