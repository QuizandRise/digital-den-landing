import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FEATURE_FLAGS, ROUTE_POLICY } from "../dashboard-next/src/config.js";

assert.equal(FEATURE_FLAGS.assignments, false, "frontend must not open assignments from host authentication alone");
assert.ok(ROUTE_POLICY.manager.includes("assignments"));
assert.ok(ROUTE_POLICY.team_member.includes("my_assignments"));
assert.ok(!ROUTE_POLICY.client.includes("assignments"));
assert.ok(!ROUTE_POLICY.client.includes("my_assignments"));

const config = readFileSync("dashboard-next/src/config.js", "utf8");
assert.doesNotMatch(config, /assignments:\s*AUTHENTICATED_WORKSPACE/);

const app = readFileSync("dashboard-next/src/app.js", "utf8");
assert.match(app, /function assignmentsCapabilityEnabled/);
assert.match(app, /caps\.assignmentsEnabled === true/);
assert.match(app, /function allowedRoutes/);
assert.match(app, /ASSIGNMENT_VIEWS/);

// Production with capability disabled: nav filter excludes assignment routes.
const productionDisabled = (() => {
  const role = "manager";
  const actor = { role, agencyCapabilities: { assignmentsEnabled: false } };
  const routes = ROUTE_POLICY[role].filter(key => {
    if (!["assignments", "my_assignments"].includes(key)) return true;
    if (role === "client") return false;
    return actor.agencyCapabilities?.assignmentsEnabled === true;
  });
  return routes;
})();
assert.ok(!productionDisabled.includes("assignments"));

// TEST with capability enabled: manager/team routes remain, client never.
const testEnabledManager = (() => {
  const role = "manager";
  const actor = { role, agencyCapabilities: { assignmentsEnabled: true } };
  return ROUTE_POLICY[role].filter(key => {
    if (!["assignments", "my_assignments"].includes(key)) return true;
    if (role === "client") return false;
    return actor.agencyCapabilities?.assignmentsEnabled === true;
  });
})();
assert.ok(testEnabledManager.includes("assignments"));

const testEnabledClient = (() => {
  const role = "client";
  const actor = { role, agencyCapabilities: { assignmentsEnabled: true } };
  return ROUTE_POLICY[role].filter(key => {
    if (!["assignments", "my_assignments"].includes(key)) return true;
    if (role === "client") return false;
    return actor.agencyCapabilities?.assignmentsEnabled === true;
  });
})();
assert.ok(!testEnabledClient.includes("assignments"));
assert.ok(!testEnabledClient.includes("my_assignments"));

const assignmentUi = readFileSync("dashboard-next/src/assignment-actions.js", "utf8");
assert.match(assignmentUi, /permittedActions/);
assert.match(assignmentUi, /mark_under_review/);
assert.match(assignmentUi, /release_hold/);
assert.match(assignmentUi, /view=capabilities/);
assert.doesNotMatch(assignmentUi, /data-action="mark_paid"/);

console.log("Digital Den assignment capability tests passed.");
