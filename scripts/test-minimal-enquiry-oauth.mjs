import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadEnquiryConfig, GMAIL_SEND_SCOPE, RELEASE_APPROVED } from '../src/minimal-enquiry/config.js';
import { createMailer, createGoogleWorkspaceMailer } from '../src/minimal-enquiry/mailer.js';

// Synthetic fixtures only. No local credential files, Keychain or real network.
globalThis.fetch = async () => { throw new Error('Real network forbidden in local suite'); };
const env = {
  NODE_ENV: 'production', DD_ENQUIRY_ENABLED: 'true', DD_ENQUIRY_MAIL_PROVIDER: 'google_workspace',
  DD_ENQUIRY_INBOX_TO: 'enquiries@example.com', DD_ENQUIRY_FROM_ADDRESS: 'dd@quizandrise.com',
  DD_ENQUIRY_ALLOWED_ORIGINS: 'https://example.com', DD_ENQUIRY_GOOGLE_AUTH_MODE: 'oauth_refresh_token',
  DD_ENQUIRY_GOOGLE_DELEGATED_USER: 'ceo@quizandrise.com', DD_ENQUIRY_GOOGLE_APPROVED_ALIAS: 'dd@quizandrise.com',
  DD_ENQUIRY_GOOGLE_OAUTH_CLIENT_ID: '123-synthetic.apps.googleusercontent.com',
  DD_ENQUIRY_GOOGLE_OAUTH_CLIENT_SECRET: 'synthetic-client-secret',
  DD_ENQUIRY_GOOGLE_OAUTH_REFRESH_TOKEN: 'synthetic-refresh-token', DD_ENQUIRY_GOOGLE_OAUTH_SCOPE: GMAIL_SEND_SCOPE,
  DD_ENQUIRY_GOOGLE_OAUTH_MAILBOX_CONFIRMED: 'true', DD_ENQUIRY_GOOGLE_SEND_AS_CONFIRMED: 'true',
};
assert.equal(loadEnquiryConfig(env).reason, 'release_not_approved');
assert.equal(loadEnquiryConfig(env, { injectedTestMailer: true }).reason, 'release_not_approved');
assert.equal(RELEASE_APPROVED, false);
assert.match(readFileSync(new URL('../minimal-enquiry.html', import.meta.url), 'utf8'), /var RELEASE_APPROVED = false/);
for (const key of Object.keys(env).filter(key => key.startsWith('DD_ENQUIRY_GOOGLE_'))) {
  for (const value of [undefined, '', 'wrong', ' true', true, [], {}, 'x\r\ny']) {
    // Opaque credential validity can only be determined by the provider.
    if (value === 'wrong' && ['DD_ENQUIRY_GOOGLE_OAUTH_CLIENT_SECRET', 'DD_ENQUIRY_GOOGLE_OAUTH_REFRESH_TOKEN'].includes(key)) continue;
    const result = loadEnquiryConfig({ ...env, [key]: value });
    assert.equal(result.ok, false);
    assert.notEqual(result.reason, 'release_not_approved');
    assert.equal(result.config, null);
    assert.doesNotMatch(JSON.stringify(result), /synthetic-client-secret|synthetic-refresh-token/);
  }
}
for (const override of [
  { DD_ENQUIRY_GOOGLE_CLIENT_EMAIL: 'synthetic@test.iam.gserviceaccount.com' },
  { DD_ENQUIRY_GOOGLE_PRIVATE_KEY: 'synthetic-key' },
  { DD_ENQUIRY_GOOGLE_AUTH_MODE: 'service_account' },
  { DD_ENQUIRY_FROM_ADDRESS: 'ceo@quizandrise.com' },
  { DD_ENQUIRY_GOOGLE_OAUTH_SCOPE: `${GMAIL_SEND_SCOPE} openid` },
  { DD_ENQUIRY_GOOGLE_OAUTH_SCOPE: 'https://mail.google.com/' },
]) assert.notEqual(loadEnquiryConfig({ ...env, ...override }).reason, 'release_not_approved');

