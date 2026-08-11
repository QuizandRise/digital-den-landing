import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ROUTE_POLICY } from "../dashboard-next/src/config.js";
import { FINANCIAL_FIELDS, normalizeFinancialRecord } from "../dashboard-next/src/financial-contract.js";
import { PLATFORM_CONFIG, ROLE_CAPABILITIES, ROLE_PRESENTATION, normalizeProjectPresentation, roleLabel } from "../dashboard-next/src/platform-config.js";
import { presentMessageForRole } from "../dashboard-next/src/message-presentation.js";

assert.equal(PLATFORM_CONFIG.platformName, "Digital Den");
assert.equal(PLATFORM_CONFIG.tenantId, null);
assert.equal(PLATFORM_CONFIG.featureFlags.marketplace, false);
assert.equal(PLATFORM_CONFIG.featureFlags.publicProviderDirectory, false);
assert.equal(PLATFORM_CONFIG.featureFlags.workerBidding, false);
assert.equal(PLATFORM_CONFIG.featureFlags.realPaymentExecution, false);
assert.equal(roleLabel("team_member"), "Team Member");
assert.equal(ROLE_CAPABILITIES.manager.startProject, true);
assert.equal(ROLE_CAPABILITIES.client.startProject, false);
assert.equal(ROLE_CAPABILITIES.team_member.startProject, false);
assert.equal(ROLE_CAPABILITIES.manager.assignInternalResources, true);
assert.equal(ROLE_CAPABILITIES.team_member.assignInternalResources, false);
assert.equal(ROLE_CAPABILITIES.team_member.setClientPrice, false);
assert.equal(ROLE_CAPABILITIES.client.viewInternalCompensation, false);
assert.equal(ROLE_CAPABILITIES.manager.viewProjectAudit, true);
assert.equal(ROLE_CAPABILITIES.client.viewProjectAudit, false);
assert.equal(ROLE_CAPABILITIES.team_member.viewProjectAudit, false);
assert.equal(ROLE_PRESENTATION.team_member.projectRoute, "assigned_work");
assert.equal(ROLE_PRESENTATION.manager.projectRoute, "projects");
assert.equal(ROLE_PRESENTATION.client.projectRoute, "projects");
assert.ok(ROUTE_POLICY.manager.includes("financials"));
assert.ok(ROUTE_POLICY.client.includes("billing"));
assert.ok(ROUTE_POLICY.team_member.includes("earnings"));

const project = normalizeProjectPresentation({ id: "scope-only" });
assert.deepEqual({ platform: project.platform, serviceBrand: project.serviceBrand, serviceType: project.serviceType, tenantId: project.tenantId, projectSource: project.projectSource, isAgencyProject: project.isAgencyProject }, {
  platform: "digital_den", serviceBrand: "digital_den", serviceType: null, tenantId: null, projectSource: "direct", isAgencyProject: true,
});

const financial = normalizeFinancialRecord();
for (const value of Object.values(financial)) {
  assert.ok(value === null || Array.isArray(value), "Empty financial records must not invent values");
}
assert.ok(!FINANCIAL_FIELDS.client.includes("platformFee"));
assert.ok(!FINANCIAL_FIELDS.client.includes("professionalAllocation"));
assert.ok(!FINANCIAL_FIELDS.team_member.includes("contractValue"));
assert.ok(!FINANCIAL_FIELDS.team_member.includes("platformFee"));
assert.ok(FINANCIAL_FIELDS.manager.includes("platformFee"));

const flaggedMessage = { project: "scoped-project", from: "System", text: "Blocked for internal policy reason", time: "now", state: "flagged", policyReason: "internal-only" };
assert.deepEqual(presentMessageForRole(flaggedMessage, "manager"), flaggedMessage);
for (const role of ["client", "team_member"]) {
  const presented = presentMessageForRole(flaggedMessage, role);
  assert.equal(presented.text, "Message under review");
  assert.equal(presented.state, "under_review");
  assert.equal(presented.from, "Digital Den");
  assert.equal("policyReason" in presented, false);
  assert.doesNotMatch(JSON.stringify(presented), /flagged|internal policy reason|internal-only/i);
}

const app = await readFile("dashboard-next/src/app.js", "utf8");
const projectWorkspace = await readFile("dashboard-next/src/project-workspace-safe.js", "utf8");
const messages = await readFile("dashboard-next/src/messaging-actions.js", "utf8");
const fileUpload = await readFile("dashboard-next/src/file-upload-actions.js", "utf8");
const fileReview = await readFile("dashboard-next/src/file-review-download-actions.js", "utf8");

assert.match(app, /app\.dataset\.actorRole=state\.role/);
assert.match(app, /newProjectButton\.hidden=!ROLE_CAPABILITIES\[state\.role\]\?\.startProject/);
assert.match(app, /id="message-capability-slot"/);
assert.match(app, /id="file-upload-slot"/);
assert.match(app, /id="file-security-slot"/);
assert.doesNotMatch(app, /Downloads and uploads remain disabled/);
assert.match(messages, /querySelector\("#message-capability-slot"\)/);
assert.match(fileUpload, /querySelector\("#file-upload-slot"\)/);
assert.match(fileReview, /querySelector\("#file-security-slot"\)/);
assert.doesNotMatch(messages, /insertAdjacentHTML\("afterbegin"/);
assert.doesNotMatch(fileUpload, /insertAdjacentHTML\("afterbegin"/);
assert.doesNotMatch(fileReview, /insertAdjacentHTML\("afterbegin"/);

assert.match(projectWorkspace, /actorRole\(\) === "team_member" \? "assigned_work" : "projects"/);
assert.match(projectWorkspace, /route\.tab === "audit" && !canViewProjectAudit \? "overview" : route\.tab/);
assert.match(projectWorkspace, /canViewProjectAudit \? tabLink\(project, "audit", "Audit log", visibleTab\) : ""/);
assert.match(projectWorkspace, /project\.returnRoute = currentRoute\(\) === "assigned_work" \? "assigned_work" : "projects"/);
assert.match(projectWorkspace, /role === "manager" \? `<a class="button secondary project-quick-action" href="#team">Assign team member/);

console.log("Digital Den agency dashboard foundation tests passed.");
