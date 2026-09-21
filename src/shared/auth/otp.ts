import { normalizeIndianPhone } from "./phone";

interface StoredOtp {
  code: string;
  expiresAt: number;
  attempts: number;
}

// In-memory OTP store (Redis fallback in prod)
const otpStore = new Map<string, StoredOtp>();

// Rate limit tracker: phone -> request timestamps
const rateLimitStore = new Map<string, number[]>();

export const DEMO_USERS = [
  {
    role: "PLATFORM_ADMIN" as const,
    phone: "9999900001",
    label: "Platform Super Admin",
    description: "Full platform oversight, vendor approvals, dispute arbitration & audit trail",
    redirect: "/admin",
  },
  {
    role: "VENDOR_ADMIN" as const,
    phone: "9876543210",
    label: "Vendor Hub (Sharma Tiffin & Milk)",
    description: "Production batches, delivery run sheets, service catalog & subscriber khata",
    redirect: "/vendor/dashboard",
  },
  {
    role: "DELIVERY_STAFF" as const,
    phone: "9876543211",
    label: "Delivery Driver (Ramesh Fleet)",
    description: "Elevator-ordered run sheets, 1-tap doorstep drops & container swaps",
    redirect: "/delivery",
  },
  {
    role: "CUSTOMER" as const,
    phone: "9876543212",
    label: "Household Flat (Priya S. - Tower B-402)",
    description: "Recurring subscriptions, morning cutoff polls, vacation pauses & digital khata",
    redirect: "/app",
  },
];

export const MASTER_DEMO_OTP = "123456";

export function generateRandomOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Requests an OTP for an Indian phone number.
 * Enforces rate limiting: Max 3 requests per 15 minutes.
 */
export async function requestPhoneOtp(
  rawPhone: string,
  options?: { fixedCode?: string; isDev?: boolean }
): Promise<{ phone: string; expiresAt: number; debugCode?: string }> {
  const phone = normalizeIndianPhone(rawPhone);
  const now = Date.now();

  const isDemo =
    DEMO_USERS.some((u) => normalizeIndianPhone(u.phone) === phone) ||
    phone.startsWith("+9199999") ||
    options?.isDev;

  // Check rate limit (bypassed for demo users)
  const timestamps = rateLimitStore.get(phone) || [];
  const recentTimestamps = timestamps.filter((t) => now - t < 15 * 60 * 1000); // last 15 mins

  if (recentTimestamps.length >= 3 && !isDemo) {
    throw new Error("Too many OTP requests. Please wait 15 minutes before requesting again.");
  }

  recentTimestamps.push(now);
  rateLimitStore.set(phone, recentTimestamps);

  const code = options?.fixedCode || (isDemo ? MASTER_DEMO_OTP : generateRandomOtp());
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes TTL

  otpStore.set(phone, {
    code,
    expiresAt,
    attempts: 0,
  });

  return {
    phone,
    expiresAt,
    debugCode: options?.fixedCode || (isDemo ? MASTER_DEMO_OTP : undefined),
  };
}

/**
 * Verifies a submitted OTP against the stored code.
 */
export async function verifyPhoneOtp(
  rawPhone: string,
  submittedCode: string,
  options?: { isDev?: boolean }
): Promise<boolean> {
  const phone = normalizeIndianPhone(rawPhone);
  const isDemo =
    DEMO_USERS.some((u) => normalizeIndianPhone(u.phone) === phone) ||
    phone.startsWith("+9199999") ||
    options?.isDev;

  // For demo accounts or development mode, permit master code 123456
  if (isDemo && submittedCode === MASTER_DEMO_OTP) {
    otpStore.delete(phone);
    return true;
  }

  const record = otpStore.get(phone);

  if (!record) {
    return false;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return false;
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(phone);
    throw new Error("Too many invalid attempts. OTP invalidated.");
  }

  if (record.code === submittedCode) {
    otpStore.delete(phone); // Single-use consumption
    return true;
  }

  return false;
}
