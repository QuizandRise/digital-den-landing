# Digital Den Staging Read Model v1

Status: Foundation only. No production endpoint is enabled by this document.

## Purpose

Define the exact read-only payloads required by the structured Digital Den workspace before any staging API is connected.

## Transport

- Base URL: staging-only HTTPS origin.
- Authentication: secure, HTTP-only, same-site session cookie.
- Methods: GET only.
- Cache: no-store.
- Contract header: `X-Digital-Den-Contract: 2026-08-01.v1`.
- Every response includes `generatedAt` and `correlationId`.
- The server resolves role and project scope. The client never submits an authoritative role.

## Endpoints

### GET /api/digital-den/session

Returns the authenticated actor and server-authorised scope.

```json
{
  "contractVersion": "2026-08-01.v1",
  "correlationId": "corr_...",
  "generatedAt": "2026-08-01T20:00:00Z",
  "actor": {
    "actorId": "usr_...",
    "organisationId": "org_...",
    "role": "manager",
    "projectScopes": ["DD-2401", "DD-2398"],
    "sessionId": "sess_..."
  }
}
```

### GET /api/digital-den/overview

Returns role-scoped summary data only.

```json
{
  "contractVersion": "2026-08-01.v1",
  "correlationId": "corr_...",
  "generatedAt": "2026-08-01T20:00:00Z",
  "projects": [],
  "reviewQueue": [],
  "unreadMessageCount": 0,
  "flaggedMessageCount": 0
}
```

### GET /api/digital-den/projects

Returns only projects within the authenticated actor scope.

### GET /api/digital-den/reviews

Manager only. Team members and clients receive `403 FORBIDDEN` rather than an empty manager dataset.

### GET /api/digital-den/messages

Returns only authorised project threads. Message bodies must never leak across project scope.

### GET /api/digital-den/files

Returns metadata only. Download URLs are not returned directly; future downloads require a separate short-lived authorised link flow.

### GET /api/digital-den/clients

Manager only.

### GET /api/digital-den/team

Manager only.

### GET /api/digital-den/audit

Manager only. Read-only operational events.

### GET /api/digital-den/communication-policies

Manager only. Returns current policy metadata and enforcement state, not mutable settings.

## Error envelope

```json
{
  "contractVersion": "2026-08-01.v1",
  "error": {
    "code": "FORBIDDEN",
    "message": "The current actor is not authorised for this resource.",
    "correlationId": "corr_...",
    "retryable": false
  }
}
```

## Role isolation rules

### Manager

May read all Digital Den projects authorised to the manager's organisation and assigned operating scope. May read review queue, clients, team, audit and communication policies.

### Team Member

May read only assigned projects, assigned workstreams, authorised messages and scanned file metadata. Must not receive client portfolio, team-wide capacity, audit, moderation queue or billing data.

### Client

May read only projects owned by that client account, authorised messages, file metadata and future payment-state summaries. Must not receive internal team identities, review queue, audit events, moderation controls or other clients.

## Non-negotiable server rules

- Never trust role, organisation or project IDs supplied by the browser.
- Resolve all scope from the authenticated session.
- Apply organisation and project filters in the database query itself.
- Return `403` for unauthorised resource classes and `404` for out-of-scope individual resources where disclosure would reveal existence.
- Log correlation ID, actor ID, route, decision and outcome without logging message bodies or secrets.
- No write route may be added under this read-model milestone.
