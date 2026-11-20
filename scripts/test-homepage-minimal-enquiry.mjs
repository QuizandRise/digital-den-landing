import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext, Script } from 'node:vm';
import { validateEnquiryPayload } from '../src/minimal-enquiry/validate.js';
import { ALLOWED_SERVICES } from '../src/minimal-enquiry/constants.js';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = page.match(/<script>([\s\S]*?)<\/script>/)[1];
new Script(script);
assert.doesNotMatch(page, /digital-den-api\.vercel\.app|create-project|\/api\/digital-den\/session|termsAccepted|companyName/);
assert.match(script, /const DD_HOMEPAGE_CUTOVER_APPROVED = false;/);
assert.match(page, /<fieldset id="enquiry-fields" disabled/);
assert.match(page, /<button id="submit"[^>]* disabled>/);
assert.match(page, /<form id="minimal-enquiry-form" method="dialog"/); // no native network fallback
assert.doesNotMatch(page.match(/<form[\s\S]*?<\/form>/)[0], /\saction=|formaction=/);
for (const text of ['12 months after our last substantive correspondence', '6 Sicily Road, Inverness, IV2 3YL', 'privacy@quizandrise.com', 'Google Workspace', 'Vercel', 'Article 6(1)(b)', 'Article 6(1)(f)']) assert.ok(page.includes(text), text);
const options = [...page.match(/<select id="service"[\s\S]*?<\/select>/)[0].matchAll(/<option>(.*?)<\/option>/g)].map(m => m[1]);
assert.deepEqual(options, ALLOWED_SERVICES);

