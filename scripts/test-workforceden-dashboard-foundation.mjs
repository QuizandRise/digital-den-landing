import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ROUTE_POLICY } from "../dashboard-next/src/config.js";
import { FINANCIAL_FIELDS, normalizeFinancialRecord } from "../dashboard-next/src/financial-contract.js";
import { PLATFORM_CONFIG, ROLE_PRESENTATION, normalizeProjectPresentation, roleLabel } from "../dashboard-next/src/platform-config.js";

assert.equal(PLATFORM_CONFIG.platformName, "WorkforceDen");
assert.equal(PLATFORM_CONFIG.tenantId, null);
assert.equal(roleLabel("team_member"), "Professional");
assert.equal(ROLE_PRESENTATION.team_member.projectRoute, "assigned_work");
assert.equal(ROLE_PRESENTATION.manager.projectRoute, "projects");
assert.equal(ROLE_PRESENTATION.client.projectRoute, "projects");
assert.ok(ROUTE_POLICY.manager.includes("financials"));
assert.ok(ROUTE_POLICY.client.includes("billing"));
assert.ok(ROUTE_POLICY.team_member.includes("earnings"));

const project = normalizeProjectPresentation({ id: "scope-only" });
assert.deepEqual({ platform: project.platform, serviceBrand: project.serviceBrand, serviceType: project.serviceType, tenantId: project.tenantId }, {
  platform: "workforceden", serviceBrand: "digital_den", serviceType: null, tenantId: null,
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

const app = await readFile("dashboard-next/src/app.js", "utf8");
const projectWorkspace = await readFile("dashboard-next/src/project-workspace-safe.js", "utf8");
const messages = await readFile("dashboard-next/src/messaging-actions.js", "utf8");
const fileUpload = await readFile("dashboard-next/src/file-upload-actions.js", "utf8");
const fileReview = await readFile("dashboard-next/src/file-review-download-actions.js", "utf8");

assert.match(app, /app\.dataset\.actorRole=state\.role/);
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
assert.match(projectWorkspace, /project\.returnRoute = currentRoute\(\) === "assigned_work" \? "assigned_work" : "projects"/);
assert.match(projectWorkspace, /role === "manager" \? `<a class="button secondary project-quick-action" href="#team">Assign professional/);

console.log("WorkforceDen dashboard foundation tests passed.");
