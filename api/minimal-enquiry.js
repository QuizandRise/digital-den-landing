import { isIP } from 'node:net';
import { createEnquiryHandler } from '../src/minimal-enquiry/handler.js';
import { LIMITS } from '../src/minimal-enquiry/constants.js';
const core = createEnquiryHandler(); // No injectable mock at deployment boundary.

// Only trust Vercel's overwritten client-IP header on Vercel. Arbitrary XFF is
// never trusted. Host/proxy overwrite semantics still require release verification.
export function clientIpForRequest(req, env = process.env) {
  const ip = env.VERCEL === '1' ? req.headers?.['x-vercel-forwarded-for'] : req.socket?.remoteAddress;
  return typeof ip === 'string' && isIP(ip) ? ip : 'unknown';
}
export default async function handler(req, res) {
  let result;
  try {
    const length = req.headers?.['content-length'];
    if (length !== undefined && (typeof length !== 'string' || !/^\d+$/.test(length) || Number(length) > LIMITS.maxBodyBytes)) {
      result = { statusCode: 413, body: '{"ok":false,"error":"payload_too_large"}' };
    } else {
      let rawBody;
      if (Buffer.isBuffer(req.body)) {
        if (req.body.length > LIMITS.maxBodyBytes) throw new Error('body_size');
        rawBody = req.body.toString('utf8');
      } else if (typeof req.body === 'string') rawBody = req.body;
      else rawBody = JSON.stringify(req.body);
      result = await core.handle({ method: req.method, headers: req.headers, rawBody, clientIp: clientIpForRequest(req) });
    }
  } catch (error) {
    result = error?.message === 'body_size'
      ? { statusCode: 413, body: '{"ok":false,"error":"payload_too_large"}' }
      : { statusCode: 400, body: '{"ok":false,"error":"invalid_request"}' };
  }
  for (const [key, value] of Object.entries(result.headers || { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })) res.setHeader(key, value);
  res.status(result.statusCode);
  if (result.statusCode === 204) res.end(); else res.send(result.body);
}
