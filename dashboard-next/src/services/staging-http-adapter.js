import { API_CONFIG } from "../config.js";
import { assertReadOnlyAdapter } from "./adapter-contract.js";

const DEFAULT_TIMEOUT_MS = 8000;

function getStagingBaseUrl() {
  return API_CONFIG.baseUrl.replace(/\/$/, "");
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
        "X-Digital-Den-Contract-Version": API_CONFIG.contractVersion,
      },
      signal: combinedSignal,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const correlationId = response.headers.get("x-correlation-id") ?? payload?.error?.correlationId ?? "unavailable";
      const message = payload?.error?.message ?? `Read-only staging request failed (${response.status})`;
      throw new Error(`${message}; correlationId=${correlationId}`);
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

export function createStagingHttpAdapter() {
  return assertReadOnlyAdapter({
    async getActor() {
      const payload = await requestJson("/api/digital-den/session");
      return payload.actor;
    },
    getOverview: () => requestJson("/api/digital-den/overview"),
    getProjects: () => requestJson("/api/digital-den/projects"),
    getReviews: () => requestJson("/api/digital-den/reviews"),
    getMessages: () => requestJson("/api/digital-den/messages"),
    getFiles: () => requestJson("/api/digital-den/files"),
    getClients: () => requestJson("/api/digital-den/clients"),
    getTeam: () => requestJson("/api/digital-den/team"),
    getAuditEvents: () => requestJson("/api/digital-den/audit"),
    getCommunicationPolicies: () => requestJson("/api/digital-den/communication-policies"),
  });
}
