import { normalizeIndianPhone } from "./phone";

interface StoredOtp { code: string; expiresAt: number; attempts: number; }

const otpStore = new Map<string, StoredOtp>();
const rateLimitStore = new Map<string, number[]>();

export const DEMO_USERS = [
  { role: "PLATFORM_ADMIN" as const, phone: "9999900001", label: "Development Admin", description: "Development-only account", redirect: "/admin" },
  { role: "VENDOR_ADMIN" as const, phone: "9876543210", label: "Development Vendor", description: "Development-only account", redirect: "/vendor/dashboard" },
  { role: "DELIVERY_STAFF" as const, phone: "9876543211", label: "Development Driver", description: "Development-only account", redirect: "/delivery" },
  { role: "CUSTOMER" as const, phone: "9876543212", label: "Development Customer", description: "Development-only account", redirect: "/app" },
];
export const MASTER_DEMO_OTP = "123456";

const redisConfigured = () => Boolean(
  typeof process !== "undefined" &&
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

async function redisCommand<T = unknown>(command: string, args: Array<string | number>): Promise<T | null> {
  const url = typeof process !== "undefined" ? process.env.UPSTASH_REDIS_REST_URL : undefined;
  const token = typeof process !== "undefined" ? process.env.UPSTASH_REDIS_REST_TOKEN : undefined;
  if (!url || !token) return null;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([command, ...args]),
  });
  if (!response.ok) throw new Error("OTP storage unavailable");
  const data = await response.json() as { result?: T; error?: string };
  if (data.error) throw new Error("OTP storage unavailable");
  return data.result ?? null;
}

export function generateRandomOtp(): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(100000 + (values[0] % 900000));
}

export async function requestPhoneOtp(rawPhone: string, options?: { fixedCode?: string; isDev?: boolean }) {
  const phone = normalizeIndianPhone(rawPhone);
  const now = Date.now();
  const isDev = options?.isDev ?? (process.env.NODE_ENV !== "production" || !redisConfigured());
  const isDemo = isDev && DEMO_USERS.some((u) => normalizeIndianPhone(u.phone) === phone);

  if (!isDev && !redisConfigured()) throw new Error("OTP infrastructure is not configured");

  if (isDev) {
    const recent = (rateLimitStore.get(phone) || []).filter((t) => now - t < 15 * 60 * 1000);
    if (recent.length >= 3 && !isDemo) throw new Error("Too many OTP requests. Please wait 15 minutes before requesting again.");
    recent.push(now);
    rateLimitStore.set(phone, recent);
  } else {
    const count = Number(await redisCommand<number>("INCR", [`ruxs:otp:rate:${phone}`]) || 0);
    if (count === 1) await redisCommand("EXPIRE", [`ruxs:otp:rate:${phone}`, 900]);
    if (count > 3) throw new Error("Too many OTP requests. Please wait 15 minutes before requesting again.");
  }

  const code = options?.fixedCode || (isDemo ? MASTER_DEMO_OTP : generateRandomOtp());
  const expiresAt = now + 5 * 60 * 1000;
  const record = { code, expiresAt, attempts: 0 };

  if (isDev) otpStore.set(phone, record);
  else await redisCommand("SET", [`ruxs:otp:${phone}`, JSON.stringify(record), "EX", 300]);

  return { phone, expiresAt, debugCode: isDev ? code : undefined };
}

export async function verifyPhoneOtp(rawPhone: string, submittedCode: string, options?: { isDev?: boolean }): Promise<boolean> {
  const phone = normalizeIndianPhone(rawPhone);
  const isDev = options?.isDev ?? (process.env.NODE_ENV !== "production" || !redisConfigured());
  if (!isDev && !redisConfigured()) return false;

  if (isDev && submittedCode === MASTER_DEMO_OTP && DEMO_USERS.some((u) => normalizeIndianPhone(u.phone) === phone)) {
    otpStore.delete(phone);
    return true;
  }

  let record: StoredOtp | null = null;
  if (isDev) {
    record = otpStore.get(phone) || null;
  } else {
    const value = await redisCommand<string>("GET", [`ruxs:otp:${phone}`]);
    if (value) {
      try { record = JSON.parse(value) as StoredOtp; } catch { record = null; }
    }
  }

  if (!record || Date.now() > record.expiresAt) {
    if (isDev) otpStore.delete(phone);
    else await redisCommand("DEL", [`ruxs:otp:${phone}`]);
    return false;
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    if (isDev) otpStore.delete(phone);
    else await redisCommand("DEL", [`ruxs:otp:${phone}`]);
    return false;
  }

  const valid = record.code === submittedCode;
  if (isDev) {
    if (valid) otpStore.delete(phone); else otpStore.set(phone, record);
  } else if (valid) {
    await redisCommand("DEL", [`ruxs:otp:${phone}`]);
  } else {
    await redisCommand("SET", [`ruxs:otp:${phone}`, JSON.stringify(record), "EX", 300]);
  }
  return valid;
}
