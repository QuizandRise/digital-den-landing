export const SESSION_CONTRACT_VERSION = "2026-08-01.v1";

export const ALLOWED_SESSION_ROLES = Object.freeze([
  "manager",
  "team_member",
  "client",
]);

export function validateSessionHandoff(session) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session handoff must be an object");
  }

  const requiredStringFields = [
    "sessionId",
    "actorId",
    "organisationId",
    "role",
    "issuedAt",
    "expiresAt",
  ];

  for (const field of requiredStringFields) {
    if (typeof session[field] !== "string" || session[field].trim() === "") {
      throw new TypeError(`Session handoff is missing required field: ${field}`);
    }
  }

  if (!ALLOWED_SESSION_ROLES.includes(session.role)) {
    throw new TypeError("Session handoff contains an unsupported role");
  }

  if (!Array.isArray(session.projectScopes) || session.projectScopes.some(scope => typeof scope !== "string")) {
    throw new TypeError("Session handoff projectScopes must be an array of strings");
  }

  const issuedAt = Date.parse(session.issuedAt);
  const expiresAt = Date.parse(session.expiresAt);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= issuedAt) {
    throw new TypeError("Session handoff timestamps are invalid");
  }

  return Object.freeze({
    contractVersion: SESSION_CONTRACT_VERSION,
    sessionId: session.sessionId,
    actorId: session.actorId,
    organisationId: session.organisationId,
    role: session.role,
    projectScopes: Object.freeze([...session.projectScopes]),
    issuedAt: session.issuedAt,
    expiresAt: session.expiresAt,
  });
}

export const SESSION_HANDOFF_SECURITY_RULES = Object.freeze({
  transport: "secure-http-only-cookie",
  sameSite: "Lax-or-Strict",
  clientReadableToken: false,
  localStorageAllowed: false,
  queryStringTokenAllowed: false,
  serverSideRoleEnforcementRequired: true,
  serverSideProjectScopeEnforcementRequired: true,
  csrfProtectionRequiredForFutureMutations: true,
});
