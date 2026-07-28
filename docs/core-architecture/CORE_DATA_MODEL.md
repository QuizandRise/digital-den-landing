# Digital Den Core Data Model

This document defines the first implementation-level data model for the Digital Den workspace. Field names are illustrative and should be translated into the final backend conventions.

## 1. Organisation

```ts
type Organisation = {
  id: string;
  legalName: string;
  displayName: string;
  status: 'active' | 'suspended' | 'closed';
  createdAt: string;
  updatedAt: string;
};
```

## 2. Brand

```ts
type Brand = {
  id: string;
  organisationId: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  knowledgeBaseRef?: string;
  communicationPolicyId: string;
  createdAt: string;
  updatedAt: string;
};
```

## 3. Client

```ts
type Client = {
  id: string;
  organisationId: string;
  brandId: string;
  displayName: string;
  legalName?: string;
  primaryContactUserId: string;
  status: 'lead' | 'active' | 'paused' | 'closed';
  riskFlags: string[];
  createdAt: string;
  updatedAt: string;
};
```

## 4. Project

```ts
type Project = {
  id: string;
  organisationId: string;
  brandId: string;
  clientId: string;
  code: string;
  name: string;
  description?: string;
  status:
    | 'draft'
    | 'active'
    | 'on_hold'
    | 'at_risk'
    | 'completed'
    | 'closed';
  currentScopeVersionId: string;
  managerUserId: string;
  startDate?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
};
```

## 5. Project scope and versions

```ts
type ProjectScopeVersion = {
  id: string;
  organisationId: string;
  brandId: string;
  clientId: string;
  projectId: string;
  versionNumber: number;
  status: 'draft' | 'active' | 'superseded' | 'closed';
  includedItems: ScopeItem[];
  excludedItems: ScopeItem[];
  assumptions: string[];
  dependencies: string[];
  constraints: string[];
  deliverables: ScopeDeliverable[];
  revisionAllowance?: {
    totalRounds?: number;
    notes?: string;
  };
  approvedByManagerUserId?: string;
  approvedByManagerAt?: string;
  approvedByClientUserId?: string;
  approvedByClientAt?: string;
  supersedesScopeVersionId?: string;
  contentHash: string;
  createdAt: string;
};

type ScopeItem = {
  id: string;
  title: string;
  description?: string;
  classification:
    | 'in_scope'
    | 'out_of_scope'
    | 'ambiguous'
    | 'change_request_required'
    | 'manager_decision_required';
  workstreamId?: string;
};

type ScopeDeliverable = {
  id: string;
  title: string;
  description?: string;
  acceptanceCriteria: string[];
  targetDate?: string;
  status: 'planned' | 'in_progress' | 'submitted' | 'approved' | 'released';
};
```

## 6. Workstream and task

```ts
type Workstream = {
  id: string;
  organisationId: string;
  brandId: string;
  clientId: string;
  projectId: string;
  name: string;
  description?: string;
  status: 'planned' | 'active' | 'review' | 'approved' | 'closed';
  ownerUserId?: string;
  createdAt: string;
  updatedAt: string;
};

type Task = {
  id: string;
  organisationId: string;
  brandId: string;
  clientId: string;
  projectId: string;
  workstreamId: string;
  title: string;
  description?: string;
  status:
    | 'assigned'
    | 'in_progress'
    | 'submitted_for_manager_review'
    | 'changes_requested'
    | 'rejected'
    | 'manager_approved'
    | 'ready_for_client_delivery'
    | 'released_to_client'
    | 'client_approved'
    | 'client_revision_requested'
    | 'closed';
  assigneeUserIds: string[];
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

## 7. Role, permission and assignment

```ts
type Role =
  | 'super_admin'
  | 'project_manager'
  | 'team_member'
  | 'finance'
  | 'support'
  | 'client'
  | 'ai_service';

type AssignmentScopeType =
  | 'brand'
  | 'client'
  | 'project'
  | 'workstream'
  | 'task'
  | 'conversation';

type AccessAssignment = {
  id: string;
  organisationId: string;
  userId: string;
  role: Role;
  scopeType: AssignmentScopeType;
  scopeId: string;
  permissions: string[];
  grantedByUserId: string;
  startsAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revokeReason?: string;
  createdAt: string;
};
```

## 8. Communication policy

```ts
type CommunicationPolicy = {
  id: string;
  organisationId: string;
  brandId?: string;
  name: string;
  allowDirectEmployeeClientChatByDefault: false;
  requireManagerVisibility: true;
  messageEditingAllowed: false;
  userMessageDeletionAllowed: false;
  externalLinks: 'allow' | 'hold' | 'block';
  personalEmailAddresses: 'allow' | 'hold' | 'block';
  phoneNumbers: 'allow' | 'hold' | 'block';
  offPlatformInvitations: 'allow' | 'hold' | 'block';
  offPlatformPayments: 'block_and_escalate';
  allowedAttachmentTypes: string[];
  maxAttachmentBytes: number;
  repeatedBreachThreshold: number;
  createdAt: string;
  updatedAt: string;
};
```

## 9. Conversation

```ts
type ConversationState =
  | 'new'
  | 'ai_triage'
  | 'waiting_manager'
  | 'waiting_team'
  | 'waiting_client'
  | 'manager_in_control'
  | 'resolved'
  | 'archived'
  | 'suspended';

type AIMode =
  | 'off'
  | 'draft_only'
  | 'triage_only'
  | 'assisted_reply'
  | 'limited_autonomy'
  | 'manager_in_control';

