import { PROTECTION } from './constants.js';
/** Per warm instance only. Never evict active or unexpired reservations. */
export function createMemoryIdempotencyStore(options = {}) {
  const entries = new Map();
  const nowFn = options.now || Date.now;
  const ttl = options.ttlMs ?? PROTECTION.idempotencyTtlMs;
  const max = options.maxEntries ?? PROTECTION.idempotencyMaxEntries;
  function reserve(key, fingerprint, task, now = nowFn()) {
    for (const [k, entry] of entries) if (entry.done && entry.expiresAt <= now) entries.delete(k);
    const prior = entries.get(key);
    if (prior) return prior.fingerprint !== fingerprint ? { conflict: true } : { duplicate: true, promise: prior.promise };
    if (entries.size >= max) return { full: true };
    const entry = { fingerprint, done: false, expiresAt: Infinity };
    // Register before any task code runs, including synchronous task failures.
    entry.promise = Promise.resolve().then(task).finally(() => {
      entry.done = true;
      entry.expiresAt = nowFn() + ttl;
    });
    entries.set(key, entry);
    return { duplicate: false, promise: entry.promise };
  }
  return { reserve };
}
