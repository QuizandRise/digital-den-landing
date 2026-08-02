# Digital Den Dashboard Completion Roadmap v1

## Target architecture

Digital Den remains an independent operational workspace within the Quiz & Rise ecosystem. It shares identity, payments, notifications, audit and compliance services, but it retains its own project-delivery workflow and role model.

## Workspaces

### Manager Workspace

- Portfolio overview
- Project intake and triage
- Client and team assignment
- Workstream control
- Review queue
- Delivery approval
- Communication-policy review
- Billing and payment-state visibility
- Audit and exception handling

### Team Member Workspace

- Assigned projects only
- Assigned workstreams only
- Task and file delivery
- Internal discussion
- Revision requests
- No client contact unless explicitly authorised
- No financial administration

### Client Workspace

- Own projects only
- Project status and milestones
- Approved messages and files
- Review and feedback
- Delivery acceptance
- Billing and payment-state visibility
- No internal team or audit visibility

## Shared platform dependencies

Digital Den should consume, not duplicate:

- Quiz & Rise identity and session service
- Unified payment platform
- Central notification service
- Shared secure-file service
- Enterprise audit service
- Central compliance and communication-policy service

## Delivery phases

### Phase A — Foundation and safety

- Current-state audit
- Route and role inventory
- Feature flags
- Typed domain and API contracts
- Shared UI primitives
- CI baseline
- Preview-only deployment

### Phase B — Read-only integration

- Authenticated current-user endpoint
- Read-only project list
- Read-only project detail
- Read-only messages and files
- Read-only payment status
- Loading, empty and error states

### Phase C — Controlled workflow mutations

- Create project from approved intake
- Assign team members
- Submit workstream output
- Request revision
- Approve delivery
- Client acceptance

Every mutation requires:

- server-side role and project-scope validation
- idempotency
- optimistic concurrency
- audit persistence
- explicit failure response

### Phase D — Communications and files

- Durable conversations
- Attachment upload through signed storage
- Server-side moderation
- Flag, review and resolution workflow
- Malware and file-type validation

### Phase E — Payments and delivery

- Central payment-profile registration for Digital Den
- Read-only payment, invoice, refund and dispute states
- Delivery blocking rules based on approved commercial policy
- No payment ledger duplication inside Digital Den

### Phase F — Staging acceptance

- End-to-end client project
- Role-isolation tests
- Cross-client access denial
- Communication bypass tests
- File-security tests
- Payment-state reconciliation
- Mobile and accessibility acceptance
- Rollback rehearsal

## Stable route policy

Existing production routes remain unchanged until cutover approval. New routes should be introduced behind feature flags and should not replace an operational route by default.

Suggested routes:

- `/workspace/manager`
- `/workspace/team`
- `/workspace/client`

The authenticated backend resolves the actual role; the interface must not offer unrestricted role switching outside an explicit non-production demonstration mode.

## Completion definition

The Digital Den dashboard is complete when:

- users see only authorised projects and actions;
- project and communication data persist;
- critical transitions are audited and idempotent;
- payment status comes from the unified payment platform;
- CI, security and accessibility checks pass;
- staging end-to-end evidence is approved;
- production rollout is reversible.
