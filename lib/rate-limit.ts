import "server-only";

// Lightweight fixed-window rate limiter kept in module memory.
//
// CAVEAT: this state lives in a single server instance. On Vercel's
// serverless/edge fleet each instance has its own map, so this raises the cost
// of brute force but is NOT a hard guarantee across a horizontally scaled
// deployment. For production-grade throttling, back this with a shared store
// (e.g. Upstash Redis / Vercel KV) using the same interface. It is deliberately
// dependency-free so it works out of the box.

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

// Opportunistic cleanup so the map can't grow unbounded.
function sweep(now: number): void {
  if (buckets.size < 5000) return;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

// Returns whether an action keyed by `key` is allowed, consuming one unit when
// it is. `limit` attempts are permitted per `windowMs`.
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

// Clear a key's counter — call after a successful login so a legitimate user
// isn't penalized for earlier typos.
export function rateLimitReset(key: string): void {
  buckets.delete(key);
}
