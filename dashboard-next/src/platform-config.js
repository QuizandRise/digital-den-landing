export const PLATFORM_CONFIG = Object.freeze({
  platformName: "WorkforceDen",
  organisationName: "Digital Den",
  tenantId: null,
  branding: Object.freeze({ serviceBrand: "digital_den", networkLabel: "Digital Den network" }),
  roleLabels: Object.freeze({ manager: "Manager", client: "Client", team_member: "Professional" }),
  serviceCategories: Object.freeze([]),
  featureFlags: Object.freeze({ multiTenant: false, marketplace: false, payments: false }),
});

export const ROLE_PRESENTATION = Object.freeze({
  manager: Object.freeze({ projectRoute: "projects", financeRoute: "financials" }),
  client: Object.freeze({ projectRoute: "projects", financeRoute: "billing" }),
  team_member: Object.freeze({ projectRoute: "assigned_work", financeRoute: "earnings" }),
});

export const ROLE_CAPABILITIES = Object.freeze({
  manager: Object.freeze({ manageProjects: true, viewClients: true, viewInternalFinancials: true }),
  client: Object.freeze({ manageProjects: false, viewClients: false, viewInternalFinancials: false }),
  team_member: Object.freeze({ manageProjects: false, viewClients: false, viewInternalFinancials: false }),
});

export function normalizeProjectPresentation(project = {}) {
  return {
    ...project,
    platform: project.platform ?? "workforceden",
    serviceBrand: project.serviceBrand ?? "digital_den",
    serviceType: project.serviceType ?? null,
    tenantId: project.tenantId ?? null,
    teamAffiliations: Array.isArray(project.teamAffiliations) ? project.teamAffiliations : [],
    projectSource: project.projectSource ?? null,
  };
}

export function roleLabel(role) {
  return PLATFORM_CONFIG.roleLabels[role] ?? "Workspace member";
}
