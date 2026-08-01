export const FEATURE_FLAGS = Object.freeze({
  liveApi: false,
  authentication: false,
  projectMutations: false,
  messagingMutations: false,
  fileUpload: false,
  billing: false,
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
