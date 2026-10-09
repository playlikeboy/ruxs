/**
 * Distributed Rate Limiting with Upstash Redis and Sliding Window in-memory fallback
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

const memoryRateLimitStore = new Map<string, { count: number; expiresAt: number }>();

function isRedisConfigured(): boolean {
  return Boolean(
    typeof process !== "undefined" &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

async function redisCommand<T = unknown>(command: string, args: Array<string | number>): Promise<T | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([command, ...args]),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { result?: T };
    return data.result ?? null;
  } catch {
    return null;
  }
}

/**
 * Checks rate limit for a given key (e.g. IP, phone, tenant)
 * @param key Unique key to rate limit
 * @param limit Max allowed requests within window
 * @param windowSeconds Window duration in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const redisKey = `ruxs:ratelimit:${key}`;

  if (isRedisConfigured()) {
    try {
      const current = await redisCommand<number>("INCR", [redisKey]);
      if (current !== null) {
        if (current === 1) {
          await redisCommand("EXPIRE", [redisKey, windowSeconds]);
        }
        const ttl = (await redisCommand<number>("TTL", [redisKey])) ?? windowSeconds;
        const allowed = current <= limit;
        return {
          allowed,
          remaining: Math.max(0, limit - current),
          resetSeconds: Math.max(0, ttl),
        };
      }
    } catch {
      // Fallback to in-memory on redis failure
    }
  }

  // In-memory sliding window fallback
  const now = Date.now();
  const record = memoryRateLimitStore.get(key);

  if (!record || record.expiresAt <= now) {
    memoryRateLimitStore.set(key, {
      count: 1,
      expiresAt: now + windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetSeconds: windowSeconds,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, limit - record.count);
  const resetSeconds = Math.max(0, Math.ceil((record.expiresAt - now) / 1000));

  return {
    allowed: record.count <= limit,
    remaining,
    resetSeconds,
  };
}

/**
 * Helper to get client IP from request headers
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}
