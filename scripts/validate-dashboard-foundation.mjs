import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";

const requiredFiles = [
  "dashboard.html",
  "src/contracts/digital-den.ts",
  "docs/digital-den/DIGITAL_DEN_DASHBOARD_COMPLETION_AUDIT_V1.md",
  "docs/digital-den/DIGITAL_DEN_DASHBOARD_COMPLETION_ROADMAP_V1.md",
  "docs/digital-den/DIGITAL_DEN_DASHBOARD_STABILITY_GATES_V1.md",
];

const failures = [];

for (const file of requiredFiles) {
  try {
    await access(file, constants.R_OK);
  } catch {
    failures.push(`Required file is missing or unreadable: ${file}`);
  }
}

if (failures.length === 0) {
  const html = await readFile("dashboard.html", "utf8");
  const contracts = await readFile("src/contracts/digital-den.ts", "utf8");

  const htmlChecks = [
    [/<html\b/i, "dashboard.html must contain an <html> element"],
    [/<meta[^>]+name=["']viewport["']/i, "dashboard.html must define a viewport meta tag"],
    [/<title>[^<]+<\/title>/i, "dashboard.html must define a non-empty title"],
    [/data-role=["']manager["']/i, "manager role preview is missing"],
    [/data-role=["']member["']/i, "team-member role preview is missing"],
    [/data-role=["']client["']/i, "client role preview is missing"],
    [/id=["']overview["']/i, "overview view is missing"],
    [/id=["']projects["']/i, "projects view is missing"],
    [/id=["']review["']/i, "review view is missing"],
    [/id=["']messages["']/i, "messages view is missing"],
    [/id=["']security["']/i, "communication-control view is missing"],
  ];

  for (const [pattern, message] of htmlChecks) {
    if (!pattern.test(html)) failures.push(message);
  }

  const contractChecks = [
    [/DIGITAL_DEN_CONTRACT_VERSION/, "contract version is missing"],
    [/type DigitalDenRole/, "DigitalDenRole is missing"],
    [/interface DashboardOverviewResponse/, "DashboardOverviewResponse is missing"],
    [/interface ApiErrorResponse/, "ApiErrorResponse is missing"],
    [/idempotencyKey/, "mutation idempotency contract is missing"],
    [/expectedVersion/, "optimistic concurrency contract is missing"],
    [/DIGITAL_DEN_ROUTE_POLICY/, "route policy is missing"],
  ];

  for (const [pattern, message] of contractChecks) {
    if (!pattern.test(contracts)) failures.push(message);
  }

  const forbiddenPatterns = [
    [/sk_live_[A-Za-z0-9]+/, "Possible live Stripe secret detected"],
    [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "Private key material detected"],
    [/mongodb(?:\+srv)?:\/\/[^\s"']+:[^\s"']+@/i, "MongoDB credential URI detected"],
    [/postgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@/i, "PostgreSQL credential URI detected"],
  ];

  for (const [pattern, message] of forbiddenPatterns) {
    if (pattern.test(html) || pattern.test(contracts)) failures.push(message);
  }
}

if (failures.length > 0) {
  console.error("Digital Den dashboard foundation validation failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Digital Den dashboard foundation validation passed.");
