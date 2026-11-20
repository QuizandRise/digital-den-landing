import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnquiryConfig, RELEASE_APPROVED } from "../src/minimal-enquiry/config.js";
import { createEnquiryHandler } from "../src/minimal-enquiry/handler.js";
import {
  buildEnquiryEmail,
  createMockMailer,
  createGoogleWorkspaceMailer,
  createGoogleServiceAccountJwt,
  escapeHtml,
} from "../src/minimal-enquiry/mailer.js";
import { validateEnquiryPayload } from "../src/minimal-enquiry/validate.js";
import { ALLOWED_SERVICES } from "../src/minimal-enquiry/constants.js";

globalThis.fetch = async () => { throw new Error('Real network forbidden in local suite'); };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function validEnv(overrides = {}) {
  return {
    DD_ENQUIRY_ENABLED: "true",
    DD_ENQUIRY_MAIL_PROVIDER: "mock",
    DD_ENQUIRY_INBOX_TO: "enquiries@example.com",
    DD_ENQUIRY_FROM_ADDRESS: "enquiries@example.com",
    DD_ENQUIRY_FROM_NAME: "Digital Den Enquiries",
    DD_ENQUIRY_ALLOWED_ORIGINS: "https://example.com,http://localhost:3000",
    ...overrides,
  };
}

function basePayload(overrides = {}) {
  return {
    name: "Alex Example",
    email: "alex@example.com",
    service: "Website Design",
    brief: "Need a clear brochure site for a local studio.",
    url: "https://example.com",
    privacyAccepted: true,
    idempotencyKey: "test-key-1",
    website: "",
    ...overrides,
  };
}

async function post(handlerApi, body, headerOverrides = {}) {
  return handlerApi.handle({
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      "user-agent": "minimal-enquiry-test",
      ...headerOverrides,
    },
    rawBody: JSON.stringify(body),
    clientIp: "203.0.113.10",
  });
}

// --- Config fail-closed ---
{
  const missing = loadEnquiryConfig({});
  assert.equal(missing.ok, false);
  assert.equal(missing.reason, "incomplete_config");

  const forbidden = loadEnquiryConfig(
    validEnv({
      DD_ENQUIRY_INBOX_TO: "ops@workforceden.example",
    }),
  );
  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.reason, "forbidden_dependency");

  const apiHost = loadEnquiryConfig(
    validEnv({
      DD_ENQUIRY_ALLOWED_ORIGINS: "https://digital-den-api.vercel.app",
    }),
  );
  assert.equal(apiHost.ok, false);

  const ok = loadEnquiryConfig(validEnv(), { injectedTestMailer: true });
  assert.equal(ok.ok, true);
  assert.equal(ok.config.provider, "mock");
}

// --- Validation ---
{
  const good = validateEnquiryPayload(basePayload());
  assert.equal(good.ok, true);
  assert.equal(good.value.email, "alex@example.com");

  const noPrivacy = validateEnquiryPayload(basePayload({ privacyAccepted: false }));
  assert.equal(noPrivacy.ok, false);

  const badService = validateEnquiryPayload(basePayload({ service: "Payroll" }));
  assert.equal(badService.ok, false);

  const honeypot = validateEnquiryPayload(basePayload({ website: "http://spam.test" }));
  assert.equal(honeypot.ok, false);
  assert.equal(honeypot.honeypot, true);

  assert.ok(ALLOWED_SERVICES.includes("Brand Identity"));
}

// --- Mail helpers ---
{
  assert.equal(escapeHtml(`<a href="x">'"&`), "&lt;a href=&quot;x&quot;&gt;&#39;&quot;&amp;");
  const built = buildEnquiryEmail(basePayload(), "req-1");
  assert.match(built.subject, /Website Design/);
  assert.match(built.text, /alex@example.com/);
  assert.match(built.html, /Request ID/);
}

// --- Mock success / failure / idempotency / rate limit ---
{
  const mock = createMockMailer();
  const api = createEnquiryHandler({
    env: validEnv(),
    mailerFactory: () => mock,
    requestIdFn: () => "req-success-1",
  });

  const res = await post(api, basePayload());
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.ok, true);
  assert.equal(body.duplicate, false);
  assert.match(body.durability, /email_only_no_database/);
  assert.equal(mock.sent.length, 1);
  assert.equal(mock.sent[0].to, "enquiries@example.com");
}

