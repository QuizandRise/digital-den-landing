import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";

const requiredFiles = [
  "dashboard.html",
  "workspace-access.html",
  "workspace-access.js",
  "src/contracts/digital-den.ts",
  "docs/digital-den/DIGITAL_DEN_DASHBOARD_COMPLETION_AUDIT_V1.md",
  "docs/digital-den/DIGITAL_DEN_DASHBOARD_COMPLETION_ROADMAP_V1.md",
  "docs/digital-den/DIGITAL_DEN_DASHBOARD_STABILITY_GATES_V1.md",
  "docs/digital-den/DIGITAL_DEN_AGENCY_OPERATING_MODEL_V1.md",
  "dashboard-next/index.html",
  "dashboard-next/assets/styles.css",
  "dashboard-next/src/config.js",
  "dashboard-next/src/platform-config.js",
  "dashboard-next/src/mock-data.js",
  "dashboard-next/src/app.js",
  "dashboard-next/src/assignment-actions.js",
  "dashboard-next/src/launch-readiness-capability.js",
  "dashboard-next/src/quotation-actions.js",
  "dashboard-next/src/delivery-actions.js",
  "dashboard-next/src/project-lifecycle-actions.js",
  "dashboard-next/src/services/adapter-contract.js",
  "dashboard-next/src/services/dashboard-service.js",
  "dashboard-next/src/services/mock-dashboard-adapter.js",
  "dashboard-next/src/services/staging-http-adapter.js",
  "dashboard-next/src/session/session-contract.js",
];

const failures = [];
for (const file of requiredFiles) {
  try { await access(file, constants.R_OK); }
  catch { failures.push(`Required file is missing or unreadable: ${file}`); }
}

