/**
 * Minimal in-memory fixed-window rate limiter for authentication endpoints.
 *
 * Deliberately process-local: it bounds brute-force attempts per instance but
 * is not a substitute for an edge/CDN rate limit in production. Do not use it
 * to rate-limit high-value or multi-instance workloads.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function sweepExpired(now: number): void {
  if (buckets.size < 1000) {
    return;
  }
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
}

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
  now = Date.now(),
): RateLimitResult {
  sweepExpired(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { limited: false, remaining: options.limit - 1 };
  }

  existing.count += 1;
  if (existing.count > options.limit) {
    return { limited: true, remaining: 0 };
  }
  return { limited: false, remaining: options.limit - existing.count };
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
