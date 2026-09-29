import { z } from "zod";

const DEV_JWT_SECRET = "dev-only-ruxs-jwt-secret-please-change";

const EnvSchema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PRIMARY_DOMAIN: z.string().default("ruxs.in"),
  DEFAULT_TIMEZONE: z.string().default("Asia/Kolkata"),
  DATABASE_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  WHATSAPP_APP_SECRET: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1).optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().min(32).optional(),
  JWT_SIGNING_SECRET: z.string().min(32).optional(),
}).superRefine((env, ctx) => {
  if (env.APP_ENV !== "development") {
    for (const [name, value] of [
      ["JWT_SIGNING_SECRET", env.JWT_SIGNING_SECRET],
      ["DATABASE_URL", env.DATABASE_URL],
      ["PAYMENT_WEBHOOK_SECRET", env.PAYMENT_WEBHOOK_SECRET],
    ] as const) {
      if (!value) ctx.addIssue({ code: "custom", path: [name], message: `${name} is required outside development` });
    }
  }
  if (env.APP_ENV === "production") {
    for (const [name, value] of [
      ["UPSTASH_REDIS_REST_URL", env.UPSTASH_REDIS_REST_URL],
      ["UPSTASH_REDIS_REST_TOKEN", env.UPSTASH_REDIS_REST_TOKEN],
      ["WHATSAPP_APP_SECRET", env.WHATSAPP_APP_SECRET],
      ["WHATSAPP_VERIFY_TOKEN", env.WHATSAPP_VERIFY_TOKEN],
    ] as const) {
      if (!value) ctx.addIssue({ code: "custom", path: [name], message: `${name} is required in production` });
    }
  }
}).transform((env) => ({
  ...env,
  JWT_SIGNING_SECRET: env.JWT_SIGNING_SECRET || DEV_JWT_SECRET,
}));

export type EnvConfig = z.infer<typeof EnvSchema>;

let cachedEnv: EnvConfig | null = null;

export function getEnv(overrideEnv?: Record<string, string | undefined>): EnvConfig {
  if (cachedEnv && !overrideEnv) return cachedEnv;
  const parsed = EnvSchema.safeParse(overrideEnv || (typeof process !== "undefined" ? process.env : {}));
  if (!parsed.success) {
    console.error("Environment Configuration Validation Failed:", parsed.error.format());
    throw new Error("Invalid runtime environment configuration");
  }
  if (!overrideEnv) cachedEnv = parsed.data;
  return parsed.data;
}
