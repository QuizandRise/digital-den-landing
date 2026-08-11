export const PLATFORM_CONFIG = Object.freeze({
  platformName: "Digital Den",
  organisationName: "Digital Den",
  tenantId: null,
  branding: Object.freeze({ serviceBrand: "digital_den", networkLabel: "Digital Den agency" }),
  roleLabels: Object.freeze({ manager: "Manager", client: "Client", team_member: "Team Member" }),
  serviceCategories: Object.freeze([]),
  featureFlags: Object.freeze({
    multiTenant: false,
    marketplace: false,
    payments: false,
    publicProviderDirectory: false,
    workerBidding: false,
    publicFreelancerProfiles: false,
    directClientWorkerContracting: false,
    independentWorkerPricing: false,
    realPaymentExecution: false,
    stripeConnect: false,
  }),
});

export const ROLE_PRESENTATION = Object.freeze({
  manager: Object.freeze({ projectRoute: "projects", financeRoute: "financials" }),
  client: Object.freeze({ projectRoute: "projects", financeRoute: "billing" }),
  // Route key `earnings` retained for compatibility; UI label is compensation shell.
  team_member: Object.freeze({ projectRoute: "assigned_work", financeRoute: "my_assignments" }),
});

export const ROLE_CAPABILITIES = Object.freeze({
  manager: Object.freeze({
    manageProjects: true,
    startProject: true,
    viewClients: true,
    viewInternalFinancials: true,
    viewProjectAudit: true,
    assignInternalResources: true,
    setClientPrice: true,
    viewInternalCompensation: true,
    viewInternalNotes: true,
  }),
  client: Object.freeze({
    manageProjects: false,
    startProject: false,
    viewClients: false,
    viewInternalFinancials: false,
    viewProjectAudit: false,
    assignInternalResources: false,
    setClientPrice: false,
    viewInternalCompensation: false,
    viewInternalNotes: false,
  }),
  team_member: Object.freeze({
    manageProjects: false,
    startProject: false,
    viewClients: false,
    viewInternalFinancials: false,
    viewProjectAudit: false,
    assignInternalResources: false,
    setClientPrice: false,
    viewInternalCompensation: false,
    viewInternalNotes: false,
  }),
});

export const PROJECT_SOURCES = Object.freeze([
  "direct",
  "workforceden",
  "external_marketplace",
  "referral",
  "internal",
]);

export function normalizeProjectPresentation(project = {}) {
  const projectSource = project.projectSource ?? project.source ?? "direct";
  const normalizedSource = projectSource === "digital-den" || projectSource === "digital_den"
    ? "direct"
    : projectSource;
  return {
    ...project,
    platform: project.platform ?? "digital_den",
    serviceBrand: project.serviceBrand ?? "digital_den",
    serviceType: project.serviceType ?? null,
    tenantId: project.tenantId ?? null,
    teamAffiliations: Array.isArray(project.teamAffiliations) ? project.teamAffiliations : [],
    projectSource: normalizedSource,
    isAgencyProject: true,
  };
}

export function roleLabel(role) {
  return PLATFORM_CONFIG.roleLabels[role] ?? "Workspace member";
}
