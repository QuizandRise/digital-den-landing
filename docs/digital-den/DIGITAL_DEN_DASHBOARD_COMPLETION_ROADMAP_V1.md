# Digital Den Dashboard Completion Roadmap v1

## Objective

Complete the Digital Den operational workspace without disrupting the existing static dashboard, enquiry flow, email delivery, Vercel deployment, or any production route.

## Architectural decision

Digital Den remains an independent operational workspace within the Quiz & Rise ecosystem. It shares enterprise identity, payments, notifications, secure files, audit and compliance services, but retains its own project-delivery workflow and role model.

## Delivery sequence

### Stage 0 — Baseline and safety controls

- Preserve `dashboard.html` as the current compatibility baseline.
- Keep the current production route unchanged.
- Record current UI, role previews, project cards, review queue, messages and communication-control behaviour.
- Require reversible changes and explicit rollback instructions.

### Stage 1 — Versioned domain and API contracts

- Define project, workstream, review, message, file and actor contracts.
- Define manager, team-member and client role boundaries.
- Require contract versioning, correlation identifiers, idempotency keys and optimistic concurrency for future mutations.
- Add dependency-free CI validation so the static production model remains build-tool agnostic.

Status: foundation implemented in PR #5.

### Stage 2 — Componentised application shell behind feature flags

- Introduce a new application shell without replacing `dashboard.html`.
- Separate navigation, layout, role-aware views, project summaries, review queue, messages and policy controls.
- Keep mock providers isolated from production providers.
- Add a single kill switch for the new workspace.

### Stage 3 — Authenticated read-only integration

- Resolve identity and role server-side.
- Load only projects within the actor's authorised organisation and project scopes.
- Connect overview, project details, workstreams, review state, files and message summaries as read-only data.
- Deny direct URL access outside the actor's scope.

### Stage 4 — Controlled workflow mutations

Enable one operation at a time behind independent feature flags:

1. workstream assignment;
2. review approval or change request;
3. controlled project status transitions;
4. message submission;
5. secure file upload and download.

Every mutation requires server-side authorisation, idempotency, expected-version checks, audit logging and explicit failure responses.

### Stage 5 — Shared ecosystem integrations

- Central payment-state visibility without duplicating the payment engine.
- Shared notification delivery.
- Secure object storage and expiring downloads.
- Communication-policy enforcement at the server boundary.
- Enterprise audit and compliance event forwarding.

### Stage 6 — Staging acceptance and canary rollout

- Validate desktop, tablet, mobile and keyboard access.
- Complete role-isolation and project-scope tests.
- Compare new and existing read models.
- Enable the new workspace only for a controlled internal account first.
- Preserve immediate rollback to the compatibility dashboard.

## Workspace boundaries

### Manager workspace

- portfolio overview;
- project and workstream management;
- team assignment;
- review queue;
- authorised conversation visibility;
- policy flag review;
- audit visibility within authorised scope.

### Team-member workspace

- assigned projects and workstreams only;
- submissions and revision requests;
- authorised project messages;
- approved file access;
- no client, team, finance or policy administration.

### Client workspace

- own organisation's projects only;
- approved progress and delivery state;
- authorised messages;
- approved files and deliverables;
- billing and payment status supplied by the central payment platform;
- no internal notes, team controls or moderation controls.

## Non-goals

- No payment engine inside Digital Den.
- No role switching in production.
- No shared unrestricted dashboard for all roles.
- No migration of QRIOS, MealDen or GoCamp operational logic into this repository.
- No production write integration before read-only acceptance.

## Completion definition

Digital Den Dashboard v2 is complete only when authenticated users receive the correct role-specific workspace, data access is enforced server-side, core workflows persist safely, central services are integrated through versioned contracts, CI and security gates pass, and the previous operational route remains available for rollback during the agreed stabilisation period.