const config = {
  provider: 'google_workspace', fromName: 'Digital Den', fromAddress: 'dd@quizandrise.com',
  google: {
    authMode: 'oauth_refresh_token', delegatedUser: 'ceo@quizandrise.com', approvedAlias: 'dd@quizandrise.com',
    oauthClientId: env.DD_ENQUIRY_GOOGLE_OAUTH_CLIENT_ID, oauthClientSecret: env.DD_ENQUIRY_GOOGLE_OAUTH_CLIENT_SECRET,
    oauthRefreshToken: env.DD_ENQUIRY_GOOGLE_OAUTH_REFRESH_TOKEN, oauthScope: GMAIL_SEND_SCOPE,
    oauthMailboxConfirmed: 'true', sendAsConfirmed: 'true',
  },
};
const message = { to: 'enquiries@example.com', from: config.fromAddress, subject: 'Synthetic test', text: 'Synthetic body' };
const tokenData = { access_token: 'synthetic-access-token', token_type: 'Bearer', expires_in: 3600, scope: GMAIL_SEND_SCOPE };
const failure = { ok: false, error: 'delivery_unconfirmed', messageId: null };
function mockFetch({ token = tokenData, ack = { id: 'synthetic-gmail-id' }, tokenOk = true, sendOk = true } = {}) {
  const calls = [];
  return { calls, fetchImpl: async (url, init) => {
    calls.push(url);
    assert.equal(init.method, 'POST');
    assert.equal(init.redirect, 'error');
    assert.ok(init.signal instanceof AbortSignal);
    if (calls.length === 1) {
      assert.equal(url, 'https://oauth2.googleapis.com/token');
      assert.equal(init.headers['Content-Type'], 'application/x-www-form-urlencoded');
      assert.deepEqual(Object.fromEntries(init.body), {
        grant_type: 'refresh_token', client_id: config.google.oauthClientId,
        client_secret: config.google.oauthClientSecret, refresh_token: config.google.oauthRefreshToken,
        scope: GMAIL_SEND_SCOPE,
      });
      return { ok: tokenOk, json: async () => token };
    }
    assert.equal(calls.length, 2); // no automatic retries
    assert.equal(url, 'https://gmail.googleapis.com/gmail/v1/users/ceo%40quizandrise.com/messages/send');
    assert.equal(init.headers.Authorization, 'Bearer synthetic-access-token');
    const raw = Buffer.from(JSON.parse(init.body).raw, 'base64url').toString();
    assert.match(raw, /From: .* <dd@quizandrise\.com>\r\n/);
    return { ok: sendOk, json: async () => ack };
  } };
}
{
  const deps = mockFetch();
  const result = await createMailer(config, { ...deps, tokenFetcher() { throw new Error('JWT seam must not run'); } }).send(message);
  assert.deepEqual(result, { ok: true, messageId: 'synthetic-gmail-id' });
  assert.equal(deps.calls.length, 2);
}
for (const patch of [
  { access_token: undefined }, { access_token: '' }, { access_token: 'bad\r\nHeader' },
  { access_token: {} }, { token_type: undefined }, { token_type: 'Basic' },
  { expires_in: '3600' }, { expires_in: 0 }, { expires_in: -1 },
  { expires_in: 1.5 }, { scope: '' },
  { scope: `${GMAIL_SEND_SCOPE} openid` }, { scope: 'https://mail.google.com/' },
  { error: 'invalid_grant', error_description: 'synthetic-private-error' },
]) {
  const deps = mockFetch({ token: { ...tokenData, ...patch } });
  assert.deepEqual(await createMailer(config, deps).send(message), failure);
  assert.equal(deps.calls.length, 1);
}
for (const patch of [
  { scope: undefined }, { expires_in: undefined }, { expires_in: 3920 },
  { token_type: 'bearer' }, { token_type: 'BEARER' },
]) {
  const deps = mockFetch({ token: { ...tokenData, ...patch } });
  assert.deepEqual(await createMailer(config, deps).send(message), { ok: true, messageId: 'synthetic-gmail-id' });
  assert.equal(deps.calls.length, 2);
}
for (const token of [null, {}, [], 'malformed']) {
  const deps = mockFetch({ token });
  assert.deepEqual(await createMailer(config, deps).send(message), failure);
  assert.equal(deps.calls.length, 1);
}
for (const options of [
  { tokenOk: false }, { sendOk: false }, { ack: {} }, { ack: null },
  { ack: { id: '' } }, { ack: { id: 'bad\r\nack' } }, { ack: { id: 42 } },
  { ack: { id: 'valid-looking-id', error: 'provider-error' } },
]) {
  const deps = mockFetch(options);
  assert.deepEqual(await createMailer(config, deps).send(message), failure);
  assert.equal(deps.calls.length, options.tokenOk === false ? 1 : 2);
}
for (const patch of [
  { authMode: '' }, { authMode: undefined }, { authMode: 'wrong' }, { authMode: 'service_account' },
  { delegatedUser: 'other@example.com' }, { approvedAlias: '' }, { oauthScope: 'openid' },
  { oauthMailboxConfirmed: '' }, { sendAsConfirmed: '' }, { oauthClientId: '' },
  { oauthClientSecret: '' }, { oauthRefreshToken: '' }, { privateKey: 'synthetic' },
  { clientEmail: 'synthetic@test.iam.gserviceaccount.com' },
]) {
  let calls = 0;
  const mailer = createGoogleWorkspaceMailer({ ...config, google: { ...config.google, ...patch } }, {
    fetchImpl: async () => { calls++; throw new Error('must not contact provider'); },
  });
  assert.deepEqual(await mailer.send(message), failure);
  assert.equal(calls, 0);
}
for (const field of ['to', 'from', 'subject']) {
  const deps = mockFetch();
  assert.deepEqual(await createMailer(config, deps).send({ ...message, [field]: 'bad\r\nBcc: bad@example.com' }), failure);
  assert.equal(deps.calls.length, 0);
}
// Token and Gmail response bodies share the deadline; every failure is redacted.
for (const phase of ['token-fetch', 'token-body', 'send-fetch', 'send-body', 'throw', 'bad-json']) {
  let calls = 0, aborted = false;
  const hang = () => new Promise(() => {});
  const mailer = createMailer(config, { timeoutMs: 15, fetchImpl: async (_, init) => {
    calls++;
    init.signal.addEventListener('abort', () => { aborted = true; });
    if (phase === 'throw') throw new Error('synthetic-private-error');
    if (phase === 'bad-json') return { ok: true, json: async () => { throw new Error('synthetic-private-error'); } };
    if ((calls === 1 && phase === 'token-fetch') || (calls === 2 && phase === 'send-fetch')) return hang();
    return { ok: true, json: ((calls === 1 && phase === 'token-body') || (calls === 2 && phase === 'send-body'))
      ? hang : async () => calls === 1 ? tokenData : { id: 'synthetic-gmail-id' } };
  } });
  assert.deepEqual(await mailer.send(message), failure);
  assert.equal(aborted, !['throw', 'bad-json'].includes(phase));
  assert.ok(calls <= 2);
}
