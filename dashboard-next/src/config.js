const hostname = globalThis.location?.hostname ?? "";

export const IS_STAGING_WORKSPACE =
  hostname.includes("digital-den-landing-git-agent-digital-den-das-811984-");

export const FEATURE_FLAGS = Object.freeze({
  liveApi: IS_STAGING_WORKSPACE,
  authentication: IS_STAGING_WORKSPACE,
  projectMutations: false,
  messagingMutations: false,
  fileUpload: false,
  billing: false,
});

export const API_CONFIG = Object.freeze({
  baseUrl: globalThis.location?.origin ?? "",
  contractVersion: "2026-08-01.v1",
});

export const ROUTE_POLICY = Object.freeze({
  manager: ["overview", "projects", "review", "messages", "communication_control", "clients", "team", "audit"],
  team_member: ["overview", "assigned_work", "messages", "files"],
  client: ["overview", "projects", "messages", "files", "billing"],
});

export const NAVIGATION = Object.freeze({
  overview: ["◫", "Overview"], projects: ["◇", "Projects"], review: ["✓", "Review queue"],
  messages: ["◌", "Messages"], communication_control: ["⌁", "Communication control"],
  clients: ["♙", "Clients"], team: ["♧", "Team"], audit: ["▤", "Audit log"],
  assigned_work: ["◆", "Assigned work"], files: ["▱", "Files"], billing: ["£", "Billing"],
});
