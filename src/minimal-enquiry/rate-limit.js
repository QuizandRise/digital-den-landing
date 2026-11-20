import { PROTECTION } from './constants.js';
/** Bounded, fail-closed per-instance controls; no distributed guarantee. */
export function createMemoryRateLimiter(options = {}) {
  const windowMs = options.windowMs ?? PROTECTION.rateLimitWindowMs;
  const max = options.max ?? PROTECTION.rateLimitMax;
  const capacity = options.maxEntries ?? PROTECTION.rateLimitMaxEntries;
  const globalMax = options.globalMax ?? 100;
  const buckets = new Map();
  let global = { start: 0, count: 0 };
  function check(key, now = Date.now()) {
    for (const [k, b] of buckets) if (now - b.start >= windowMs) buckets.delete(k);
    if (now - global.start >= windowMs) global = { start: now, count: 0 };
    const b = buckets.get(key);
    const deny = () => ({ allowed: false, retryAfterMs: windowMs, remaining: 0 });
    if (global.count >= globalMax || (!b && buckets.size >= capacity) || (b && b.count >= max)) return deny();
    const bucket = b || { start: now, count: 0 };
    bucket.count++; global.count++; buckets.set(key, bucket);
    return { allowed: true, retryAfterMs: 0, remaining: max - bucket.count };
  }
  return { check };
}
