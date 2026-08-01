# Digital Den Dashboard Stability Gates v1

## Purpose

These gates prevent Digital Den Dashboard development from interrupting the current operational website, enquiry flow, email delivery, Vercel deployment or compatibility dashboard.

## Gate 1 — Production preservation

- `main` remains the operational baseline.
- `feature/client-dashboard-v2` remains the current dashboard prototype baseline.
- New implementation work occurs on isolated branches and pull requests.
- No direct production mutation is permitted.
- Existing public routes must remain compatible until an approved migration window.

## Gate 2 — Explicit capability states

Every module must be classified as one of:

- operational;
- read-only;
- foundation;
- staging;
- planned;
- disabled.

Foundation and planned modules must not appear to perform production actions.

## Gate 3 — Feature controls

New capabilities require independent server-controlled flags. At minimum:

- `DIGITAL_DEN_WORKSPACE_V2_ENABLED`;
- `DIGITAL_DEN_READ_MODEL_ENABLED`;
- `DIGITAL_DEN_REVIEW_MUTATIONS_ENABLED`;
- `DIGITAL_DEN_MESSAGES_ENABLED`;
- `DIGITAL_DEN_FILES_ENABLED`;
- `DIGITAL_DEN_PAYMENT_STATUS_ENABLED`.

A global workspace kill switch must return users to the compatibility dashboard.

## Gate 4 — Authentication and authorisation

- The backend resolves identity, organisation, role and project scope.
- Client-side role switching is prohibited in production.
- Every route and API operation enforces role and project scope independently.
- Manager visibility is limited to authorised projects and conversations.
- Team members see assigned work only.
- Clients see their organisation's approved data only.
- Direct URL and direct API access outside scope must return a denial response.

## Gate 5 — Contract integrity

- Contracts are versioned.
- Responses identify the contract version.
- Errors include stable codes and correlation identifiers.
- Mutations require idempotency keys and expected versions.
- Breaking changes require a new contract version and migration plan.
- UI code must not infer authority from display state.

## Gate 6 — Data and database safety

- Initial integration is read-only.
- Schema changes are additive and backward-compatible.
- Existing fields, tables and indexes are not removed during staged rollout.
- Database migrations have checksums, controlled execution and rollback instructions.
- Production data is not used as mutable staging test data.

## Gate 7 — Communication safety

Communication-policy checks must be enforced server-side for:

- personal contact details;
- external links;
- off-platform messaging invitations;
- off-platform payment requests;
- suspicious attachments;
- repeated policy bypass attempts.

Flagged content requires an auditable moderation state. UI-only moderation is not accepted.

## Gate 8 — File safety

- Private storage by default.
- Malware scanning state recorded before download availability.
- Expiring authorised download links.
- Media type and size restrictions.
- Project and organisation scope checks on upload and download.
- Quarantine and audit trail for suspicious files.

## Gate 9 — Payment boundary

- Digital Den does not implement a second payment engine.
- Payment state is supplied by the central payment platform.
- No client-side payment status is trusted as authoritative.
- Refund, dispute, transfer and payout decisions remain within the central payment domain.
- Initial dashboard integration is read-only.

## Gate 10 — Automated quality checks

Required before merge:

- dependency-free foundation validation;
- type checking once a TypeScript toolchain is introduced;
- unit tests for domain policies;
- API contract tests;
- role-isolation tests;
- route and direct-API denial tests;
- accessibility checks;
- responsive visual review;
- Vercel preview success;
- no committed credentials or private keys.

## Gate 11 — Rollout and rollback

- Staging uses separate configuration and data stores.
- Canary access begins with a controlled internal account.
- Read models are compared before write actions are enabled.
- Each mutation family is activated separately.
- Rollback must not require a database rollback for additive changes.
- The compatibility dashboard remains available during the stabilisation period.

## Immediate stop conditions

Rollout stops immediately if any of the following is observed:

- cross-client or cross-project data exposure;
- role escalation;
- missing or unverifiable audit events;
- payment-state mismatch;
- message-policy bypass;
- unauthorised file access;
- elevated error rate affecting existing operations;
- inability to return safely to the compatibility dashboard.
