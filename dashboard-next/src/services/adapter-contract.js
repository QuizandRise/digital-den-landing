/**
 * Runtime guard for Digital Den read-only data adapters.
 * The dashboard foundation must not expose write operations.
 */
export function assertReadOnlyAdapter(adapter) {
  const requiredMethods = [
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

  for (const method of requiredMethods) {
    if (typeof adapter?.[method] !== "function") {
      throw new TypeError(`Dashboard adapter is missing required read method: ${method}`);
    }
  }

  const forbiddenWriteMethods = ["create", "update", "delete", "approve", "assign", "send", "upload", "pay"];
  for (const method of forbiddenWriteMethods) {
    if (typeof adapter?.[method] === "function") {
      throw new TypeError(`Read-only dashboard adapter exposes forbidden write method: ${method}`);
    }
  }

  return adapter;
}
