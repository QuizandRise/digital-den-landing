import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FEATURE_FLAGS, ROUTE_POLICY } from "../dashboard-next/src/config.js";
import { allowedRoutesFor, ASSIGNMENT_VIEWS } from "../dashboard-next/src/assignment-capability.js";
import {
  deliveriesCapabilityEnabled,
  projectLifecycleCapabilityEnabled,
  quotationsCapabilityEnabled,
} from "../dashboard-next/src/launch-readiness-capability.js";

assert.equal(FEATURE_FLAGS.assignments, false, "assignments must remain false by default");
assert.equal(FEATURE_FLAGS.quotations, false, "quotations must remain false by default");
assert.equal(FEATURE_FLAGS.projectLifecycle, false, "projectLifecycle must remain false by default");
assert.equal(FEATURE_FLAGS.deliveries, false, "deliveries must remain false by default");

const config = readFileSync("dashboard-next/src/config.js", "utf8");
assert.doesNotMatch(config, /quotations:\s*AUTHENTICATED_WORKSPACE/);
assert.doesNotMatch(config, /projectLifecycle:\s*AUTHENTICATED_WORKSPACE/);
assert.doesNotMatch(config, /deliveries:\s*AUTHENTICATED_WORKSPACE/);
assert.match(config, /quotations:\s*false/);
assert.match(config, /projectLifecycle:\s*false/);
assert.match(config, /deliveries:\s*false/);
assert.match(config, /manager:\s*\[[^\]]*projects/);
assert.match(config, /client:\s*\[[^\]]*projects/);
assert.ok(!ROUTE_POLICY.client.includes("assignments"));
assert.ok(!ROUTE_POLICY.client.includes("my_assignments"));

const indexHtml = readFileSync("dashboard-next/index.html", "utf8");
assert.match(indexHtml, /quotation-actions\.js/);
assert.match(indexHtml, /delivery-actions\.js/);
assert.match(indexHtml, /project-lifecycle-actions\.js/);

const app = readFileSync("dashboard-next/src/app.js", "utf8");
assert.match(app, /launch-readiness-capability\.js/);
assert.match(app, /quotationsCapabilityEnabled/);
assert.match(app, /deliveriesCapabilityEnabled/);
assert.match(app, /projectLifecycleCapabilityEnabled/);
assert.match(app, /agencyCapabilities/);
assert.match(app, /aria-live="polite"/);
assert.match(app, /delivery-lifecycle-slot/);
assert.doesNotMatch(app, /No approval action is enabled yet/);

const quotationUi = readFileSync("dashboard-next/src/quotation-actions.js", "utf8");
assert.match(quotationUi, /quotation-lifecycle/);
assert.match(quotationUi, /quotationsEnabled|quotationsCapabilityEnabled/);
assert.match(quotationUi, /credentials:\s*"include"/);
assert.match(quotationUi, /expectedVersion/);
assert.match(quotationUi, /Quotations unavailable/);
assert.match(quotationUi, /if \(!context\.enabled\)|!quotationsCapabilityEnabled/);
assert.doesNotMatch(quotationUi, /mark_paid|stripe|Stripe/i);

const deliveryUi = readFileSync("dashboard-next/src/delivery-actions.js", "utf8");
assert.match(deliveryUi, /delivery-lifecycle/);
assert.match(deliveryUi, /deliveriesEnabled|deliveriesCapabilityEnabled/);
assert.match(deliveryUi, /request_internal_correction/);
assert.match(deliveryUi, /approve_for_client/);
assert.match(deliveryUi, /request_included_revision/);
assert.match(deliveryUi, /request_paid_change/);
assert.match(deliveryUi, /Deliveries unavailable/);
assert.doesNotMatch(deliveryUi, /mark_paid|stripe|Stripe/i);

const lifecycleUi = readFileSync("dashboard-next/src/project-lifecycle-actions.js", "utf8");
assert.match(lifecycleUi, /project-lifecycle/);
assert.match(lifecycleUi, /projectLifecycleEnabled|projectLifecycleCapabilityEnabled/);
assert.match(lifecycleUi, /permittedTransitions/);
assert.match(lifecycleUi, /awaiting_payment|funded/);
assert.match(lifecycleUi, /record_test_simulation_only/);
assert.match(lifecycleUi, /IS_PRODUCTION_WORKSPACE/);
assert.match(lifecycleUi, /realPaymentExecutionEnabled/);
assert.match(lifecycleUi, /Project lifecycle unavailable/);
assert.doesNotMatch(lifecycleUi, /Mark funded/);
assert.doesNotMatch(lifecycleUi, /mark_paid|stripe payout|Stripe/i);

// Fail closed when capabilities missing/false.
assert.equal(quotationsCapabilityEnabled(null), false);
assert.equal(quotationsCapabilityEnabled({}), false);
assert.equal(quotationsCapabilityEnabled({ agencyCapabilities: { quotationsEnabled: false } }), false);
assert.equal(deliveriesCapabilityEnabled({ agencyCapabilities: { deliveriesEnabled: false } }), false);
assert.equal(projectLifecycleCapabilityEnabled({ agencyCapabilities: { projectLifecycleEnabled: false } }), false);

assert.equal(quotationsCapabilityEnabled({ agencyCapabilities: { quotationsEnabled: true } }), true);
assert.equal(deliveriesCapabilityEnabled({ agencyCapabilities: { deliveriesEnabled: true } }), true);
assert.equal(projectLifecycleCapabilityEnabled({ agencyCapabilities: { projectLifecycleEnabled: true } }), true);

// Client never gets assignment nav even when other capabilities are enabled.
const clientRoutes = allowedRoutesFor("client", {
  agencyCapabilities: {
    assignmentsEnabled: true,
    quotationsEnabled: true,
    deliveriesEnabled: true,
    projectLifecycleEnabled: true,
  },
});
assert.ok(!clientRoutes.includes("assignments"));
assert.ok(!clientRoutes.some(key => ASSIGNMENT_VIEWS.includes(key)));

const workspaceCss = readFileSync("dashboard-next/assets/project-workspace-safe.css", "utf8");
assert.match(workspaceCss, /@media\(max-width:720px\)/);
assert.match(workspaceCss, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(workspaceCss, /@media\(max-width:420px\)/);
assert.match(workspaceCss, /overflow-x:hidden/);
assert.match(workspaceCss, /project-quick-actions\{display:grid;grid-template-columns:1fr\}/);

console.log("Digital Den launch-readiness tests passed.");
