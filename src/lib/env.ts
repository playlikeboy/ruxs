import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  HEXCLAVE_SECRET_SERVER_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
  CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE: z.string().optional(),
  CLOUDFLARE_EMAIL_TOKEN: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  EMAIL_DOMAIN: z.string().optional(),
  IMGBB_API_KEY: z.string().min(1).optional(),
});

import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getServerEnv() {
  let sourceEnv: Record<string, unknown> = { ...process.env };
  try {
    const { env } = getCloudflareContext();
    if (env) {
      sourceEnv = { ...sourceEnv, ...env };
    }
  } catch {
    // getCloudflareContext is only available inside request scope on OpenNext
  }

  const parsed = serverSchema.safeParse(sourceEnv);
  if (!parsed.success) {
    console.error("Invalid server environment variables:", parsed.error.format());
    throw new Error("Invalid server environment variables");
  }
  return parsed.data;
}