function browser({ enabled = false, storageFails = false, store = new Map(), fetchImpl } = {}) {
  const listeners = {}, calls = [];
  const ids = ['minimal-enquiry-form', 'enquiry-fields', 'submit', 'notice', 'privacy', 'name', 'email', 'service', 'brief', 'url', 'website', 'enquiry-gate'];
  const elements = Object.fromEntries(ids.map(id => [id, { value: '', checked: true, disabled: true, addEventListener(type, fn) { listeners[type] = fn; } }]));
  Object.assign(elements.name, { value: 'Test Person' });
  elements.email.value = 'test@example.com'; elements.service.value = 'Website Design'; elements.brief.value = 'A local mock enquiry';
  const form = elements['minimal-enquiry-form'];
  form.checkValidity = () => true; form.reportValidity = () => {}; form.reset = () => {};
  const storage = Object.fromEntries(['getItem', 'setItem', 'removeItem'].map(action => [action, (key, value) => {
    if (storageFails) throw Error('Storage blocked');
    if (action === 'getItem') return store.get(key);
    if (action === 'setItem') store.set(key, value); else if (action === 'removeItem') store.delete(key);
  }]));
  runInNewContext(enabled ? script.replace('DD_HOMEPAGE_CUTOVER_APPROVED = false', 'DD_HOMEPAGE_CUTOVER_APPROVED = true') : script, {
    document: { getElementById: id => elements[id], querySelectorAll: () => [], addEventListener: (_, fn) => fn() },
    sessionStorage: storage, URL, crypto: { randomUUID: () => 'mock-stable-key' },
    fetch: async (url, init) => { calls.push({ url, init }); return fetchImpl?.(url, init) ?? { status: 200, json: async () => ({ ok: true }) }; },
  });
  return { elements, listeners, calls, store, submit: () => listeners.submit({ preventDefault() {} }) };
}
{
  const ui = browser({ enabled: true });
  ui.elements.name.value = '   ';
  await ui.submit();
  assert.equal(ui.calls.length, 0, 'Whitespace-only name must never send a request');
  assert.match(ui.elements.notice.className, /error/);
  ui.elements.name.value = 'Corrected Name';
  await ui.submit();
  assert.equal(ui.calls.length, 1, 'A corrected name can be submitted');
}
{
  let rejected = true;
  const ui = browser({ enabled: true, fetchImpl: async () => rejected
    ? {status:400,json:async()=>({ok:false,error:'validation_failed'})}
    : {status:200,json:async()=>({ok:true})} });
  await ui.submit();
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.elements['enquiry-fields'].disabled, false, 'Definite validation failure must unlock fields');
  ui.elements.brief.value = 'Corrected enquiry brief';
  rejected = false;
  await ui.submit();
  assert.equal(ui.calls.length, 2);
  assert.notEqual(ui.calls[0].init.body, ui.calls[1].init.body, 'Corrected input must change payload');
  assert.match(ui.elements.notice.className, /success/);
}
for (const storageFails of [false, true]) {
  const ui = browser({ storageFails });
  ui.elements.submit.disabled = false; // even a synthetic/programmatic submit cannot bypass the constant
  await ui.submit(); ui.listeners.input(); ui.listeners.change();
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.elements.submit.disabled, true);
  assert.equal(ui.elements['enquiry-fields'].disabled, true);
}
for (const status of [403, 429, 502, 503, 409]) {
  const ui = browser({ enabled: true, fetchImpl: async () => ({ status, json: async () => ({ ok: false, message: '<private provider detail>' }) }) });
  await ui.submit();
  assert.match(ui.elements.notice.className, /error/);
  assert.doesNotMatch(ui.elements.notice.textContent, /private provider/);
  if (status === 502) assert.match(ui.elements.notice.textContent, /uncertain/);
  const first = ui.calls[0];
  assert.equal(first.url, '/api/minimal-enquiry');
  assert.equal(first.init.mode, 'same-origin'); assert.equal(first.init.credentials, 'omit'); assert.equal(first.init.redirect, 'error');
  const payload = JSON.parse(first.init.body);
  assert.equal(validateEnquiryPayload(payload).ok, true);
  assert.equal(first.init.headers['Idempotency-Key'], payload.idempotencyKey);
  ui.elements.brief.value = 'Changed after uncertainty';
  await ui.submit();
  assert.equal(ui.calls[1].init.body, first.init.body); // exact payload and key retained
  assert.equal(ui.elements['enquiry-fields'].disabled, true);
}
{
  let finish;
  const ui = browser({ enabled: true, storageFails: true, fetchImpl: () => new Promise(resolve => { finish = resolve; }) });
  const pending = ui.submit(); ui.listeners.input(); await ui.submit();
  assert.equal(ui.calls.length, 1); assert.equal(ui.elements.submit.disabled, true);
  finish({ status: 200, json: async () => ({ ok: true, message: '<untrusted>' }) }); await pending;
  assert.match(ui.elements.notice.textContent, /does not confirm inbox delivery/);
  assert.doesNotMatch(ui.elements.notice.textContent, /untrusted/);
  await ui.submit(); assert.equal(ui.calls.length, 1); assert.equal(ui.elements.submit.disabled, true);
}
{
  const ui = browser({ enabled: true, fetchImpl: async () => { throw Error('private network detail'); } });
  await ui.submit(); await ui.submit();
  assert.equal(ui.calls[0].init.body, ui.calls[1].init.body);
  assert.match(ui.elements.notice.textContent, /uncertain/);
  const reloaded = browser({ enabled: true, store: ui.store }); await reloaded.submit();
  assert.equal(JSON.parse(reloaded.calls[0].init.body).idempotencyKey, JSON.parse(ui.calls[0].init.body).idempotencyKey);
}
for (const mutate of [ui => { ui.elements.privacy.checked = false; }, ui => { ui.elements.website.value = 'spam'; }, ui => { ui.elements.url.value = 'https://user:password@example.com'; }, ui => { ui.elements.url.value = 'javascript:alert(1)'; }, ui => { ui.elements['minimal-enquiry-form'].checkValidity = () => false; }]) {
  const ui = browser({ enabled: true }); mutate(ui); await ui.submit(); assert.equal(ui.calls.length, 0);
}
for (const response of [{ status: 200, json: async () => ({ ok: false }) }, { status: 200, json: async () => { throw Error('Malformed'); } }]) {
  const ui = browser({ enabled: true, fetchImpl: async () => response }); await ui.submit();
  assert.match(ui.elements.notice.className, /error/);
}
console.log('Homepage minimal enquiry: gate, payload, retry and response checks passed (mock-only).');
