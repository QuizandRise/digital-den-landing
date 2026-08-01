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
