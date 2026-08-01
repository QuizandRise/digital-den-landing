import {
  previewActors,
  projects,
  reviews,
  messages,
  files,
  clients,
  team,
  auditEvents,
  communicationPolicies,
} from "../mock-data.js";
import { assertReadOnlyAdapter } from "./adapter-contract.js";

const clone = value => structuredClone(value);

export function createMockDashboardAdapter() {
  return assertReadOnlyAdapter({
    async getActor(role) {
      const actor = previewActors[role];
      if (!actor) throw new Error("Unknown preview role");
      return clone(actor);
    },
    async getOverview(role) {
      return {
        projects: clone(projects),
        reviews: role === "manager" ? clone(reviews) : [],
        unreadMessageCount: messages.length,
        flaggedMessageCount: role === "manager" ? messages.filter(item => item.state === "flagged").length : 0,
      };
    },
    async getProjects() { return clone(projects); },
    async getReviews() { return clone(reviews); },
    async getMessages() { return clone(messages); },
    async getFiles() { return clone(files); },
    async getClients() { return clone(clients); },
    async getTeam() { return clone(team); },
    async getAuditEvents() { return clone(auditEvents); },
    async getCommunicationPolicies() { return clone(communicationPolicies); },
  });
}