if (failures.length === 0) {
  const legacyHtml = await readFile("dashboard.html", "utf8");
  const accessHtml = await readFile("workspace-access.html", "utf8");
  const accessJs = await readFile("workspace-access.js", "utf8");
  const contracts = await readFile("src/contracts/digital-den.ts", "utf8");
  const nextHtml = await readFile("dashboard-next/index.html", "utf8");
  const config = await readFile("dashboard-next/src/config.js", "utf8");
  const platformConfig = await readFile("dashboard-next/src/platform-config.js", "utf8");
  const app = await readFile("dashboard-next/src/app.js", "utf8");
  const adapterContract = await readFile("dashboard-next/src/services/adapter-contract.js", "utf8");
  const dashboardService = await readFile("dashboard-next/src/services/dashboard-service.js", "utf8");
  const mockAdapter = await readFile("dashboard-next/src/services/mock-dashboard-adapter.js", "utf8");
  const stagingAdapter = await readFile("dashboard-next/src/services/staging-http-adapter.js", "utf8");
  const sessionContract = await readFile("dashboard-next/src/session/session-contract.js", "utf8");
  const operatingModel = await readFile("docs/digital-den/DIGITAL_DEN_AGENCY_OPERATING_MODEL_V1.md", "utf8");
  const bootstrapApiHint = await readFile("dashboard-next/src/session/session-contract.js", "utf8");

  const legacyChecks = [
    [/<html\b/i, "dashboard.html must contain an <html> element"],
    [/<meta[^>]+name=["']viewport["']/i, "dashboard.html must define a viewport meta tag"],
    [/data-role=["']manager["']/i, "legacy manager role preview is missing"],
    [/data-role=["']member["']/i, "legacy team-member role preview is missing"],
    [/data-role=["']client["']/i, "legacy client role preview is missing"],
  ];
  for (const [pattern, message] of legacyChecks) if (!pattern.test(legacyHtml)) failures.push(message);

  const contractChecks = [
    [/DIGITAL_DEN_CONTRACT_VERSION/, "contract version is missing"],
    [/type DigitalDenRole/, "DigitalDenRole is missing"],
    [/interface DashboardOverviewResponse/, "DashboardOverviewResponse is missing"],
    [/interface ApiErrorResponse/, "ApiErrorResponse is missing"],
    [/idempotencyKey/, "mutation idempotency contract is missing"],
    [/expectedVersion/, "optimistic concurrency contract is missing"],
    [/DIGITAL_DEN_ROUTE_POLICY/, "route policy is missing"],
  ];
  for (const [pattern, message] of contractChecks) if (!pattern.test(contracts)) failures.push(message);

  const structuredChecks = [
    // Authorised production architecture: production environment + authenticated workspace.
    [nextHtml, /data-environment=["']production["']/, "structured workspace must declare the authorised production environment"],
    [nextHtml, /meta[^>]+robots[^>]+noindex,nofollow/i, "authenticated workspace must remain noindex,nofollow"],
    [nextHtml, /type=["']module["'][^>]+src=["'].\/src\/app\.js["']/, "structured workspace module entry is missing"],
    [config, /IS_STAGING_WORKSPACE/, "staging workspace detection guard is missing"],
    [config, /IS_PRODUCTION_WORKSPACE/, "production workspace detection guard is missing"],
    [config, /AUTHENTICATED_WORKSPACE/, "authenticated workspace composition is missing"],
    [config, /IS_STAGING_WORKSPACE\s*\|\|\s*IS_PRODUCTION_WORKSPACE/, "authenticated workspace must intentionally include staging or production hosts"],
    [config, /liveApi:\s*AUTHENTICATED_WORKSPACE/, "live API must follow the authenticated workspace configuration"],
    [config, /authentication:\s*AUTHENTICATED_WORKSPACE/, "authentication must follow the authenticated workspace configuration"],
    [config, /projectMutations:\s*false/, "project mutations must remain disabled"],
    [config, /messagingMutations:\s*false/, "messaging mutations must remain disabled"],
    [config, /billing:\s*false/, "billing integration must remain disabled"],
    [config, /assignments:\s*false/, "assignments feature flag must fail closed and not open from host alone"],
    [config, /quotations:\s*false/, "quotations feature flag must fail closed and not open from host alone"],
    [config, /projectLifecycle:\s*false/, "project lifecycle feature flag must fail closed and not open from host alone"],
    [config, /deliveries:\s*false/, "deliveries feature flag must fail closed and not open from host alone"],
    [config, /baseUrl:\s*globalThis\.location\?\.origin/, "same-origin Digital Den API base is missing"],
    [config, /manager:\s*\[[^\]]*projects/, "manager route policy is missing"],
    [config, /manager:\s*\[[^\]]*assignments/, "manager route policy must include assignments"],
    [config, /team_member:\s*\[[^\]]*assigned_work/, "team-member route policy must remain assigned-work scoped"],
    [config, /team_member:\s*\[[^\]]*my_assignments/, "team-member route policy must include my_assignments"],
    [config, /client:\s*\[[^\]]*projects/, "client route policy is missing"],
    [nextHtml, /assignment-actions\.js/, "assignment compensation module entry is missing"],
    [nextHtml, /quotation-actions\.js/, "quotation lifecycle module entry is missing"],
    [nextHtml, /delivery-actions\.js/, "delivery lifecycle module entry is missing"],
    [nextHtml, /project-lifecycle-actions\.js/, "project lifecycle module entry is missing"],
    [app, /launch-readiness-capability\.js/, "application must import launch-readiness capability helpers"],
    [app, /quotationsCapabilityEnabled/, "application must gate quotation panels through agency capabilities"],
    [app, /deliveriesCapabilityEnabled/, "application must gate delivery panels through agency capabilities"],
    [app, /projectLifecycleCapabilityEnabled/, "application must gate lifecycle panels through agency capabilities"],
    [app, /createDashboardService/, "application must consume the dashboard service boundary"],
    [app, /service\.getActor/, "application must load actors through the service"],
    [app, /Promise\.all/, "application must load read-only workspace data through the adapter"],
    [app, /state\.loading/, "application loading state is missing"],
    [app, /state\.error/, "application error state is missing"],
    [app, /allowedRoutesFor\(/, "application must filter navigation through capability-aware allowed routes"],
    [app, /assignment-capability\.js/, "application must import shared assignment capability helpers"],
    [app, /rolePreview\.hidden\s*=\s*true/, "authenticated workspace must hide preview role switching"],
    [app, /FEATURE_FLAGS\.authentication\s*&&\s*state\.actor\s*&&\s*role\s*!==\s*state\.actor\.role/, "authenticated workspace must reject mock cross-role switching"],
    [app, /actor\.role/, "authenticated workspace must derive role from the server session"],
    [adapterContract, /forbiddenWriteMethods/, "adapter contract must reject write methods"],
    [adapterContract, /getCommunicationPolicies/, "adapter contract is incomplete"],
    [dashboardService, /FEATURE_FLAGS\.liveApi/, "service selector must remain feature-flag controlled"],
    [dashboardService, /createMockDashboardAdapter/, "mock adapter fallback is missing"],
    [dashboardService, /FEATURE_FLAGS\.liveApi[\s\S]*createStagingHttpAdapter/, "authenticated live API must use the HTTP adapter, not mock authority"],
    [mockAdapter, /assertReadOnlyAdapter/, "mock adapter must use read-only guard"],
    [mockAdapter, /teamMembers/, "mock adapter team binding is invalid"],
    [mockAdapter, /communicationPolicy/, "mock adapter policy binding is invalid"],
    [stagingAdapter, /credentials:\s*["']include["']/, "authenticated adapter must require session credentials"],
    [stagingAdapter, /cache:\s*["']no-store["']/, "authenticated adapter must disable response caching"],
    [stagingAdapter, /\/api\/digital-den\/session/, "authenticated adapter session route is missing"],
    [stagingAdapter, /\/api\/digital-den\/projects/, "authenticated adapter project route is missing"],
    [stagingAdapter, /mapProject/, "authenticated project payload mapping is missing"],
    [stagingAdapter, /method\s*=\s*["']GET["']/, "authenticated adapter must default read requests to GET"],
    [sessionContract, /secure-http-only-cookie/, "session transport must require a secure HTTP-only cookie"],
    [sessionContract, /localStorageAllowed:\s*false/, "session tokens must not be stored in localStorage"],
    [sessionContract, /queryStringTokenAllowed:\s*false/, "session tokens must not be accepted from query strings"],
    [sessionContract, /serverSideRoleEnforcementRequired:\s*true/, "server-side role enforcement must be required"],
    [sessionContract, /serverSideProjectScopeEnforcementRequired:\s*true/, "server-side project-scope enforcement must be required"],
    [accessHtml, /noindex,nofollow/i, "workspace access page must be noindex,nofollow"],
    [accessHtml, /workspace-access\.js/, "workspace access module is missing"],
    [accessJs, /location\.hash\.slice\(1\)/, "access token must be read from URL fragment"],
    [accessJs, /history\.replaceState/, "access fragment must be removed immediately"],
    [accessJs, /credentials:\s*["']include["']/, "workspace access requests must include session credentials"],
    [accessJs, /\/api\/digital-den\/access\/request/, "access request endpoint is missing"],
    [accessJs, /\/api\/digital-den\/access\/consume/, "access consume endpoint is missing"],
    [platformConfig, /platformName:\s*["']Digital Den["']/, "Digital Den must present as an agency platform name"],
    [platformConfig, /marketplace:\s*false/, "marketplace capability must remain disabled"],
    [platformConfig, /publicProviderDirectory:\s*false/, "public provider directory must remain disabled"],
    [platformConfig, /workerBidding:\s*false/, "worker bidding must remain disabled"],
    [platformConfig, /realPaymentExecution:\s*false/, "real payment execution must remain disabled"],
    [platformConfig, /stripeConnect:\s*false/, "Stripe Connect must remain disabled"],
    [platformConfig, /team_member:\s*"Team Member"/, "team_member must be labelled as Team Member"],
    [platformConfig, /assignInternalResources:\s*false/, "Team Member must not assign internal resources"],
    [platformConfig, /viewInternalCompensation:\s*false/, "Client/Team Member internal compensation visibility must remain false by default in capabilities"],
    [operatingModel, /Team Member must \*\*not\*\* receive global project-level compensation fields/, "operating model must document Team Member compensation boundary"],
    [operatingModel, /DigitalDenProjectAssignment/, "operating model must reference assignment-level compensation records"],
    [operatingModel, /payable.*future authorised payment rail|Real payment execution remains disabled/i, "operating model must keep payment execution disabled"],
    [bootstrapApiHint, /serverSideRoleEnforcementRequired:\s*true/, "bootstrap/mock role minting must not replace server-side role enforcement"],
  ];
  for (const [source, pattern, message] of structuredChecks) if (!pattern.test(source)) failures.push(message);

  // Production must not treat mock preview role selection as authority.
  if (!/FEATURE_FLAGS\.authentication/.test(app) || !/rolePreview\.hidden\s*=\s*true/.test(app)) {
    failures.push("Production authentication must hide role preview and avoid mock role authority");
  }
  if (/createMockDashboardAdapter\(\)/.test(app)) {
    failures.push("application must not instantiate the mock adapter directly");
  }
  if (/bootstrap-session/.test(stagingAdapter) || /bootstrap-session/.test(app)) {
    failures.push("Production workspace must not call staging bootstrap role minting");
  }

  // Client and Team Member route restrictions.
  if (!/team_member:\s*\[[^\]]*assigned_work[^\]]*\]/.test(config.replace(/\s+/g, " "))) {
    failures.push("Team Member routes must remain assigned-work scoped");
  }
  if (/client:\s*\[[^\]]*team[^\]]*\]/.test(config.replace(/\s+/g, " ")) && /client:\s*\[[^\]]*("team"|'team')/.test(config)) {
    failures.push("Client routes must not include team administration");
  }
  const clientRouteMatch = config.match(/client:\s*\[([^\]]+)\]/);
  const teamRouteMatch = config.match(/team_member:\s*\[([^\]]+)\]/);
  if (clientRouteMatch && /\bteam\b/.test(clientRouteMatch[1])) {
    failures.push("Client route policy must not include team administration");
  }
  if (teamRouteMatch && /\bclients\b/.test(teamRouteMatch[1])) {
    failures.push("Team Member route policy must not include clients directory");
  }
  if (teamRouteMatch && /\bfinancials\b/.test(teamRouteMatch[1])) {
    failures.push("Team Member route policy must not include manager financials");
  }
  if (clientRouteMatch && /\baudit\b/.test(clientRouteMatch[1])) {
    failures.push("Client route policy must not include audit");
  }
  if (clientRouteMatch && /\bassignments\b|\bmy_assignments\b/.test(clientRouteMatch[1])) {
    failures.push("Client route policy must not include internal assignment modules");
  }
  if (teamRouteMatch && /\bassignments\b/.test(teamRouteMatch[1]) && !/\bmy_assignments\b/.test(teamRouteMatch[1])) {
    failures.push("Team Member route policy must use my_assignments, not manager assignments");
  }
  if (/assignments:\s*AUTHENTICATED_WORKSPACE/.test(config)) {
    failures.push("assignments must not open solely because the workspace is authenticated");
  }
  if (/quotations:\s*AUTHENTICATED_WORKSPACE/.test(config)) {
    failures.push("quotations must not open solely because the workspace is authenticated");
  }
  if (/projectLifecycle:\s*AUTHENTICATED_WORKSPACE/.test(config)) {
    failures.push("project lifecycle must not open solely because the workspace is authenticated");
  }
  if (/deliveries:\s*AUTHENTICATED_WORKSPACE/.test(config)) {
    failures.push("deliveries must not open solely because the workspace is authenticated");
  }
  const assignmentUiSource = await readFile("dashboard-next/src/assignment-actions.js", "utf8");
  if (!/view=capabilities|assignmentsEnabled/.test(assignmentUiSource)) {
    failures.push("assignment UI must use a server-authoritative capability check");
  }
  if (!/permittedActions/.test(assignmentUiSource)) {
    failures.push("assignment UI must render state-aware actions from permittedActions");
  }
  if (!/<select name=["']teamMemberId["']/.test(assignmentUiSource)) {
    failures.push("reassignment UI must use an authorised Team Member dropdown");
  }
  if (/New Team Member id/.test(assignmentUiSource)) {
    failures.push("reassignment UI must not ask Managers to type MongoDB Team Member IDs");
  }

  const quotationUiSource = await readFile("dashboard-next/src/quotation-actions.js", "utf8");
  if (!/quotation-lifecycle/.test(quotationUiSource)) {
    failures.push("quotation UI must use quotation-lifecycle intent");
  }
  if (!/quotationsEnabled|quotationsCapabilityEnabled/.test(quotationUiSource)) {
    failures.push("quotation UI must reference quotationsEnabled capability");
  }
  if (/mark_paid|stripe payout/i.test(quotationUiSource)) {
    failures.push("quotation UI must not expose mark_paid or Stripe payout");
  }

  const deliveryUiSource = await readFile("dashboard-next/src/delivery-actions.js", "utf8");
  if (!/delivery-lifecycle/.test(deliveryUiSource)) {
    failures.push("delivery UI must use delivery-lifecycle intent");
  }
  if (!/deliveriesEnabled|deliveriesCapabilityEnabled/.test(deliveryUiSource)) {
    failures.push("delivery UI must reference deliveriesEnabled capability");
  }

  const lifecycleUiSource = await readFile("dashboard-next/src/project-lifecycle-actions.js", "utf8");
  if (!/project-lifecycle/.test(lifecycleUiSource)) {
    failures.push("project lifecycle UI must use project-lifecycle intent");
  }
  if (!/projectLifecycleEnabled|projectLifecycleCapabilityEnabled/.test(lifecycleUiSource)) {
    failures.push("project lifecycle UI must reference projectLifecycleEnabled capability");
  }
  if (/mark_paid|stripe payout/i.test(lifecycleUiSource)) {
    failures.push("project lifecycle UI must not expose mark_paid or Stripe payout");
  }
  if (/Mark funded/.test(lifecycleUiSource)) {
    failures.push("project lifecycle UI must not present TEST simulation as funded");
  }
  if (!/record_test_simulation_only/.test(lifecycleUiSource)) {
    failures.push("project lifecycle UI must use record_test_simulation_only");
  }

  if (/from\s+["'].\/mock-data\.js["']/.test(app)) failures.push("application must not import mock data directly");
  if (/\?token=/.test(accessJs) || /localStorage/.test(accessJs)) failures.push("workspace access must not use query-string or localStorage tokens");

  const forbiddenPatterns = [
    [/sk_live_[A-Za-z0-9]+/, "Possible live Stripe secret detected"],
    [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "Private key material detected"],
    [/mongodb(?:\+srv)?:\/\/[^\s"']+:[^\s"']+@/i, "MongoDB credential URI detected"],
    [/postgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@/i, "PostgreSQL credential URI detected"],
  ];
  const scannedSources = [legacyHtml, accessHtml, accessJs, contracts, nextHtml, config, platformConfig, app, adapterContract, dashboardService, mockAdapter, stagingAdapter, sessionContract];
  for (const [pattern, message] of forbiddenPatterns) {
    if (scannedSources.some(source => pattern.test(source))) failures.push(message);
  }
}

if (failures.length > 0) {
  console.error("Digital Den dashboard foundation validation failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Digital Den dashboard foundation validation passed.");