{
  const mock = createMockMailer({ shouldFail: true });
  const api = createEnquiryHandler({
    env: validEnv(),
    mailerFactory: () => mock,
  });
  const res = await post(api, basePayload({ idempotencyKey: "fail-key" }));
  assert.equal(res.statusCode, 502);
  const body = JSON.parse(res.body);
  assert.equal(body.ok, false);
  assert.equal(body.error, "delivery_unconfirmed");
  assert.equal(mock.sent.length, 0);
}

{
  const mock = createMockMailer();
  const api = createEnquiryHandler({
    env: validEnv(),
    mailerFactory: () => mock,
  });
  const first = await post(api, basePayload({ idempotencyKey: "dup-key" }));
  const second = await post(api, basePayload({ idempotencyKey: "dup-key" }));
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
  assert.equal(JSON.parse(second.body).duplicate, true);
  assert.equal(mock.sent.length, 1);
}

{
  const mock = createMockMailer();
  const api = createEnquiryHandler({
    env: validEnv(),
    mailerFactory: () => mock,
    rateLimiter: {
      check() {
        return { allowed: false, remaining: 0, retryAfterMs: 60_000 };
      },
    },
  });
  const res = await post(api, basePayload({ idempotencyKey: "rate-key" }));
  assert.equal(res.statusCode, 429);
}

{
  const api = createEnquiryHandler({
    env: validEnv({ DD_ENQUIRY_ENABLED: "false" }),
  });
  const res = await post(api, basePayload({ idempotencyKey: "disabled" }));
  assert.equal(res.statusCode, 503);
  assert.equal(JSON.parse(res.body).error, "service_unavailable");
}

{
  const mock = createMockMailer();
  const api = createEnquiryHandler({
    env: validEnv(),
    mailerFactory: () => mock,
  });
  const res = await post(api, basePayload({ idempotencyKey: "bad-origin" }), {
    origin: "https://evil.example",
  });
  assert.equal(res.statusCode, 403);
  assert.equal(mock.sent.length, 0);
}

{
  const mock = createMockMailer();
  const api = createEnquiryHandler({
    env: validEnv(),
    mailerFactory: () => mock,
  });
  const res = await post(api, basePayload({ website: "bots", idempotencyKey: "hp" }));
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).ok, false);
  assert.equal(mock.sent.length, 0);
}

// --- Google Workspace mailer with mocked network (no real send) ---
{
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const google = {
    clientEmail: "enquiry-bot@example.iam.gserviceaccount.com",
    privateKey: pem,
    delegatedUser: "enquiries@example.com",
  };
  const jwt = createGoogleServiceAccountJwt(google, 1_700_000_000);
  assert.equal(jwt.split(".").length, 3);

  let sendCalled = false;
  const mailer = createGoogleWorkspaceMailer(
    {
      fromName: "Digital Den Enquiries",
      fromAddress: "enquiries@example.com",
      google,
    },
    {
      tokenFetcher: async () => ({ ok: true, accessToken: "test-token" }),
      fetchImpl: async (url, init) => {
        assert.match(String(url), /gmail\.googleapis\.com/);
        sendCalled = true;
        assert.equal(init.headers.Authorization, "Bearer test-token");
        return {
          ok: true,
          async json() {
            return { id: "gmail-msg-1" };
          },
        };
      },
    },
  );

  const result = await mailer.send({
    to: "enquiries@example.com",
    from: "enquiries@example.com",
    subject: "Test",
    text: "Hello",
    html: "<p>Hello</p>",
    requestId: "g-1",
  });
  assert.equal(result.ok, true);
  assert.equal(result.messageId, "gmail-msg-1");
  assert.equal(sendCalled, true);
}

// --- Production form endpoint must remain unchanged ---
{
  const indexHtml = readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(indexHtml, /digital-den-api\.vercel\.app\/api\/create-project/);
  assert.doesNotMatch(indexHtml, /\/api\/minimal-enquiry/);

  const legacySend = readFileSync(path.join(root, "api/send.js"), "utf8");
  assert.match(legacySend, /api\.resend\.com/);
}

