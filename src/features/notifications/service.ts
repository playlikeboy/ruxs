import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { getServerEnv } from "@/lib/env";
import { escapeHtml, safeHttpUrl } from "@/core/html";
import type { NotificationCategory } from "./types";

const DEFAULT_CF_ACCOUNT_ID = "02e7b7636139de49a9b2ae68293d8f89";
const EMAIL_DOMAIN = "notifications.ruxs.in";

export const CATEGORY_SENDERS: Record<NotificationCategory, string> = {
  orders: `orders@${EMAIL_DOMAIN}`,
  plans: `plans@${EMAIL_DOMAIN}`,
  bills: `bills@${EMAIL_DOMAIN}`,
  reviews: `reviews@${EMAIL_DOMAIN}`,
  welcome: `welcome@${EMAIL_DOMAIN}`,
  alerts: `alerts@${EMAIL_DOMAIN}`,
};

export function renderEmailHtml({
  heading,
  lead,
  details,
  actionText,
  actionUrl,
}: {
  heading: string;
  lead: string;
  details?: { label: string; value: string }[];
  actionText?: string;
  actionUrl?: string;
}): string {
  heading = escapeHtml(heading);
  lead = escapeHtml(lead);
  details = details?.map((d) => ({ label: escapeHtml(d.label), value: escapeHtml(d.value) }));
  const safeUrl = actionUrl ? safeHttpUrl(actionUrl) : null;
  const detailsHtml = details && details.length
    ? `<div style="margin: 20px 0; background: #fafaf7; border-radius: 12px; padding: 16px; border: 1px solid #e7e5df;">
        ${details
          .map(
            (d) =>
              `<div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                <span style="color: #6b6862;">${d.label}</span>
                <strong style="color: #1c1b19;">${d.value}</strong>
              </div>`
          )
          .join("")}
      </div>`
    : "";

  const actionHtml = actionText && safeUrl
    ? `<div style="margin: 24px 0;">
        <a href="${escapeHtml(safeUrl)}" style="background: #1c1b19; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block;">
          ${escapeHtml(actionText)}
        </a>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafaf7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1b19;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafaf7; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #ffffff; border-radius: 16px; border: 1px solid #e7e5df; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #f0eee6; background: #ffffff;">
              <table width="100%">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #1c1b19;">RUXs</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; color: #6b6862; background: #f0eee6; padding: 4px 8px; border-radius: 6px; font-weight: 500;">Household OS</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; line-height: 1.3; color: #1c1b19; letter-spacing: -0.3px;">${heading}</h1>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5; color: #403e39;">${lead}</p>
              ${detailsHtml}
              ${actionHtml}
              <hr style="border: none; border-top: 1px solid #e7e5df; margin: 28px 0 20px;">
              <p style="margin: 0; font-size: 12px; line-height: 1.4; color: #8c8980;">
                You received this email because you are registered with RUXs. You can manage your notification preferences anytime under <a href="https://ruxs.in/app/account" style="color: #bd4b2a; text-decoration: none;">Account Settings</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendEmail({
  to,
  fromType = "welcome",
  subject,
  html,
  text,
}: {
  to: string;
  fromType?: NotificationCategory;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  try {
    const env = getServerEnv();
    const token = env.CLOUDFLARE_EMAIL_TOKEN || process.env.CLOUDFLARE_EMAIL_TOKEN;
    const accountId = env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || DEFAULT_CF_ACCOUNT_ID;
    const from = CATEGORY_SENDERS[fromType] || `welcome@${EMAIL_DOMAIN}`;

    if (!token) {
      console.warn("Cloudflare email sending token not configured; skipping email.");
      return { ok: false, error: "token_missing" };
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        from,
        subject,
        html,
        text,
      }),
    });

    const data = (await res.json()) as {
      success: boolean;
      errors?: { message: string }[];
      result?: { message_id?: string };
    };

    if (!res.ok || !data.success) {
      const err = data.errors?.[0]?.message ?? `HTTP ${res.status}`;
      console.error("Cloudflare email send error:", err);
      return { ok: false, error: err };
    }

    return { ok: true, messageId: data.result?.message_id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Failed to send notification email:", errorMsg);
    return { ok: false, error: errorMsg };
  }
}

/** Sends an email to a user only if their notification preferences allow it. */
export async function sendUserEmailIfAllowed({
  userId,
  to,
  category,
  subject,
  html,
  text,
}: {
  userId: string;
  to: string;
  category: NotificationCategory;
  subject: string;
  html: string;
  text: string;
}) {
  const db = getDb();
  const [pref] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (pref) {
    if (category === "orders" && !pref.emailOrders) return { ok: false, error: "opted_out" };
    if (category === "plans" && !pref.emailPlans) return { ok: false, error: "opted_out" };
    if (category === "bills" && !pref.emailBills) return { ok: false, error: "opted_out" };
    if (category === "reviews" && !pref.emailReviews) return { ok: false, error: "opted_out" };
  }

  return sendEmail({ to, fromType: category, subject, html, text });
}
