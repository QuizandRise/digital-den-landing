# Digital Den Core Architecture

Status: Initial architecture baseline  
Branch: `feature/client-dashboard-v2`  
Purpose: Define the system spine before production backend implementation.

## 1. Architectural principle

Digital Den is not a collection of dashboard pages. It is a controlled workspace built around five engines:

1. Scope Engine
2. Permission Engine
3. Communication Hub
4. AI Decision Engine
5. Audit and Compliance Engine

The user interface must consume decisions from these engines. It must not become the source of truth for access, workflow, moderation, or AI authority.

## 2. Canonical entity hierarchy

```text
Organisation
└── Brand
    └── Client
        └── Project
            ├── Project Scope
            ├── Workstreams
            │   └── Tasks
            ├── Conversations
            ├── Files and Versions
            ├── Reviews
            ├── Deliveries
            ├── Permissions
            └── Audit Events
```

Every operational object must belong to an organisation and brand. Project-level objects must also reference the client and project. Workstream and task references are mandatory when access must be narrower than the project.

## 3. Scope Engine

### 3.1 Purpose

The Scope Engine determines what Digital Den agreed to deliver, what is excluded, what is pending clarification, and what requires a formal change request.

### 3.2 Scope record

Each project scope contains:

- `scopeId`
- `projectId`
- `version`
- `status`: `draft | active | superseded | closed`
- `effectiveFrom`
- `approvedByClientAt`
- `approvedByManagerAt`
- `includedItems[]`
- `excludedItems[]`
- `assumptions[]`
- `dependencies[]`
- `constraints[]`
- `deliverables[]`
- `milestones[]`
- `revisionAllowance`
- `commercialNotesRef`

### 3.3 Scope item states

```text
IN_SCOPE
OUT_OF_SCOPE
AMBIGUOUS
CHANGE_REQUEST_REQUIRED
MANAGER_DECISION_REQUIRED
```

### 3.4 Scope decision rule

AI and employees may explain approved scope. They may not extend it.

When a client request is outside or unclear:

```text
Client request
→ Scope comparison
→ Out-of-scope or ambiguous detected
→ No promise is made
→ Change request created
→ Manager notified
→ Manager decides commercial and delivery impact
```

### 3.5 Scope versioning

Scope records are append-only. A revised scope creates a new version. Previous versions remain available for evidence and audit.

## 4. Permission Engine

### 4.1 Principle

Access is determined by both role and assignment.

```text
Effective access = Role permissions ∩ Assignment scope ∩ Object state ∩ Policy restrictions
```

### 4.2 Role hierarchy

```text
Super Admin
Project Manager
Team Member
Finance
Support
Client
AI Service Identity
```

Job titles such as designer, developer, editor, or writer do not automatically grant project access. They are team-member profiles combined with explicit assignments.

### 4.3 Assignment scopes

1. Brand assignment
2. Client assignment
3. Project assignment
4. Workstream assignment
5. Task assignment
6. Conversation assignment

A narrower assignment does not inherit visibility into sibling workstreams or tasks.

### 4.4 Core permissions

- `VIEW_BRAND`
- `VIEW_CLIENT`
- `VIEW_PROJECT`
- `VIEW_SCOPE`
- `VIEW_WORKSTREAM`
- `VIEW_TASK`
- `CREATE_TASK_UPDATE`
- `UPLOAD_FILE`
- `DOWNLOAD_FILE`
- `SUBMIT_FOR_REVIEW`
- `REVIEW_WORK`
- `APPROVE_WORK`
- `RELEASE_TO_CLIENT`
- `VIEW_INTERNAL_MESSAGE`
- `SEND_INTERNAL_MESSAGE`
- `VIEW_CLIENT_MESSAGE`
- `SEND_CLIENT_MESSAGE`
- `ASSIGN_CONVERSATION`
- `CONTROL_AI_MODE`
- `MANAGE_COMMUNICATION_POLICY`
- `VIEW_AUDIT_LOG`
- `EXPORT_EVIDENCE`

### 4.5 Enforcement

All authorisation must be enforced server-side. A denied request returns `403 Forbidden` and creates a security audit event when the attempt is material.

## 5. Communication Hub

### 5.1 Conversation routing

Client messages do not automatically reach an employee.

```text
Client
→ Communication Hub
→ Project and topic classification
→ AI triage within authority
→ Manager Queue or Assigned Conversation
```

### 5.2 Conversation categories

- General
- Project delivery
- Design
- Development
- Content
- Video
- Billing
- Support
- Complaint
- Scope change
- Privacy or security

### 5.3 Conversation ownership

Every conversation has:

- one current owner
- zero or more assigned participants
- one manager with supervisory visibility
- an AI operating mode
- an immutable policy snapshot

### 5.4 Conversation states

```text
NEW
AI_TRIAGE
WAITING_MANAGER
WAITING_TEAM
WAITING_CLIENT
MANAGER_IN_CONTROL
RESOLVED
ARCHIVED
SUSPENDED
```

### 5.5 Direct employee-client chat

Direct communication is disabled by default.

A manager may enable it for a specific:

- project
- workstream
- task
- conversation
- named employee
- time window

The manager retains visibility and may pause, join, reassign, or terminate the permission.

### 5.6 Message immutability

After a message is accepted by the server:

- clients cannot edit it
- employees cannot edit it
- managers cannot silently edit it
- users cannot silently delete it
- corrections are sent as new messages
- moderation may hide a message from ordinary participants, but the original remains preserved

The message record stores a content hash and append-only event history.

### 5.7 Permitted message actions

