import assert from "node:assert/strict";
import { createMockDashboardAdapter } from "../dashboard-next/src/services/mock-dashboard-adapter.js";
import { presentMessageForRole } from "../dashboard-next/src/message-presentation.js";
import { ROLE_CAPABILITIES } from "../dashboard-next/src/platform-config.js";

const adapter = createMockDashboardAdapter();

const manager = await adapter.getActor("manager");
const teamMember = await adapter.getActor("team_member");
const client = await adapter.getActor("client");

assert.equal(manager.label, "Manager preview");
assert.equal(teamMember.label, "Team member preview");
assert.equal(client.label, "Client preview");

const managerOverview = await adapter.getOverview("manager");
const teamOverview = await adapter.getOverview("team_member");
const clientOverview = await adapter.getOverview("client");

assert.ok(managerOverview.reviews.length > 0, "Manager overview should expose review queue data");
assert.equal(teamOverview.reviews.length, 0, "Team-member overview must not expose manager review data");
assert.equal(clientOverview.reviews.length, 0, "Client overview must not expose manager review data");
assert.ok(managerOverview.flaggedMessageCount > 0, "Manager overview should expose moderation count");
assert.equal(teamOverview.flaggedMessageCount, 0, "Team-member overview must not expose moderation count");
assert.equal(clientOverview.flaggedMessageCount, 0, "Client overview must not expose moderation count");

assert.equal(ROLE_CAPABILITIES.manager.startProject, true, "Manager may retain the New project action");
assert.equal(ROLE_CAPABILITIES.client.startProject, false, "Client project creation is not enabled by current policy");
assert.equal(ROLE_CAPABILITIES.team_member.startProject, false, "Professional must not see the New project action");
assert.equal(ROLE_CAPABILITIES.manager.viewProjectAudit, true, "Manager may view project audit information");
assert.equal(ROLE_CAPABILITIES.client.viewProjectAudit, false, "Client must not view project audit information");
assert.equal(ROLE_CAPABILITIES.team_member.viewProjectAudit, false, "Professional must not view project audit information");

const internalMessage = { project: "scoped", from: "System", text: "Internal policy reason", time: "now", state: "flagged", policyReason: "manager-only" };
assert.equal(presentMessageForRole(internalMessage, "manager"), internalMessage, "Manager must retain full moderation detail");
for (const role of ["client", "team_member"]) {
  const message = presentMessageForRole(internalMessage, role);
  assert.equal(message.text, "Message under review", `${role} should receive neutral moderation text`);
  assert.equal(message.state, "under_review", `${role} should not receive the internal flagged state`);
  assert.equal("policyReason" in message, false, `${role} should not receive policy metadata`);
}

const requiredReadMethods = [
  "getActor",
  "getOverview",
  "getProjects",
  "getReviews",
  "getMessages",
  "getFiles",
  "getClients",
  "getTeam",
  "getAuditEvents",
  "getCommunicationPolicies",
];

for (const method of requiredReadMethods) {
  assert.equal(typeof adapter[method], "function", `Missing read method: ${method}`);
}

for (const method of ["create", "update", "delete", "approve", "assign", "send", "upload", "pay"]) {
  assert.equal(adapter[method], undefined, `Forbidden write method exposed: ${method}`);
}

console.log("Digital Den role-isolation foundation tests passed.");
