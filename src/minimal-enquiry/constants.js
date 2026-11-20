/** Allowed service values for the future minimal enquiry intake. */
export const ALLOWED_SERVICES = Object.freeze([
  "Brand Identity",
  "Graphic Design",
  "Website Design",
  "Promotional Video",
  "AI Images",
  "Radio Advertisement",
  "Social Media Content",
  "Marketing Materials",
  "Not sure yet",
]);

/** Abuse / payload size limits (bytes and field lengths). */
export const LIMITS = Object.freeze({
  maxBodyBytes: 12_288, // 12 KiB raw JSON body
  nameMax: 160,
  emailMax: 320,
  serviceMax: 80,
  briefMax: 4000,
  urlMax: 500,
  idempotencyKeyMax: 128,
  honeypotMax: 0,
});

/** In-memory protection windows. Best-effort only on serverless. */
export const PROTECTION = Object.freeze({
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMax: 5,
  idempotencyTtlMs: 30 * 60 * 1000,
  idempotencyMaxEntries: 500,
  rateLimitMaxEntries: 2000,
});

export const FORBIDDEN_HOST_MARKERS = Object.freeze([
  "workforceden",
  "workforce-den",
  "mongodb",
  "mongo+srv",
  "digital-den-api.vercel.app",
]);
