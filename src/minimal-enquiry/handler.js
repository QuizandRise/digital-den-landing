import { createHash, randomUUID } from 'node:crypto';
import { LIMITS } from './constants.js';
import { loadEnquiryConfig } from './config.js';
import { resolveCorsOrigin, corsHeaders } from './cors.js';
import { createMemoryIdempotencyStore } from './idempotency.js';
import { createMailer, buildEnquiryEmail, withDeadline } from './mailer.js';
import { createMemoryRateLimiter } from './rate-limit.js';
import { validateEnquiryPayload, validIdempotencyKey } from './validate.js';

export function createEnquiryHandler(options = {}) {
  const rateLimiter = options.rateLimiter || createMemoryRateLimiter();
  const idempotencyStore = options.idempotencyStore || createMemoryIdempotencyStore();
  const env = options.env || process.env;
  async function handle(request) {
    const requestId = randomUUID();
    let headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Request-Id': requestId };
    const reply = (statusCode, body) => ({ statusCode, headers, body: statusCode === 204 ? '' : JSON.stringify({ ...body, requestId }) });
    try {
      const incoming = {};
      for (const [key, value] of Object.entries(request.headers || {})) {
        if (value === undefined) continue;
        const lower = key.toLowerCase();
        if (typeof value !== 'string' || incoming[lower] !== undefined || /[\x00-\x1f\x7f]/.test(value)) return reply(400, { ok: false, error: 'invalid_headers' });
        incoming[lower] = value;
      }
      const result = loadEnquiryConfig(env, { injectedTestMailer: typeof options.mailerFactory === 'function' });
      const allowed = resolveCorsOrigin(incoming.origin, result.ok ? result.config.allowedOrigins : (env.DD_ENQUIRY_ALLOWED_ORIGINS || '').split(','));
      headers = { ...headers, ...corsHeaders(allowed) };
      // This browser-only route requires Origin even for non-browser clients.
      if (!allowed) return reply(403, { ok: false, error: 'origin_not_allowed' });
      if (request.method === 'OPTIONS') return reply(204, {});
      if (request.method !== 'POST') return reply(405, { ok: false, error: 'method_not_allowed' });
      if (!result.ok) return reply(503, { ok: false, error: 'service_unavailable' });
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(incoming['content-type'] || '')) return reply(415, { ok: false, error: 'unsupported_media_type' });
      if (incoming['content-length'] !== undefined && (!/^\d+$/.test(incoming['content-length']) || Number(incoming['content-length']) > LIMITS.maxBodyBytes)) return reply(413, { ok: false, error: 'payload_too_large' });
      const raw = request.rawBody === undefined ? JSON.stringify(request.body) : request.rawBody;
      if (typeof raw !== 'string') return reply(400, { ok: false, error: 'invalid_json' });
      if (Buffer.byteLength(raw) > LIMITS.maxBodyBytes) return reply(413, { ok: false, error: 'payload_too_large' });
      const rate = rateLimiter.check(createHash('sha256').update(request.clientIp || 'unknown').digest('hex'), Date.now());
      if (!rate.allowed) { headers['Retry-After'] = String(Math.max(1, Math.ceil(rate.retryAfterMs / 1000))); return reply(429, { ok: false, error: 'rate_limited' }); }
      let body;
      try { body = JSON.parse(raw); } catch { return reply(400, { ok: false, error: 'invalid_json' }); }
      const validation = validateEnquiryPayload(body);
      if (!validation.ok) return reply(400, { ok: false, error: 'validation_failed' });
      const bodyKey = validation.value.idempotencyKey;
      const headerKey = incoming['idempotency-key'];
      if ((headerKey !== undefined && !validIdempotencyKey(headerKey)) || (bodyKey && headerKey && bodyKey !== headerKey)) return reply(400, { ok: false, error: 'invalid_idempotency_key' });
      const key = bodyKey || headerKey || randomUUID();
      const { idempotencyKey: ignored, ...canonical } = validation.value;
      const fingerprint = createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
      const reservation = idempotencyStore.reserve(key, fingerprint, async () => {
        try {
          const mailer = (options.mailerFactory || createMailer)(result.config, options.mailerDeps || {});
          const sent = await withDeadline(() => mailer.send({ to: result.config.inboxTo, from: result.config.fromAddress, ...buildEnquiryEmail(validation.value, requestId), requestId }), options.sendTimeoutMs ?? 12000);
          if (!sent?.ok || typeof sent.messageId !== 'string' || !sent.messageId.trim()) return { ok: false };
          return { ok: true };
        } catch { return { ok: false }; }
      });
      if (reservation.conflict) return reply(409, { ok: false, error: 'idempotency_conflict' });
      if (reservation.full) return reply(503, { ok: false, error: 'capacity_exhausted' });
      const outcome = await reservation.promise;
      if (!outcome.ok) return reply(502, { ok: false, error: 'delivery_unconfirmed', message: 'Email acceptance could not be confirmed. Delivery may be uncertain; do not change the key to retry.' });
      return reply(200, { ok: true, duplicate: reservation.duplicate, message: 'Gmail accepted the enquiry for processing. This does not confirm inbox delivery.', durability: 'email_only_no_database; idempotency_best_effort_in_memory_per_instance' });
    } catch { return reply(500, { ok: false, error: 'internal_error' }); }
  }
  return { handle, rateLimiter, idempotencyStore };
}
