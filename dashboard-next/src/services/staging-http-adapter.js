import { assertReadOnlyAdapter } from "./adapter-contract.js";

const DEFAULT_TIMEOUT_MS = 8000;

function getStagingBaseUrl() {
  const value = globalThis.DIGITAL_DEN_STAGING_API_BASE_URL;
  if (!value || typeof value !== "string") {
    throw new Error("Digital Den staging API base URL is not configured");
  }
  return value.replace(/\/$/, "");
}

async function requestJson(path, { signal } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const combinedSignal = signal ?? controller.signal;

  try {
    const response = await fetch(`${getStagingBaseUrl()}${path}`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-Digital-Den-Contract-Version": "2026-08-01.v1",
      },
      signal: combinedSignal,
      cache: "no-store",
    });

    if (!response.ok) {
      const correlationId = response.headers.get("x-correlation-id") ?? "unavailable";
      throw new Error(`Read-only staging request failed (${response.status}); correlationId=${correlationId}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Disabled-by-default staging adapter. It exposes GET operations only and
 * requires a same-session authenticated staging endpoint when activated.
 */
export function createStagingHttpAdapter() {
  return assertReadOnlyAdapter({
    getActor: role => requestJson(`/dashboard/v1/actor?previewRole=${encodeURIComponent(role)}`),
    getOverview: role => requestJson(`/dashboard/v1/overview?role=${encodeURIComponent(role)}`),
    getProjects: () => requestJson("/dashboard/v1/projects"),
    getReviews: () => requestJson("/dashboard/v1/reviews"),
    getMessages: () => requestJson("/dashboard/v1/messages"),
    getFiles: () => requestJson("/dashboard/v1/files"),
    getClients: () => requestJson("/dashboard/v1/clients"),
    getTeam: () => requestJson("/dashboard/v1/team"),
    getAuditEvents: () => requestJson("/dashboard/v1/audit"),
    getCommunicationPolicies: () => requestJson("/dashboard/v1/communication-policies"),
  });
}
