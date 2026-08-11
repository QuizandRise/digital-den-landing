import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FEATURE_FLAGS, ROUTE_POLICY } from "../dashboard-next/src/config.js";
import {
  ASSIGNMENT_VIEWS,
  allowedRoutesFor,
  assignmentsCapabilityEnabled,
  capabilityRequestFailed,
} from "../dashboard-next/src/assignment-capability.js";

assert.equal(FEATURE_FLAGS.assignments, false, "frontend must not open assignments from host authentication alone");
assert.ok(ROUTE_POLICY.manager.includes("assignments"));
assert.ok(ROUTE_POLICY.team_member.includes("my_assignments"));
assert.ok(!ROUTE_POLICY.client.includes("assignments"));
assert.ok(!ROUTE_POLICY.client.includes("my_assignments"));
assert.deepEqual([...ASSIGNMENT_VIEWS], ["assignments", "my_assignments"]);

const config = readFileSync("dashboard-next/src/config.js", "utf8");
assert.doesNotMatch(config, /assignments:\s*AUTHENTICATED_WORKSPACE/);

const app = readFileSync("dashboard-next/src/app.js", "utf8");
assert.match(app, /assignment-capability\.js/);
assert.match(app, /allowedRoutesFor/);

// Disabled capability → no Manager or Team Member assignment navigation.
assert.deepEqual(
  allowedRoutesFor("manager", { agencyCapabilities: { assignmentsEnabled: false } }).filter(key => ASSIGNMENT_VIEWS.includes(key)),
  []
);
assert.deepEqual(
  allowedRoutesFor("team_member", { agencyCapabilities: { assignmentsEnabled: false } }).filter(key => ASSIGNMENT_VIEWS.includes(key)),
  []
);

// Capability failure / missing → fail closed.
assert.equal(assignmentsCapabilityEnabled("manager", null), false);
assert.equal(assignmentsCapabilityEnabled("manager", {}), false);
assert.equal(capabilityRequestFailed({}), true);
assert.deepEqual(
  allowedRoutesFor("manager", {}).filter(key => ASSIGNMENT_VIEWS.includes(key)),
  []
);

// Enabled Manager → Assignments; Team Member → My Assignments; Client never.
assert.ok(
  allowedRoutesFor("manager", { agencyCapabilities: { assignmentsEnabled: true } }).includes("assignments")
);
assert.ok(
  allowedRoutesFor("team_member", { agencyCapabilities: { assignmentsEnabled: true } }).includes("my_assignments")
);
assert.ok(
  !allowedRoutesFor("client", { agencyCapabilities: { assignmentsEnabled: true } }).includes("assignments")
);
assert.ok(
  !allowedRoutesFor("client", { agencyCapabilities: { assignmentsEnabled: true } }).includes("my_assignments")
);

const assignmentUi = readFileSync("dashboard-next/src/assignment-actions.js", "utf8");
assert.match(assignmentUi, /permittedActions/);
assert.match(assignmentUi, /mark_under_review/);
assert.match(assignmentUi, /release_hold/);
assert.match(assignmentUi, /view=capabilities/);
assert.match(assignmentUi, /New Team Member/);
assert.match(assignmentUi, /<select name="teamMemberId"/);
assert.match(assignmentUi, /No alternative Team Member is available for reassignment/);
assert.match(assignmentUi, /cancellationCompensationDecision/);
assert.doesNotMatch(assignmentUi, /New Team Member id/);
assert.doesNotMatch(assignmentUi, /data-action="mark_paid"/);
assert.match(assignmentUi, /Assignments unavailable/);
assert.match(assignmentUi, /capability check failed closed|assignmentsEnabled/);

// Direct hash while disabled renders no operational create/mutate controls.
assert.match(assignmentUi, /if \(!context\.enabled\)/);
assert.match(assignmentUi, /Assignments unavailable/);

console.log("Digital Den assignment capability tests passed.");
