/** Only canonical HTTP(S) origins, with no userinfo, paths or opaque origins. */
export function validOrigin(value) {
  if (typeof value !== 'string' || !value || /[\x00-\x20\x7f]/u.test(value)) return false;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && url.origin === value;
  } catch { return false; }
}
export function resolveCorsOrigin(origin, allowedOrigins) {
  return validOrigin(origin) && allowedOrigins.includes(origin) ? origin : null;
}
export function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Idempotency-Key',
    'Access-Control-Max-Age': '600', Vary: 'Origin',
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
  };
}
