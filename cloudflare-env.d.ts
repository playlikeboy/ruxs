// Cloudflare Environment types for ruxs

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface ScheduledEvent {
  readonly scheduledTime: number;
  readonly cron: string;
  readonly type: string;
}

interface ExportedHandler<Env = unknown> {
  fetch?: (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response> | Response;
  scheduled?: (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => Promise<void> | void;
}

interface Hyperdrive {
  connectionString: string;
}

interface Fetcher {
  fetch: typeof fetch;
}

interface __BaseEnv_CloudflareEnv {
  HYPERDRIVE: Hyperdrive;
  IMAGES: any;
  ASSETS: Fetcher;
  NEXT_PUBLIC_APP_URL: "https://ruxs.in";
  HEXCLAVE_SECRET_SERVER_KEY: string;
  CRON_SECRET: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;
}

declare namespace Cloudflare {
  interface GlobalProps {
    mainModule: typeof import("./custom-worker");
  }
  interface Env extends __BaseEnv_CloudflareEnv {}
}

interface CloudflareEnv extends __BaseEnv_CloudflareEnv {}
