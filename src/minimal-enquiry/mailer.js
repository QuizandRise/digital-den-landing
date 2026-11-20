import { HAS_CONTROL, validMailbox } from './validate.js';
import { validSenderIdentity, googleAuthConfigError, GMAIL_SEND_SCOPE } from './config.js';
import { createSign, randomUUID } from "node:crypto";

/**
 * Escape text for safe inclusion in HTML email bodies.
 * @param {string} value
 */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build staff notification subject/body from validated enquiry.
 * @param {object} enquiry
 * @param {string} requestId
 */
export function buildEnquiryEmail(enquiry, requestId) {
  const subject = `[Digital Den] Enquiry: ${enquiry.service} — ${enquiry.name}`;
  const text = [
    "New Digital Den minimal enquiry",
    `Request ID: ${requestId}`,
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Service: ${enquiry.service}`,
    `URL: ${enquiry.url || "(none)"}`,
    `Privacy accepted: yes`,
    "",
    "Brief:",
    enquiry.brief,
    "",
    "Mailbox copies require owner-managed retention and deletion; no enquiry database write.",
  ].join("\n");

  const html = `
    <h2>New Digital Den minimal enquiry</h2>
    <p><strong>Request ID:</strong> ${escapeHtml(requestId)}</p>
    <p><strong>Name:</strong> ${escapeHtml(enquiry.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(enquiry.email)}</p>
    <p><strong>Service:</strong> ${escapeHtml(enquiry.service)}</p>
    <p><strong>URL:</strong> ${escapeHtml(enquiry.url || "(none)")}</p>
    <p><strong>Privacy accepted:</strong> yes</p>
    <h3>Brief</h3>
    <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(enquiry.brief)}</pre>
    <p style="color:#666;font-size:12px">Mailbox copies require owner-managed retention and deletion; no enquiry database write.</p>
  `.trim();

  return { subject, text, html };
}

/**
 * Mock mailer for local tests. Never contacts external networks.
 */
export function createMockMailer(options = {}) {
  /** @type {object[]} */
  const sent = options.sent || [];
  const shouldFail = options.shouldFail === true;

  return {
    provider: "mock",
    sent,
    async send({ to, from, subject, text, html, requestId }) {
      if (shouldFail) {
        return { ok: false, error: "mock_send_failed", messageId: null };
      }
      const messageId = `mock-${randomUUID()}`;
      sent.push({ to, from, subject, text, html, requestId, messageId });
      return { ok: true, error: null, messageId };
    },
  };
}

/**
 * @param {string} input
 */
function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Create a Google service-account JWT for Gmail send scope (domain-wide delegation).
 * @param {{ clientEmail: string, privateKey: string, delegatedUser: string }} google
 * @param {number} [nowSeconds]
 */
export function createGoogleServiceAccountJwt(google, nowSeconds = Math.floor(Date.now() / 1000)) {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: google.clientEmail,
      sub: google.delegatedUser,
      scope: GMAIL_SEND_SCOPE,
      aud: "https://oauth2.googleapis.com/token",
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer
    .sign(google.privateKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${unsigned}.${signature}`;
}

/** Bounds the whole operation, including response body consumption. */
export async function withDeadline(operation, timeoutMs = 5000) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('deadline')); }, timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}
export function encodeHeader(value) {
  if (typeof value !== 'string' || !value || HAS_CONTROL.test(value) || value.length > 500) throw new Error('invalid_header');
  // RFC 2047 words <= 75 characters; fold only at trusted word boundaries.
  const chunks = [];
  let chunk = '';
  for (const char of value) {
    if (Buffer.byteLength(chunk + char) > 42) { chunks.push(chunk); chunk = ''; }
    chunk += char;
  }
  if (chunk) chunks.push(chunk);
  return chunks.map(part => `=?UTF-8?B?${Buffer.from(part).toString('base64')}?=`).join('\r\n ');
}
export function createGoogleWorkspaceMailer(config, deps = {}) {
  const fetchImpl = deps.fetchImpl || fetch;
  const deadline = deps.timeoutMs ?? 5000;
  return {
    provider: 'google_workspace',
    async send({ to, from, subject, text, html }) {
      try {
        if (!validMailbox(to) || !validMailbox(from)) throw new Error('invalid_header');
        if (from !== config.fromAddress || !validSenderIdentity(config)) throw new Error('invalid_identity');
        const oauth = config.google.authMode === 'oauth_refresh_token';
        if (config.google.authMode && !['service_account', 'oauth_refresh_token'].includes(config.google.authMode)) throw new Error('invalid_auth_mode');
        // Repeat OAuth validation here so direct callers cannot bypass identity,
        // grant acknowledgments, scope or credential-mode isolation.
        if (oauth && googleAuthConfigError(config)) throw new Error('invalid_oauth_config');
        if (!oauth && [config.google.oauthClientId, config.google.oauthClientSecret,
          config.google.oauthRefreshToken, config.google.oauthScope, config.google.oauthMailboxConfirmed,
          config.google.sendAsConfirmed].some(value => value !== undefined && value !== '')) throw new Error('mixed_auth_config');
        const raw = [
          `From: ${encodeHeader(config.fromName)} <${from}>`, `To: ${to}`,
          `Subject: ${encodeHeader(subject)}`, 'MIME-Version: 1.0',
          'Content-Type: text/html; charset="UTF-8"', 'Content-Transfer-Encoding: base64', '',
          Buffer.from(html || `<pre>${escapeHtml(text)}</pre>`).toString('base64').match(/.{1,76}/g)?.join('\r\n') || '',
        ].join('\r\n');
        const jwt = oauth ? null : createGoogleServiceAccountJwt(config.google);
        const token = await withDeadline(async signal => {
          // Legacy JWT test seam is never used for refresh-token mode.
          if (!oauth && deps.tokenFetcher) return deps.tokenFetcher(jwt, signal);
          const res = await fetchImpl('https://oauth2.googleapis.com/token', {
            method: 'POST', signal, redirect: 'error', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(oauth ? {
              grant_type: 'refresh_token', client_id: config.google.oauthClientId,
              client_secret: config.google.oauthClientSecret, refresh_token: config.google.oauthRefreshToken,
              scope: GMAIL_SEND_SCOPE,
            } : { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
          });
          const data = await res.json();
          // Fail closed if Google does not explicitly acknowledge a send-only
          // Bearer grant. Never persist tokens or expose provider error payloads.
          if (data?.error || (oauth && (typeof data?.token_type !== 'string' || !/^bearer$/i.test(data.token_type) ||
              (data?.scope !== undefined && data.scope !== GMAIL_SEND_SCOPE) ||
              (data?.expires_in !== undefined && (!Number.isSafeInteger(data.expires_in) || data.expires_in < 1))))) throw new Error('token_failed');
          return { ok: res.ok, accessToken: data?.access_token };
        }, deadline);
        if (!token?.ok || typeof token.accessToken !== 'string' || !/^[A-Za-z0-9._~+/-]+={0,2}$/.test(token.accessToken)) throw new Error('token_failed');
        return await withDeadline(async signal => {
          // Pin OAuth sends to the approved mailbox; the configured delegatedUser
          // is not an OAuth impersonation claim. Google must authorise this user.
          const user = oauth ? encodeURIComponent(config.google.delegatedUser) : 'me';
          const res = await fetchImpl(`https://gmail.googleapis.com/gmail/v1/users/${user}/messages/send`, {
            method: 'POST', signal, redirect: 'error',
            headers: { Authorization: `Bearer ${token.accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw: base64url(raw) }),
          });
          const data = await res.json();
          if (!res.ok || data?.error || typeof data?.id !== 'string' || !/^[A-Za-z0-9_-]{1,256}$/.test(data.id)) throw new Error('missing_ack');
          return { ok: true, messageId: data.id };
        }, deadline);
      } catch { return { ok: false, error: 'delivery_unconfirmed', messageId: null }; }
    },
  };
}
export function createMailer(config, deps = {}) {
  if (config.provider !== 'google_workspace' || deps.forceMock) throw new Error('unsupported_mail_provider');
  return createGoogleWorkspaceMailer(config, deps);
}
