import { ROUTE_POLICY } from "./config.js";

export const ASSIGNMENT_VIEWS = Object.freeze(["assignments", "my_assignments"]);

export function assignmentsCapabilityEnabled(role, actor) {
  if (role === "client") return false;
  const caps = actor?.agencyCapabilities;
  // Fail closed when capability is missing, false, or actor unavailable.
  return Boolean(caps && caps.assignmentsEnabled === true);
}

export function allowedRoutesFor(role, actor, routePolicy = ROUTE_POLICY) {
  const routes = routePolicy[role] || [];
  return routes.filter(key => {
    if (!ASSIGNMENT_VIEWS.includes(key)) return true;
    return assignmentsCapabilityEnabled(role, actor);
  });
}

export function capabilityRequestFailed(actor) {
  // Used by tests / UI helpers: missing capability object means fail closed.
  return !actor?.agencyCapabilities || actor.agencyCapabilities.assignmentsEnabled !== true;
}
