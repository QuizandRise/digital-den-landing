export const DIGITAL_DEN_CONTRACT_VERSION = "2026-08-01.v1" as const;

export type DigitalDenRole = "manager" | "team_member" | "client";

export type ProjectStatus =
  | "draft"
  | "active"
  | "awaiting_review"
  | "revision_requested"
  | "approved"
  | "ready_for_delivery"
  | "delivered"
  | "cancelled";

export type WorkstreamStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "awaiting_review"
  | "approved"
  | "completed";

export type ReviewDecision = "approve" | "request_changes" | "reject";

export type CommunicationPolicyFlag =
  | "external_link"
  | "personal_contact_details"
  | "off_platform_messaging"
  | "off_platform_payment"
  | "suspicious_attachment"
  | "manual_review_required";

export interface AuthenticatedActor {
  actorId: string;
  organisationId: string;
  role: DigitalDenRole;
  projectScopes: string[];
  sessionId: string;
}

export interface DigitalDenProjectSummary {
  projectId: string;
  organisationId: string;
  clientId: string;
  title: string;
  serviceCategory: string;
  status: ProjectStatus;
  progressPercent: number;
  managerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkstreamSummary {
  workstreamId: string;
  projectId: string;
  title: string;
  status: WorkstreamStatus;
  assigneeId: string | null;
  dueAt: string | null;
  updatedAt: string;
}

export interface ReviewQueueItem {
  reviewId: string;
  projectId: string;
  workstreamId: string;
  submittedBy: string;
  submittedAt: string;
  version: number;
  status: "pending" | "approved" | "changes_requested" | "rejected";
}

export interface MessageSummary {
  messageId: string;
  projectId: string;
  threadId: string;
  senderId: string;
  senderRole: DigitalDenRole;
  body: string;
  createdAt: string;
  policyFlags: CommunicationPolicyFlag[];
  moderationState: "clear" | "flagged" | "blocked" | "released";
}

export interface FileDescriptor {
  fileId: string;
  projectId: string;
  name: string;
  mediaType: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
  malwareScanState: "pending" | "clean" | "quarantined" | "failed";
  downloadState: "unavailable" | "available" | "expired";
}

export interface DashboardOverviewResponse {
  contractVersion: typeof DIGITAL_DEN_CONTRACT_VERSION;
  actor: AuthenticatedActor;
  projects: DigitalDenProjectSummary[];
  reviewQueue: ReviewQueueItem[];
  unreadMessageCount: number;
  flaggedMessageCount: number;
  generatedAt: string;
}

export interface ProjectDetailResponse {
  contractVersion: typeof DIGITAL_DEN_CONTRACT_VERSION;
  actor: AuthenticatedActor;
  project: DigitalDenProjectSummary;
  workstreams: WorkstreamSummary[];
  files: FileDescriptor[];
  generatedAt: string;
}

export interface ApiErrorResponse {
  contractVersion: typeof DIGITAL_DEN_CONTRACT_VERSION;
  error: {
    code:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "VALIDATION_ERROR"
      | "RATE_LIMITED"
      | "DEPENDENCY_UNAVAILABLE"
      | "INTERNAL_ERROR";
    message: string;
    correlationId: string;
    retryable: boolean;
  };
}

export interface MutationEnvelope<TPayload> {
  contractVersion: typeof DIGITAL_DEN_CONTRACT_VERSION;
  idempotencyKey: string;
  expectedVersion: number;
  payload: TPayload;
}

export interface ReviewMutationPayload {
  reviewId: string;
  decision: ReviewDecision;
  comment: string | null;
}

export interface AssignmentMutationPayload {
  projectId: string;
  workstreamId: string;
  assigneeId: string;
}

export interface MessageMutationPayload {
  projectId: string;
  threadId: string;
  body: string;
  attachmentIds: string[];
}

export const DIGITAL_DEN_ROUTE_POLICY = {
  manager: ["overview", "projects", "review", "messages", "communication_control", "clients", "team", "audit"],
  team_member: ["overview", "assigned_work", "messages", "files"],
  client: ["overview", "projects", "messages", "files", "billing"],
} as const satisfies Record<DigitalDenRole, readonly string[]>;
