import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { FEATURE_FLAGS, NAVIGATION, ROUTE_POLICY } from "../dashboard-next/src/config.js";
import {
  PLATFORM_CONFIG,
  PROJECT_SOURCES,
  ROLE_CAPABILITIES,
  normalizeProjectPresentation,
  roleLabel,
} from "../dashboard-next/src/platform-config.js";
import { FINANCIAL_FIELDS } from "../dashboard-next/src/financial-contract.js";

assert.equal(PLATFORM_CONFIG.platformName, "Digital Den");
assert.equal(roleLabel("team_member"), "Team Member");
assert.equal(PLATFORM_CONFIG.featureFlags.marketplace, false);
assert.equal(PLATFORM_CONFIG.featureFlags.publicProviderDirectory, false);
assert.equal(PLATFORM_CONFIG.featureFlags.workerBidding, false);
assert.equal(PLATFORM_CONFIG.featureFlags.publicFreelancerProfiles, false);
assert.equal(PLATFORM_CONFIG.featureFlags.realPaymentExecution, false);
assert.equal(PLATFORM_CONFIG.featureFlags.stripeConnect, false);
assert.equal(FEATURE_FLAGS.billing, false);
assert.equal(FEATURE_FLAGS.assignments, false);

assert.deepEqual(PROJECT_SOURCES, [
  "direct",
  "workforceden",
  "external_marketplace",
  "referral",
  "internal",
]);

const wdProject = normalizeProjectPresentation({
  id: "wd-1",
  projectSource: "workforceden",
  externalSourceMetadata: { externalGrossAmount: 900, externalPaymentRestricted: true },
});
assert.equal(wdProject.projectSource, "workforceden");
assert.equal(wdProject.isAgencyProject, true);

const legacy = normalizeProjectPresentation({ source: "digital-den" });
assert.equal(legacy.projectSource, "direct");

assert.equal(ROLE_CAPABILITIES.manager.assignInternalResources, true);
assert.equal(ROLE_CAPABILITIES.team_member.assignInternalResources, false);
assert.equal(ROLE_CAPABILITIES.team_member.setClientPrice, false);
assert.equal(ROLE_CAPABILITIES.client.viewInternalCompensation, false);
assert.equal(ROLE_CAPABILITIES.client.viewInternalNotes, false);

assert.equal(NAVIGATION.my_assignments[1], "My Assignments");
assert.equal(NAVIGATION.assignments[1], "Assignments");
assert.ok(ROUTE_POLICY.team_member.includes("assigned_work"));
assert.ok(ROUTE_POLICY.team_member.includes("my_assignments"));
assert.ok(ROUTE_POLICY.manager.includes("assignments"));
assert.ok(!ROUTE_POLICY.client.includes("team"));
assert.ok(!ROUTE_POLICY.client.includes("assignments"));
assert.ok(!ROUTE_POLICY.client.includes("my_assignments"));
assert.ok(!ROUTE_POLICY.team_member.includes("clients"));
assert.ok(!FINANCIAL_FIELDS.client.includes("professionalAllocation"));
assert.ok(!FINANCIAL_FIELDS.client.includes("platformFee"));

const assignmentUi = readFileSync("dashboard-next/src/assignment-actions.js", "utf8");
assert.match(assignmentUi, /assignment-compensation/);
assert.match(assignmentUi, /Accept assignment/);
assert.match(assignmentUi, /Clients cannot view internal assignments/);
assert.match(assignmentUi, /view=capabilities/);
assert.match(assignmentUi, /permittedActions/);
assert.match(assignmentUi, /capability check failed closed|assignmentsEnabled/);
assert.doesNotMatch(assignmentUi, /stripe\.com|createPayout|Stripe Connect/i);
assert.doesNotMatch(assignmentUi, /data-action="mark_paid"/);

const appSource = readFileSync("dashboard-next/src/app.js", "utf8");
assert.match(appSource, /agencyCapabilities/);
assert.match(appSource, /assignmentsEnabled/);
assert.match(appSource, /allowedRoutes/);

const indexHtml = readFileSync("dashboard-next/index.html", "utf8");
assert.match(indexHtml, /Team Member/);
assert.doesNotMatch(indexHtml, />Professional</);

const projectWorkspace = readFileSync("dashboard-next/src/project-workspace-safe.js", "utf8");
assert.match(projectWorkspace, /Assign team member/);
assert.doesNotMatch(projectWorkspace, /Assign professional/);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

const routeLikeFiles = walk("dashboard-next").concat(["index.html", "workspace-access.html", "internal-access.html"]);
for (const file of routeLikeFiles) {
  const relative = file.replace(/\\/g, "/").toLowerCase();
  for (const forbidden of ["marketplace", "provider-directory", "/providers", "/bidding", "/freelancers", "/sellers"]) {
    assert.equal(relative.includes(forbidden), false, `Unexpected marketplace route surface: ${relative}`);
  }
}

const app = readFileSync("dashboard-next/src/app.js", "utf8");
assert.match(app, /Real payment execution is not enabled|payment execution remains disabled/i);
assert.doesNotMatch(app, /stripe\.com|Stripe Connect|capturePayment|createPayout/i);

console.log("Digital Den agency-scope tests passed.");