- Reply
- Quote
- Pin, subject to permission
- Report
- Attach an approved file

No `Edit` or user-controlled permanent `Delete` action exists.

### 5.8 Moderation

Every outgoing employee or client message is checked for:

- external URLs
- phone numbers
- personal email addresses
- WhatsApp or Telegram references
- requests to move communication off-platform
- off-platform payment requests
- suspicious meeting invitations
- prohibited attachment types
- repeated policy breaches

Possible decisions:

```text
ALLOW
ALLOW_AND_LOG
HOLD_FOR_MANAGER
BLOCK_AND_FLAG
BLOCK_AND_ESCALATE
QUARANTINE_ATTACHMENT
SUSPEND_CHAT_ACCESS
```

## 6. AI Decision Engine

### 6.1 Context order

AI must resolve context in this order before acting:

```text
Organisation policy
→ Brand knowledge
→ Client record
→ Project
→ Active scope version
→ Workstream and task
→ Conversation policy
→ User permissions
→ Conversation history
→ Requested action
```

AI must not answer from the final message alone.

### 6.2 AI modes

```text
OFF
DRAFT_ONLY
TRIAGE_ONLY
ASSISTED_REPLY
LIMITED_AUTONOMY
MANAGER_IN_CONTROL
```

### 6.3 AI may

- greet and acknowledge the client
- identify the relevant project
- classify the message
- ask for missing operational details
- explain approved project status
- explain approved scope
- answer from approved brand and project knowledge
- create a ticket
- prepare a manager draft
- route the conversation
- flag risk
- escalate

### 6.4 AI may not

- change pricing
- alter deadlines
- promise new deliverables
- approve out-of-scope work
- approve refunds
- settle disputes
- release unapproved files
- disclose internal notes or unrelated workstreams
- grant off-platform communication
- make final legal, privacy, compliance, or contractual decisions

### 6.5 Mandatory escalation triggers

- client asks for a manager
- scope change or unclear scope
- billing, refund, or payment dispute
- complaint or material dissatisfaction
- deadline risk
- legal, privacy, or security issue
- AI confidence below configured threshold
- contradiction between client request and project record
- request to communicate or pay outside the platform
- repeated moderation breach

### 6.6 Manager takeover

```text
AI_ASSISTED
→ MANAGER_REQUESTED
→ MANAGER_JOINING
→ MANAGER_IN_CONTROL
→ optionally RETURNED_TO_AI_ASSISTED
```

When the manager takes control, automated replies stop immediately. The manager receives a compact briefing containing scope, project status, participants, recent messages, risk flags, unresolved decisions, and actions already taken by AI.

## 7. Audit and Compliance Engine

### 7.1 Append-only events

The audit system records events rather than overwriting history.

Each event contains:

- `eventId`
- `organisationId`
- `brandId`
- `clientId`
- `projectId`
- optional `workstreamId`
- optional `taskId`
- optional `conversationId`
- `actorType`: `human | ai | system`
- `actorId`
- `action`
- `targetType`
- `targetId`
- `occurredAt`
- `reason`
- `metadata`
- `previousStateHash`
- `newStateHash`

### 7.2 Events that must be recorded

- login and material security events
- permission changes
- assignments and removals
- scope approval and scope revisions
- AI mode changes
- conversation owner changes
- messages accepted, blocked, held, or hidden
- manager takeover
- file upload and download
- file version creation
- review decisions
- client release
- client approval or revision request
- evidence export

### 7.3 Evidence preservation

A hidden or blocked message remains accessible to authorised managers and auditors. Its original text, sender, timestamp, moderation result, and policy rule are preserved.

## 8. File and delivery integrity

Files use immutable versions.

```text
Asset
├── Version 1
├── Version 2
├── Version 3 — Manager Approved
└── Version 4 — Client Released
```

Uploading a replacement creates a new version. It never overwrites the prior binary record.

Only a manager or authorised reviewer may mark a version approved. Only authorised management may release it to a client.

## 9. Workflow state machine

```text
ASSIGNED
→ IN_PROGRESS
→ SUBMITTED_FOR_MANAGER_REVIEW
→ CHANGES_REQUESTED | REJECTED | MANAGER_APPROVED
→ READY_FOR_CLIENT_DELIVERY
→ RELEASED_TO_CLIENT
→ CLIENT_APPROVED | CLIENT_REVISION_REQUESTED
→ CLOSED
```

Direct transition from employee submission to client release is prohibited.

## 10. Initial backend boundaries

Recommended service modules:

```text
identity-service
workspace-service
scope-service
permission-service
conversation-service
moderation-service
ai-orchestration-service
file-service
review-delivery-service
audit-service
notification-service
```

For an initial modular monolith, these may be internal modules sharing one deployment, but their data ownership and interfaces should remain explicit.

## 11. First implementation sequence

1. Define database schemas and identifiers.
2. Implement Permission Engine middleware.
3. Implement Scope Engine and scope versioning.
4. Implement immutable conversations and messages.
5. Implement manager-controlled conversation assignment.
6. Implement moderation decisions and escalation queue.
7. Implement AI context assembly and authority checks.
8. Implement append-only audit events.
9. Connect Manager Workspace UI.
10. Add Client and Team Member views only after server enforcement is testable.

## 12. Non-negotiable controls

- No frontend-only permissions.
- No editable client or employee messages after sending.
- No direct employee-to-client access without manager grant.
- No AI promise outside approved scope.
- No delivery without manager approval.
- No overwriting file versions.
- No silent deletion of evidence.
- No AI action without recorded context, authority level, and audit event.
