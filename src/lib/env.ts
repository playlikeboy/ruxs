import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://ruxs.in"),
  NEXT_PUBLIC_HEXCLAVE_API_URL: z.string().url().default("https://api.hexclave.com"),
  NEXT_PUBLIC_HEXCLAVE_PROJECT_ID: z.string().min(1).default("afdff151-7a3c-49b3-830f-abfcc23d8d61"),
});

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  HEXCLAVE_SECRET_SERVER_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  ADMIN_USER_IDS: z.string().default(""),
  CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE: z.string().optional(),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_HEXCLAVE_API_URL: process.env.NEXT_PUBLIC_HEXCLAVE_API_URL,
  NEXT_PUBLIC_HEXCLAVE_PROJECT_ID: process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID,
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
