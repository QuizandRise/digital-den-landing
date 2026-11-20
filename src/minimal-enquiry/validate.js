import { ALLOWED_SERVICES, LIMITS } from './constants.js';
export const HAS_CONTROL = /[\x00-\x1f\x7f-\x9f\u2028\u2029]/u;
export function validMailbox(value) {
  return typeof value === 'string' && value.length <= 254 && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/.test(value) && !value.includes('..');
}
export function validIdempotencyKey(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}
export function validateEnquiryPayload(raw) {
  const fail = (errors) => ({ ok: false, errors, value: null });
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail(['Body must be a JSON object.']);
  const fields = ['name', 'email', 'service', 'brief', 'url', 'website', 'company_url', 'idempotencyKey'];
  for (const key of Object.keys(raw)) {
    if (![...fields, 'privacyAccepted'].includes(key)) return fail(['Unknown field.']);
    if (key !== 'privacyAccepted' && typeof raw[key] !== 'string') return fail(['Fields must be strings.']);
  }
  const errors = [];
  const value = {};
  for (const key of ['name', 'email', 'service', 'brief', 'url']) {
    const input = raw[key];
    const max = LIMITS[`${key}Max`];
    if (input !== undefined && (typeof input !== 'string' || input.length > max)) errors.push(`${key} is invalid.`);
    if (typeof input === 'string' && (key === 'brief' ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/u : HAS_CONTROL).test(input)) errors.push(`${key} contains controls.`);
    value[key] = typeof input === 'string' ? input.trim() : '';
    if (key !== 'url' && !value[key]) errors.push(`${key} is required.`);
  }
  if (!validMailbox(value.email)) errors.push('email is invalid.');
  if (!ALLOWED_SERVICES.includes(value.service)) errors.push('service is invalid.');
  if (value.url) {
    try {
      const url = new URL(value.url);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) errors.push('URL must use HTTP(S) without credentials.');
    } catch { errors.push('URL is invalid.'); }
  }
  if (raw.privacyAccepted !== true) errors.push('Privacy acknowledgement is required.');
  if (raw.idempotencyKey !== undefined && !validIdempotencyKey(raw.idempotencyKey)) errors.push('idempotencyKey is invalid.');
  if (errors.length) return fail(errors);
  if (raw.website || raw.company_url) return { ...fail(['Rejected.']), honeypot: true };
  return { ok: true, errors: [], value: { ...value, email: value.email.toLowerCase(), privacyAccepted: true, idempotencyKey: raw.idempotencyKey || '' } };
}
