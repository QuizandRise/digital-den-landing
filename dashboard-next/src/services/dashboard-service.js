import { FEATURE_FLAGS } from "../config.js";
import { createMockDashboardAdapter } from "./mock-dashboard-adapter.js";
import { createStagingHttpAdapter } from "./staging-http-adapter.js";

/**
 * Read-only service boundary for Digital Den dashboard data.
 *
 * The UI depends on this interface rather than importing transport or mock
 * data directly. All write operations remain deliberately absent.
 */
export function createDashboardService() {
  if (FEATURE_FLAGS.liveApi) {
    return createStagingHttpAdapter();
  }

  return createMockDashboardAdapter();
}

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