type Conversation = {
  id: string;
  organisationId: string;
  brandId: string;
  clientId: string;
  projectId: string;
  workstreamId?: string;
  taskId?: string;
  category:
    | 'general'
    | 'project_delivery'
    | 'design'
    | 'development'
    | 'content'
    | 'video'
    | 'billing'
    | 'support'
    | 'complaint'
    | 'scope_change'
    | 'privacy_security';
  state: ConversationState;
  ownerUserId?: string;
  supervisingManagerUserId: string;
  participantUserIds: string[];
  aiMode: AIMode;
  policySnapshot: CommunicationPolicy;
  directChatGrantId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
};
```

## 10. Direct chat grant

```ts
type DirectChatGrant = {
  id: string;
  organisationId: string;
  conversationId: string;
  employeeUserId: string;
  clientUserIds: string[];
  scopeType: 'project' | 'workstream' | 'task' | 'conversation';
  scopeId: string;
  grantedByManagerUserId: string;
  startsAt: string;
  expiresAt?: string;
  status: 'active' | 'paused' | 'revoked' | 'expired';
  revokedAt?: string;
  revokedByUserId?: string;
  revokeReason?: string;
};
```

## 11. Immutable message

```ts
type MessageModerationDecision =
  | 'allow'
  | 'allow_and_log'
  | 'hold_for_manager'
  | 'block_and_flag'
  | 'block_and_escalate';

type Message = {
  id: string;
  organisationId: string;
  brandId: string;
  clientId: string;
  projectId: string;
  conversationId: string;
  senderType: 'human' | 'ai' | 'system';
  senderId: string;
  body: string;
  bodyHash: string;
  replyToMessageId?: string;
  quotedMessageId?: string;
  visibility: 'participants' | 'manager_only' | 'hidden_by_moderation';
  moderationDecision: MessageModerationDecision;
  moderationRuleIds: string[];
  riskScore?: number;
  acceptedAt?: string;
  heldAt?: string;
  blockedAt?: string;
  createdAt: string;
};
```

There is intentionally no `updatedAt` for message body content. Message text is immutable after creation.

## 12. Message event

```ts
type MessageEvent = {
  id: string;
  messageId: string;
  conversationId: string;
  action:
    | 'created'
    | 'accepted'
    | 'held'
    | 'blocked'
    | 'flagged'
    | 'hidden'
    | 'released_by_manager'
    | 'reported'
    | 'pinned';
  actorType: 'human' | 'ai' | 'system';
  actorId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
};
```

## 13. AI action record

```ts
type AIActionRecord = {
  id: string;
  organisationId: string;
  brandId: string;
  clientId: string;
  projectId: string;
  conversationId?: string;
  aiMode: AIMode;
  actionType:
    | 'classify'
    | 'request_information'
    | 'draft_reply'
    | 'send_reply'
    | 'route'
    | 'create_ticket'
    | 'flag_risk'
    | 'escalate';
  contextRefs: {
    scopeVersionId: string;
    permissionSnapshotId: string;
    policySnapshotId: string;
    knowledgeRefs: string[];
  };
  confidence?: number;
  authorityDecision: 'allowed' | 'denied' | 'manager_required';
  outputRef?: string;
  createdAt: string;
};
```

## 14. File asset and version

```ts
type FileAsset = {
  id: string;
  organisationId: string;
  brandId: string;
  clientId: string;
  projectId: string;
  workstreamId?: string;
  taskId?: string;
  name: string;
  currentVersionId: string;
  createdAt: string;
};

type FileVersion = {
  id: string;
  assetId: string;
  versionNumber: number;
  storageRef: string;
  checksum: string;
  mimeType: string;
  bytes: number;
  uploadedByUserId: string;
  reviewStatus: 'unreviewed' | 'changes_requested' | 'approved' | 'rejected';
  clientReleaseStatus: 'not_released' | 'released' | 'withdrawn';
  createdAt: string;
};
```

## 15. Review and delivery

```ts
type ReviewDecision = {
  id: string;
  projectId: string;
  taskId?: string;
  fileVersionId?: string;
  reviewerUserId: string;
  decision: 'approved' | 'changes_requested' | 'rejected';
  reason?: string;
  createdAt: string;
};

type ClientDelivery = {
  id: string;
  organisationId: string;
  brandId: string;
  clientId: string;
  projectId: string;
  releasedFileVersionIds: string[];
  releasedByUserId: string;
  releasedAt: string;
  status: 'released' | 'client_approved' | 'revision_requested' | 'closed';
  clientDecisionAt?: string;
};
```

## 16. Audit event

```ts
type AuditEvent = {
  id: string;
  organisationId: string;
  brandId?: string;
  clientId?: string;
  projectId?: string;
  workstreamId?: string;
  taskId?: string;
  conversationId?: string;
  actorType: 'human' | 'ai' | 'system';
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  previousStateHash?: string;
  newStateHash?: string;
  occurredAt: string;
};
```

Audit events are append-only and must not expose ordinary update or delete operations.

## 17. Required database constraints

- Project code unique within an organisation.
- One active scope version per project.
- Scope version numbers unique per project.
- File version numbers unique per asset.
- Message body cannot be updated after insert.
- Revoked or expired assignments cannot authorise access.
- Direct chat requires an active grant and matching assignment scope.
- Employee submission cannot transition directly to client release.
- Client-visible file must reference an approved file version.
- AI send action requires an allowed authority decision and a stored context snapshot.
- Every material state transition writes an audit event in the same transaction or reliable outbox flow.
