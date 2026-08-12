import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { invitationWasSent } from "../dashboard-next/src/invitation-status.js";

assert.equal(invitationWasSent({ invitation: { sent: true } }), true, "nested invitation.sent must map true");
assert.equal(invitationWasSent({ invitationSent: true }), true, "legacy invitationSent must map true");
assert.equal(invitationWasSent({ invitation: { sent: true }, invitationSent: false }), true, "nested sent takes precedence when true");
assert.equal(invitationWasSent({ invitation: { sent: false }, invitationSent: true }), false, "explicit false sent must not fall through");
assert.equal(invitationWasSent({ invitation: { sent: false } }), false);
assert.equal(invitationWasSent({ invitationSent: false }), false);
assert.equal(invitationWasSent({}), false);
assert.equal(invitationWasSent(null), false);
assert.equal(invitationWasSent(undefined), false);

const adapter = readFileSync("dashboard-next/src/services/staging-http-adapter.js", "utf8");
assert.match(adapter, /invitationWasSent/);
assert.match(adapter, /from "\.\.\/invitation-status\.js"/);
assert.equal((adapter.match(/invitationWasSent\(payload\)/g) || []).length, 3, "create, update and resend must use the helper");
assert.doesNotMatch(adapter, /Boolean\(payload\.invitationSent\)/);

const helper = readFileSync("dashboard-next/src/invitation-status.js", "utf8");
assert.doesNotMatch(helper, /@gmail\.com|abdul|mashhoon|invitation link|http/i);
assert.doesNotMatch(adapter, /@gmail\.com|abdulhamid/i);

console.log("Digital Den invitation status mapping tests passed.");