// --- Isolation: new enquiry path must not reference forbidden systems ---
{
  const scanRoots = [
    path.join(root, "src/minimal-enquiry"),
    path.join(root, "api/minimal-enquiry.js"),
    path.join(root, "minimal-enquiry.html"),
    path.join(root, "scripts/test-minimal-enquiry.mjs"),
  ];

  /** @type {string[]} */
  const files = [];
  function walk(target) {
    const st = statSync(target);
    if (st.isFile()) {
      files.push(target);
      return;
    }
    for (const name of readdirSync(target)) {
      walk(path.join(target, name));
    }
  }
  for (const target of scanRoots) walk(target);

  const forbidden = [
    /mongodb(\+srv)?:\/\//i,
    /workforceden-app/i,
    /WORKFORCEDEN_/i,
    /mongoose/i,
    /digital-den-api\.vercel\.app/i,
  ];

  for (const file of files) {
    const text = readFileSync(file, "utf8");
    // Allow denylist definitions and this test's production-preservation assertions.
    if (
      file.endsWith("test-minimal-enquiry.mjs") ||
      file.endsWith(`${path.sep}constants.js`) ||
      file.endsWith(`${path.sep}config.js`)
    ) {
      continue;
    }
    for (const pattern of forbidden) {
      assert.doesNotMatch(
        text,
        pattern,
        `${path.relative(root, file)} must not reference ${pattern}`,
      );
    }
  }

  // Denylist files may name forbidden hosts only as rejection markers, never as destinations.
  const constantsSrc = readFileSync(path.join(root, "src/minimal-enquiry/constants.js"), "utf8");
  assert.match(constantsSrc, /FORBIDDEN_HOST_MARKERS/);
  assert.doesNotMatch(constantsSrc, /mongodb(\+srv)?:\/\//i);
  assert.doesNotMatch(constantsSrc, /create-project/);
}

// --- Future form posts only to local handler ---
{
  const page = readFileSync(path.join(root, "minimal-enquiry.html"), "utf8");
  assert.match(page, /\/api\/minimal-enquiry/);
  assert.match(page, /privacyAccepted/);
  assert.match(page, /Future replacement intake|future cutover/i);
  assert.doesNotMatch(page, /create-project/);
  assert.doesNotMatch(page, /digital-den-api/);
}

// --- Security remediation adversarial regressions (all dependencies synthetic) ---
const { createMailer, encodeHeader } = await import('../src/minimal-enquiry/mailer.js');
const { createMemoryRateLimiter } = await import('../src/minimal-enquiry/rate-limit.js');
const { createMemoryIdempotencyStore } = await import('../src/minimal-enquiry/idempotency.js');
const { clientIpForRequest, default: entrypoint } = await import('../api/minimal-enquiry.js');
const { validOrigin } = await import('../src/minimal-enquiry/cors.js');
const { runInNewContext } = await import('node:vm');
function mockApi(extra = {}) {
  const mock = createMockMailer();
  return { mock, api: createEnquiryHandler({ env: validEnv(), mailerFactory: () => mock, ...extra }) };
}

// Controls are rejected before trim, with MIME encoding as defence in depth.
for (const control of ['\r', '\n', '\t', '\0', '\x7f', '\x85', '\u2028']) {
  const { api, mock } = mockApi();
  assert.equal((await post(api, basePayload({ name: control + 'Bcc: victim@example.com' }))).statusCode, 400);
  assert.equal(mock.sent.length, 0);
  assert.throws(() => encodeHeader('name' + control));
}
assert.match(encodeHeader('你好 é'), /^=\?UTF-8\?B\?/);
for (const word of encodeHeader('界'.repeat(160)).split('\r\n ')) assert.ok(word.length <= 75);
assert.equal(loadEnquiryConfig(validEnv()).ok, false);
for (const marker of [{ NODE_ENV: 'production' }, { VERCEL: '1' }, { VERCEL_ENV: 'preview' }]) {
  const { api, mock } = mockApi({ env: validEnv(marker) });
  assert.equal((await post(api, basePayload())).statusCode, 503);
  assert.equal(mock.sent.length, 0);
}
assert.throws(() => createMailer({ provider: 'mock' }));
assert.throws(() => createMailer({ provider: 'google_workspace' }, { forceMock: true }));
{
  const desired = validEnv({ NODE_ENV: 'production', VERCEL: '1' });
  const saved = Object.fromEntries(Object.keys(desired).map(key => [key, process.env[key]]));
  try {
    Object.assign(process.env, desired);
    let status, output;
    const res = { setHeader() {}, status(code) { status = code; }, send(body) { output = body; }, end() {} };
    await entrypoint({ method: 'POST', headers: { origin: 'https://example.com', 'content-type': 'application/json' }, body: basePayload() }, res);
    assert.equal(status, 503);
    assert.equal(JSON.parse(output).ok, false);
    await entrypoint({ method: 'POST', headers: { 'content-length': '12289' }, body: basePayload() }, res);
    assert.equal(status, 413);
    await entrypoint({ method: 'POST', headers: {}, body: Buffer.alloc(12289) }, res);
    assert.equal(status, 413);
    const circular = {}; circular.self = circular;
    await entrypoint({ method: 'POST', headers: {}, body: circular }, res);
    assert.equal(status, 400);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}
{
  let release;
  const waiting = new Promise(resolve => { release = resolve; });
  let sends = 0;
  const { api } = mockApi({ mailerFactory: () => ({ async send() { sends++; await waiting; return { ok: true, messageId: 'test-ack' }; } }) });
  const first = post(api, basePayload());
  const second = post(api, basePayload());
  const conflict = await post(api, basePayload({ brief: 'Changed' }));
  assert.equal(conflict.statusCode, 409);
  release();
  const responses = await Promise.all([first, second]);
  assert.deepEqual(responses.map(r => r.statusCode), [200, 200]);
  assert.equal(JSON.parse(responses[1].body).duplicate, true);
  assert.equal(sends, 1);
}
for (const key of ['', ' leading', 'a b', 'a,b', 'x'.repeat(129), 'a\r\nBcc: evil']) {
  const { api, mock } = mockApi();
  assert.equal((await post(api, basePayload({ idempotencyKey: undefined }), { 'idempotency-key': key })).statusCode, 400);
  assert.equal(mock.sent.length, 0);
}
{
  const { api } = mockApi();
  assert.equal((await post(api, basePayload(), { 'idempotency-key': 'different' })).statusCode, 400);
  assert.equal((await post(api, basePayload({ idempotencyKey: undefined }), { 'idempotency-key': 'header-only' })).statusCode, 200);
}
{
  const store = createMemoryIdempotencyStore({ maxEntries: 1 });
  await store.reserve('one', 'fingerprint', async () => ({})).promise;
  assert.equal(store.reserve('two', 'other', async () => ({})).full, true);
  assert.equal(store.reserve('one', 'changed', async () => ({})).conflict, true);
}
{
  const { api } = mockApi();
  for (let i = 0; i < 5; i++) assert.equal((await post(api, basePayload(), { 'user-agent': String(i) })).statusCode, 200);
  assert.equal((await post(api, basePayload(), { 'user-agent': 'fresh-agent' })).statusCode, 429);
  const limiter = createMemoryRateLimiter({ maxEntries: 1, max: 1, globalMax: 2 });
  assert.equal(limiter.check('a', 100).allowed, true);
  assert.equal(limiter.check('b', 100).allowed, false);
  assert.equal(limiter.check('a', 100).allowed, false);
  const global = createMemoryRateLimiter({ globalMax: 2 });
  assert.equal(global.check('a', 100).allowed, true);
  assert.equal(global.check('b', 100).allowed, true);
  assert.equal(global.check('c', 100).allowed, false);
  assert.equal(global.check('c', 100 + 15 * 60 * 1000).allowed, true);
}
assert.equal(clientIpForRequest({ headers: { 'x-forwarded-for': '1.2.3.4' }, socket: { remoteAddress: '127.0.0.1' } }, {}), '127.0.0.1');
assert.equal(clientIpForRequest({ headers: { 'x-vercel-forwarded-for': '203.0.113.1' } }, { VERCEL: '1' }), '203.0.113.1');
assert.equal(clientIpForRequest({ headers: { 'x-vercel-forwarded-for': '1.2.3.4, 2.3.4.5' } }, { VERCEL: '1' }), 'unknown');
for (const primitive of [null, true, 1, 'string', [], { toString: null }]) {
  const { api } = mockApi();
  assert.equal((await post(api, primitive)).statusCode, 400);
}
for (const field of ['name', 'email', 'service', 'brief', 'url', 'website', 'company_url', 'idempotencyKey']) {
  for (const invalid of [null, {}, [], 2, true]) {
    assert.equal(validateEnquiryPayload(basePayload({ [field]: invalid })).ok, false);
  }
}
{
  const { api } = mockApi({ mailerFactory() { throw new Error('PRIVATE SECRET'); } });
  const result = await post(api, basePayload());
  assert.equal(result.statusCode, 502);
  assert.doesNotMatch(result.body, /PRIVATE SECRET/);
}
for (const send of [() => { throw new Error('PRIVATE SECRET'); }, () => Promise.reject(new Error('PRIVATE SECRET')), () => new Promise(() => {})]) {
  const { api } = mockApi({ mailerFactory: () => ({ send }), sendTimeoutMs: 15 });
  const res = await post(api, basePayload());
  assert.equal(res.statusCode, 502);
  assert.doesNotMatch(res.body, /PRIVATE SECRET/);
  assert.equal((await post(api, basePayload())).statusCode, 502); // retain uncertain reservation
}
{
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const google = { clientEmail: 'test@local-test.iam.gserviceaccount.com', privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(), delegatedUser: 'enquiries@example.com' };
  const config = { fromName: 'Digital Den', fromAddress: google.delegatedUser, google };
  const email = { to: 'enquiries@example.com', from: 'enquiries@example.com', subject: '你好', text: 'Body' };
  for (const ack of [{}, { id: '' }, { id: ' ' }, { id: 12 }, null]) {
    const mailer = createGoogleWorkspaceMailer(config, { tokenFetcher: async () => ({ ok: true, accessToken: 'local-token' }), fetchImpl: async () => ({ ok: true, json: async () => ack }) });
    assert.equal((await mailer.send(email)).ok, false);
  }
  let raw;
  const mailer = createGoogleWorkspaceMailer(config, { tokenFetcher: async () => ({ ok: true, accessToken: 'local-token' }), fetchImpl: async (_, init) => { raw = Buffer.from(JSON.parse(init.body).raw, 'base64url').toString(); return { ok: true, json: async () => ({ id: 'actual-gmail-id' }) }; } });
  assert.equal((await mailer.send(email)).messageId, 'actual-gmail-id');
  assert.match(raw, /Subject: =\?UTF-8\?B\?/);
  for (const field of ['to', 'from', 'subject']) assert.equal((await mailer.send({ ...email, [field]: 'A\r\nBcc: victim@example.com' })).ok, false);
  const hanging = async () => new Promise(() => {});
  for (const deps of [
    { fetchImpl: hanging },
    { fetchImpl: async () => ({ ok: true, json: hanging }) },
    { tokenFetcher: hanging },
    { tokenFetcher: async () => ({ ok: true, accessToken: 'test-token' }), fetchImpl: hanging },
    { tokenFetcher: async () => ({ ok: true, accessToken: 'test-token' }), fetchImpl: async () => ({ ok: true, json: hanging }) },
    { fetchImpl: async () => { throw new Error('PRIVATE SECRET'); } },
  ]) {
    assert.equal((await createGoogleWorkspaceMailer(config, { ...deps, timeoutMs: 15 }).send(email)).ok, false);
  }
  let aborted = false;
  await createGoogleWorkspaceMailer(config, { timeoutMs: 15, fetchImpl: async (_, init) => new Promise(() => { init.signal.addEventListener('abort', () => { aborted = true; }); }) }).send(email);
  assert.equal(aborted, true);
  const workspaceEnv = validEnv({ DD_ENQUIRY_GOOGLE_AUTH_MODE: 'service_account', DD_ENQUIRY_MAIL_PROVIDER: 'google_workspace', DD_ENQUIRY_GOOGLE_CLIENT_EMAIL: google.clientEmail, DD_ENQUIRY_GOOGLE_PRIVATE_KEY: google.privateKey, DD_ENQUIRY_GOOGLE_DELEGATED_USER: google.delegatedUser });
  assert.equal(loadEnquiryConfig(workspaceEnv).reason, 'release_not_approved');
  assert.equal(RELEASE_APPROVED, false);
  const aliasEnv = {
    ...workspaceEnv,
    DD_ENQUIRY_FROM_ADDRESS: 'dd@quizandrise.com',
    DD_ENQUIRY_GOOGLE_DELEGATED_USER: 'ceo@quizandrise.com',
    DD_ENQUIRY_GOOGLE_APPROVED_ALIAS: 'dd@quizandrise.com',
  };
  const injected = { injectedTestMailer: true };
  const mockAliasEnv = { ...aliasEnv, DD_ENQUIRY_MAIL_PROVIDER: 'mock' };
  const validatedAlias = loadEnquiryConfig(mockAliasEnv, injected);
  assert.equal(validatedAlias.ok, true); // validation only; no production gate bypass
  assert.equal(validatedAlias.config.google.delegatedUser, 'ceo@quizandrise.com');
  assert.equal(validatedAlias.config.fromAddress, 'dd@quizandrise.com');
  assert.equal(loadEnquiryConfig({ ...workspaceEnv, DD_ENQUIRY_MAIL_PROVIDER: 'mock' }, injected).ok, true);
  assert.equal(loadEnquiryConfig({ ...mockAliasEnv, DD_ENQUIRY_FROM_ADDRESS: 'ceo@quizandrise.com', DD_ENQUIRY_GOOGLE_APPROVED_ALIAS: '' }, injected).ok, true);
  assert.equal(loadEnquiryConfig(aliasEnv).reason, 'release_not_approved');
  assert.equal(loadEnquiryConfig(aliasEnv, injected).reason, 'release_not_approved');
  for (const marker of [{ NODE_ENV: 'production' }, { VERCEL: '1' }, { VERCEL_ENV: 'preview' }]) {
    assert.equal(loadEnquiryConfig({ ...mockAliasEnv, ...marker }, injected).ok, false);
  }
  const invalidAliases = [
    { DD_ENQUIRY_GOOGLE_APPROVED_ALIAS: undefined },
    { DD_ENQUIRY_GOOGLE_APPROVED_ALIAS: '' },
    { DD_ENQUIRY_GOOGLE_APPROVED_ALIAS: 'other@quizandrise.com' },
    { DD_ENQUIRY_GOOGLE_APPROVED_ALIAS: 'dd@quizandrise.com,dd@quizandrise.com' },
    { DD_ENQUIRY_GOOGLE_APPROVED_ALIAS: ['dd@quizandrise.com'] },
    { DD_ENQUIRY_GOOGLE_APPROVED_ALIAS: ' dd@quizandrise.com' },
    { DD_ENQUIRY_FROM_ADDRESS: 'other@quizandrise.com' },
    { DD_ENQUIRY_FROM_ADDRESS: 'dd@quizandrise.com.evil.test' },
    { DD_ENQUIRY_FROM_ADDRESS: 'DD@quizandrise.com' },
    { DD_ENQUIRY_FROM_ADDRESS: 'ceo@quizandrise.com' },
    { DD_ENQUIRY_FROM_ADDRESS: 'dd@quizandrise..com' },
    { DD_ENQUIRY_FROM_ADDRESS: 'dd@-quizandrise.com' },
    { DD_ENQUIRY_GOOGLE_DELEGATED_USER: 'other@quizandrise.com' },
    { DD_ENQUIRY_GOOGLE_DELEGATED_USER: 'ceo@quizandrise.com.evil.test' },
    { DD_ENQUIRY_GOOGLE_DELEGATED_USER: '' },
  ];
  for (const field of ['DD_ENQUIRY_FROM_ADDRESS', 'DD_ENQUIRY_GOOGLE_DELEGATED_USER', 'DD_ENQUIRY_GOOGLE_APPROVED_ALIAS']) {
    for (const control of ['\r', '\n', '\0', '\x7f', '\u0085', '\u2028', '\u2029']) {
      invalidAliases.push({ [field]: aliasEnv[field] + control });
    }
  }
  for (const overrides of invalidAliases) {
    assert.equal(loadEnquiryConfig({ ...mockAliasEnv, ...overrides }, injected).ok, false);
    assert.equal(loadEnquiryConfig({ ...aliasEnv, ...overrides }).ok, false);
  }
  for (const address of ['sender@bad.-domain.com', 'sender@bad-.example.com', 'sender@bad..example.com']) {
    assert.equal(loadEnquiryConfig({ ...workspaceEnv, DD_ENQUIRY_FROM_ADDRESS: address, DD_ENQUIRY_GOOGLE_DELEGATED_USER: address }).ok, false);
  }
  let aliasRaw;
  let tokenCalls = 0;
  const aliasConfig = { ...validatedAlias.config, google: { ...validatedAlias.config.google, privateKey: google.privateKey } };
  const aliasDeps = {
    tokenFetcher: async jwt => {
      tokenCalls++;
      assert.equal(JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url')).sub, 'ceo@quizandrise.com');
      return { ok: true, accessToken: 'synthetic-token' };
    },
    fetchImpl: async (_, init) => {
      aliasRaw = Buffer.from(JSON.parse(init.body).raw, 'base64url').toString();
      return { ok: true, json: async () => ({ id: 'synthetic-alias-id' }) };
    },
  };
  const aliasMailer = createGoogleWorkspaceMailer(aliasConfig, aliasDeps);
  assert.equal((await aliasMailer.send({ ...email, from: 'dd@quizandrise.com' })).ok, true);
  assert.match(aliasRaw, /From: .* <dd@quizandrise\.com>\r\n/);
  for (const from of ['other@quizandrise.com', 'ceo@quizandrise.com']) {
    assert.equal((await aliasMailer.send({ ...email, from })).ok, false);
  }
  for (const googleOverride of [{ approvedAlias: '' }, { approvedAlias: 'other@quizandrise.com' }, { delegatedUser: 'other@quizandrise.com' }]) {
    const invalidMailer = createGoogleWorkspaceMailer({ ...aliasConfig, google: { ...aliasConfig.google, ...googleOverride } }, aliasDeps);
    assert.equal((await invalidMailer.send({ ...email, from: 'dd@quizandrise.com' })).ok, false);
  }
  assert.equal(tokenCalls, 1); // invalid identities fail before even the injected token exchange
  for (const overrides of [
    { DD_ENQUIRY_FROM_ADDRESS: 'other@example.com' }, { DD_ENQUIRY_GOOGLE_PRIVATE_KEY: 'bad' },
    { DD_ENQUIRY_GOOGLE_CLIENT_EMAIL: 'wrong@example.com' }, { DD_ENQUIRY_FROM_NAME: 'Name\r\nBcc: evil' },
    { DD_ENQUIRY_INBOX_TO: 'bad' }, { DD_ENQUIRY_ALLOWED_ORIGINS: 'https://example.com/path' },
  ]) assert.equal(loadEnquiryConfig({ ...workspaceEnv, ...overrides }).ok, false);
}
assert.equal(validateEnquiryPayload(basePayload({ url: 'https://user:password@example.com' })).ok, false);
for (const origin of [undefined, '', 'null', 'https://example.com/', 'https://example.com/path', 'https://u:p@example.com', 'https://example.com,https://evil.test']) {
  const { api } = mockApi();
  assert.equal((await post(api, basePayload(), { origin })).statusCode, 403);
  assert.equal(validOrigin(origin), false);
}
for (const type of ['text/application/json', 'application/jsonp', 'application/json;foo=bar', 'application/json, text/plain']) {
  const { api } = mockApi();
  assert.equal((await post(api, basePayload(), { 'content-type': type })).statusCode, 415);
}
{
  const { api } = mockApi();
  assert.equal((await post(api, basePayload(), { 'content-type': 'application/json; charset=utf-8' })).statusCode, 200);
  assert.equal((await post(api, basePayload(), { 'content-length': '12289' })).statusCode, 413);
  assert.equal((await post(api, basePayload({ brief: 'x'.repeat(13000) }))).statusCode, 413);
  assert.equal((await api.handle({ method: 'POST', headers: { origin: ['https://example.com'] } })).statusCode, 400);
  const circular = {}; circular.self = circular;
  assert.equal((await api.handle({ method: 'POST', headers: { origin: 'https://example.com', 'content-type': 'application/json' }, body: circular })).statusCode, 500);
}
// Completed reservations expire; pending reservations are never pruned.
{
  let now = 100;
  const store = createMemoryIdempotencyStore({ maxEntries: 1, ttlMs: 10, now: () => now });
  let finish;
  const reserved = store.reserve('key', 'a', () => new Promise(resolve => { finish = resolve; }));
  await Promise.resolve();
  now = 1000;
  assert.equal(store.reserve('other', 'b', async () => ({})).full, true);
  finish({ ok: true }); await reserved.promise;
  assert.equal(store.reserve('key', 'a', async () => ({})).duplicate, true);
  now += 11;
  assert.equal(store.reserve('key', 'b', async () => ({})).duplicate, false);
}
{
  const { api } = mockApi();
  assert.equal((await api.handle({ method: 'OPTIONS', headers: { origin: 'https://example.com' } })).statusCode, 204);
  assert.equal((await api.handle({ method: 'OPTIONS', headers: {} })).statusCode, 403);
  assert.equal((await api.handle({ method: 'GET', headers: { origin: 'https://example.com' } })).statusCode, 405);
  assert.equal((await api.handle({ method: 'POST', headers: { origin: 'https://example.com', 'content-type': 'application/json' }, rawBody: '{broken' })).statusCode, 400);
  assert.equal((await post(api, basePayload(), { Origin: 'https://example.com' })).statusCode, 400);
}
// Browser script executes in a synthetic DOM; storage always throws. Temporarily
// enable only this in-memory script copy to exercise the gated submission flow.
{
  const page = readFileSync(path.join(root, 'minimal-enquiry.html'), 'utf8');
  assert.match(page, /var RELEASE_APPROVED = false/);
  assert.ok(/This notice must be checked against actual provider settings before live collection/.test(page), 'Privacy release blocker must remain visible');
  const script = page.match(/<script>([\s\S]*?)<\/script>/)[1].replace('var RELEASE_APPROVED = false', 'var RELEASE_APPROVED = true');
  const listeners = {};
  const elements = Object.fromEntries(['minimal-enquiry-form', 'notice', 'submit', 'privacy', 'name', 'email', 'service', 'brief', 'url', 'website'].map(id => [id, { value: '', checked: true, addEventListener(type, fn) { listeners[type] = fn; } }]));
  const form = elements['minimal-enquiry-form'];
  form.checkValidity = () => true; form.reportValidity = () => {}; form.reset = () => {};
  let finish, calls = 0;
  runInNewContext(script, {
    document: { getElementById: id => elements[id] },
    sessionStorage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); }, removeItem() { throw Error('blocked'); } },
    crypto: { randomUUID: () => 'local-ui-key' },
    fetch: () => { calls++; return new Promise(resolve => { finish = resolve; }); },
  });
  const pending = listeners.submit({ preventDefault() {} });
  listeners.input();
  assert.equal(elements.submit.disabled, true);
  await listeners.submit({ preventDefault() {} });
  assert.equal(calls, 1);
  finish({ ok: true, json: async () => ({ ok: true, message: 'Accepted' }) });
  await pending;
  assert.equal(elements.notice.textContent, 'Accepted');
  assert.equal(elements.submit.disabled, true);
  listeners.change();
  assert.equal(elements.submit.disabled, true);
  assert.equal(elements.submit.textContent, 'Enquiry accepted');
}
await import('./test-minimal-enquiry-oauth.mjs');
console.log('test-minimal-enquiry: existing and adversarial assertions passed (mock-only)');
