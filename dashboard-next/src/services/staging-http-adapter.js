import { API_CONFIG } from "../config.js";
import { invitationWasSent } from "../invitation-status.js";
import { assertReadOnlyAdapter } from "./adapter-contract.js";

const DEFAULT_TIMEOUT_MS = 8000;
const dateLabel = value => value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

function getStagingBaseUrl() {
  return API_CONFIG.baseUrl.replace(/\/$/, "");
}

async function requestJson(path, { signal, method = "GET", body, intent } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const combinedSignal = signal ?? controller.signal;

  try {
    const headers = {
      Accept: "application/json",
      "X-Digital-Den-Contract-Version": API_CONFIG.contractVersion,
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (intent) headers["X-Digital-Den-Intent"] = intent;

    const response = await fetch(`${getStagingBaseUrl()}${path}`, {
      method,
      credentials: "include",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: combinedSignal,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const correlationId = response.headers.get("x-correlation-id") ?? payload?.error?.correlationId ?? "unavailable";
      const message = payload?.error?.message ?? `Workspace request failed (${response.status})`;
      const error = new Error(`${message}; correlationId=${correlationId}`);
      error.status = response.status;
      throw error;
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function mapActor(actor) {
  const role = actor?.role ?? "client";
  const label = role === "manager" ? "Manager" : role === "team_member" ? "Team Member" : "Client";
  return {
    ...actor,
    name: actor?.displayName || label,
    email: actor?.email ?? "",
    displayName: actor?.displayName ?? "",
    companyName: actor?.companyName ?? "",
    initials: label.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase(),
    label: `${label} workspace`,
  };
}

function mapProject(project) {
  return {
    id: project.projectId,
    title: project.title,
    client: project.clientId || "Digital Den client",
    service: project.serviceCategory || "Creative service",
    status: project.status,
    progress: Number(project.progressPercent || 0),
    updated: dateLabel(project.updatedAt),
  };
}

function mapTeamMember(item) {
  return {
    id: item.userId,
    name: item.name,
    email: item.email,
    role: item.role,
    status: item.status,
    projectScopes: item.projectScopes || [],
    invitedBy: item.invitedBy || "—",
    invitedAt: dateLabel(item.invitedAt),
    activatedAt: dateLabel(item.activatedAt),
    lastAccessAt: dateLabel(item.lastAccessAt),
  };
}

export function createStagingHttpAdapter() {
  return assertReadOnlyAdapter({
    async getActor() {
      const payload = await requestJson("/api/digital-den/session");
      return mapActor(payload.actor);
    },
    async getOverview() {
      const payload = await requestJson("/api/digital-den/overview");
      return {
        projects: (payload.projects || []).map(mapProject),
        reviews: payload.reviewQueue || [],
        unreadMessageCount: payload.unreadMessageCount || 0,
        flaggedMessageCount: payload.flaggedMessageCount || 0,
      };
    },
    async getProjects() {
      const payload = await requestJson("/api/digital-den/projects");
      return (payload.projects || []).map(mapProject);
    },
    async getReviews(role) {
      if (role !== "manager") return [];
      const payload = await requestJson("/api/digital-den/reviews");
      return (payload.reviews || []).map(item => ({
        project: item.projectTitle || item.projectId,
        item: item.submission || "Review item",
        owner: item.owner || "—",
        age: dateLabel(item.submittedAt),
        priority: item.priority || "normal",
      }));
    },
    async getMessages() {
      const payload = await requestJson("/api/digital-den/messages");
      return (payload.messages || []).map(item => ({
        project: item.projectId,
        from: item.senderRole || item.senderId,
        text: item.body,
        time: dateLabel(item.createdAt),
        state: item.moderationState || "clear",
      }));
    },
    async getFiles() {
      const payload = await requestJson("/api/digital-den/files");
      return (payload.files || []).map(item => ({
        name: item.name,
        project: item.projectId,
        scan: item.malwareScanState || "pending",
        availability: item.downloadState || "unavailable",
      }));
    },
    async getClients(role) {
      if (role !== "manager") return [];
      const payload = await requestJson("/api/digital-den/clients");
      return (payload.clients || []).map(item => ({
        name: item.name || item.companyName || item.email,
        contact: item.email,
        projects: item.projectCount || 0,
        status: "Active",
        lastActivity: dateLabel(item.lastActivityAt),
      }));
    },
    async getTeam(role) {
      if (role !== "manager") return [];
      try {
        const payload = await requestJson("/api/digital-den/team/manage");
        return (payload.team || []).map(mapTeamMember);
      } catch (error) {
        if (error.status === 404) return [];
        throw error;
      }
    },
    async createTeamMember(input) {
      const payload = await requestJson("/api/digital-den/team/manage", {
        method: "POST",
        intent: "team-administration",
        body: input,
      });
      return { member: mapTeamMember(payload.teamMember), invitationSent: invitationWasSent(payload) };
    },
    async updateTeamMember(input) {
      const payload = await requestJson("/api/digital-den/team/manage", {
        method: "PATCH",
        intent: "team-administration",
        body: input,
      });
      return { member: mapTeamMember(payload.teamMember), invitationSent: invitationWasSent(payload) };
    },
    async resendTeamInvitation(userId) {
      const payload = await requestJson("/api/digital-den/team/manage", {
        method: "PATCH",
        intent: "team-administration",
        body: { userId, action: "resend_invitation" },
      });
      return { member: mapTeamMember(payload.teamMember), invitationSent: invitationWasSent(payload) };
    },
    async getAuditEvents(role) {
      if (role !== "manager") return [];
      const payload = await requestJson("/api/digital-den/audit");
      return (payload.events || []).map(item => ({
        event: item.event,
        actor: item.actorId,
        target: item.targetId,
        time: dateLabel(item.occurredAt),
      }));
    },
    async getCommunicationPolicies(role) {
      if (role !== "manager") return [];
      const payload = await requestJson("/api/digital-den/communication-policies");
      return (payload.policies || []).map(item => ({
        rule: item.code,
        action: item.action,
        state: item.enforcement,
      }));
    },
  });
}
