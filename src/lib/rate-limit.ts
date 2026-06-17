/**
 * Tiny in-memory fixed-window rate limiter.
 *
 * Process-local — fine for a single instance / dev. For multi-instance
 * production, back this with Redis or Upstash. Keyed by an arbitrary
 * identifier (e.g. user id or IP).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const globalForRL = globalThis as unknown as {
  __rlBuckets?: Map<string, Bucket>;
};
const buckets = globalForRL.__rlBuckets ?? new Map<string, Bucket>();
globalForRL.__rlBuckets = buckets;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count++;
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}
