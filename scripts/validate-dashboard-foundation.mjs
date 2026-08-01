import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";

const requiredFiles = [
  "dashboard.html",
  "src/contracts/digital-den.ts",
  "docs/digital-den/DIGITAL_DEN_DASHBOARD_COMPLETION_AUDIT_V1.md",
  "docs/digital-den/DIGITAL_DEN_DASHBOARD_COMPLETION_ROADMAP_V1.md",
  "docs/digital-den/DIGITAL_DEN_DASHBOARD_STABILITY_GATES_V1.md",
  "dashboard-next/index.html",
  "dashboard-next/assets/styles.css",
  "dashboard-next/src/config.js",
  "dashboard-next/src/mock-data.js",
  "dashboard-next/src/app.js",
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
  const contracts = await readFile("src/contracts/digital-den.ts", "utf8");
  const nextHtml = await readFile("dashboard-next/index.html", "utf8");
  const config = await readFile("dashboard-next/src/config.js", "utf8");
  const app = await readFile("dashboard-next/src/app.js", "utf8");
  const adapterContract = await readFile("dashboard-next/src/services/adapter-contract.js", "utf8");
  const dashboardService = await readFile("dashboard-next/src/services/dashboard-service.js", "utf8");
  const mockAdapter = await readFile("dashboard-next/src/services/mock-dashboard-adapter.js", "utf8");
  const stagingAdapter = await readFile("dashboard-next/src/services/staging-http-adapter.js", "utf8");
  const sessionContract = await readFile("dashboard-next/src/session/session-contract.js", "utf8");

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
    [nextHtml, /data-environment=["']preview["']/, "structured workspace must declare preview environment"],
    [nextHtml, /meta[^>]+robots[^>]+noindex,nofollow/i, "structured preview must be noindex,nofollow"],
    [nextHtml, /type=["']module["'][^>]+src=["'].\/src\/app\.js["']/, "structured workspace module entry is missing"],
    [config, /liveApi:\s*false/, "live API must remain disabled"],
    [config, /authentication:\s*false/, "real authentication must remain disabled"],
    [config, /projectMutations:\s*false/, "project mutations must remain disabled"],
    [config, /messagingMutations:\s*false/, "messaging mutations must remain disabled"],
    [config, /billing:\s*false/, "billing integration must remain disabled"],
    [config, /manager:\s*\[/, "manager route policy is missing"],
    [config, /team_member:\s*\[/, "team-member route policy is missing"],
    [config, /client:\s*\[/, "client route policy is missing"],
    [app, /createDashboardService/, "application must consume the dashboard service boundary"],
    [app, /service\.getActor/, "application must load actors through the service"],
    [app, /Promise\.all/, "application must load read-only workspace data through the adapter"],
    [app, /state\.loading/, "application loading state is missing"],
    [app, /state\.error/, "application error state is missing"],
    [app, /ROUTE_POLICY\[state\.role\]/, "application must render navigation from route policy"],
    [app, /FEATURE_FLAGS\.liveApi/, "application must expose live API state"],
    [adapterContract, /forbiddenWriteMethods/, "adapter contract must reject write methods"],
    [adapterContract, /getCommunicationPolicies/, "adapter contract is incomplete"],
    [dashboardService, /FEATURE_FLAGS\.liveApi/, "service selector must remain feature-flag controlled"],
    [dashboardService, /createMockDashboardAdapter/, "mock adapter fallback is missing"],
    [mockAdapter, /assertReadOnlyAdapter/, "mock adapter must use read-only guard"],
    [mockAdapter, /teamMembers/, "mock adapter team binding is invalid"],
    [mockAdapter, /communicationPolicy/, "mock adapter policy binding is invalid"],
    [stagingAdapter, /method:\s*["']GET["']/, "staging adapter must use GET only"],
    [stagingAdapter, /credentials:\s*["']include["']/, "staging adapter must require authenticated session credentials"],
    [stagingAdapter, /cache:\s*["']no-store["']/, "staging adapter must disable response caching"],
    [sessionContract, /secure-http-only-cookie/, "session transport must require a secure HTTP-only cookie"],
    [sessionContract, /localStorageAllowed:\s*false/, "session tokens must not be stored in localStorage"],
    [sessionContract, /queryStringTokenAllowed:\s*false/, "session tokens must not be accepted from query strings"],
    [sessionContract, /serverSideRoleEnforcementRequired:\s*true/, "server-side role enforcement must be required"],
    [sessionContract, /serverSideProjectScopeEnforcementRequired:\s*true/, "server-side project-scope enforcement must be required"],
  ];
  for (const [source, pattern, message] of structuredChecks) if (!pattern.test(source)) failures.push(message);

  if (/from\s+["'].\/mock-data\.js["']/.test(app)) {
    failures.push("application must not import mock data directly");
  }

  const forbiddenPatterns = [
    [/sk_live_[A-Za-z0-9]+/, "Possible live Stripe secret detected"],
    [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "Private key material detected"],
    [/mongodb(?:\+srv)?:\/\/[^\s"']+:[^\s"']+@/i, "MongoDB credential URI detected"],
    [/postgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@/i, "PostgreSQL credential URI detected"],
  ];
  const scannedSources = [legacyHtml, contracts, nextHtml, config, app, adapterContract, dashboardService, mockAdapter, stagingAdapter, sessionContract];
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
