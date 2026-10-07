import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = { allowed: boolean; remaining: number };

// Keys must be scoped per route (`orders-create:${ip}`): one counter per key, so a
// bare IP key would let search/address lookups use up the checkout allowance.

// ── Upstash (shared across serverless instances) ─────────────────────────────
// Vercel's Upstash integration creates KV_REST_API_*; a manual setup uses UPSTASH_REDIS_REST_*.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

// No retries: a slow Redis should fail open quickly, not stall the request.
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken, retry: false }) : null;

// One limiter per limit/window pair. Module scope so the ephemeral cache survives
// between invocations of a warm instance and rejects known-blocked keys without a Redis call.
const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const id = `${limit}:${windowMs}`;
  let limiter = limiters.get(id);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "rl",
      ephemeralCache: new Map(),
      timeout: 1000,
      analytics: false,
    });
    limiters.set(id, limiter);
  }
  return limiter;
}

// ── In-memory fallback (local dev, previews, or no Upstash configured) ──────
// Per-instance only: on Vercel each function instance keeps its own counts.
type Entry = { count: number; reset: number };

const store = new Map<string, Entry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.reset) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

function rateLimitInMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (!redis) return rateLimitInMemory(key, limit, windowMs);

  try {
    // On timeout Upstash resolves with success: true, so a slow Redis also fails open.
    const { success, remaining } = await getLimiter(limit, windowMs).limit(key);
    return { allowed: success, remaining };
  } catch (err) {
    // Fail open: a Redis outage must not block checkout.
    console.error("[rate-limit] redis check failed, allowing request:", err);
    return { allowed: true, remaining: limit };
  }
}

export function getIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
