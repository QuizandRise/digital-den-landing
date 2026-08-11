# Digital Den Agency Scope Audit V1

| Field | Value |
| --- | --- |
| Product | Digital Den (Quiz & Rise Ltd) |
| Document | `DIGITAL_DEN_AGENCY_SCOPE_AUDIT_V1` |
| Status | Authoritative product-scope audit |
| Branch basis | `refactor/digital-den-agency-scope` from latest `main` |
| Repositories | `quizandrise-ltd/digital-den-api`, `QuizandRise/digital-den-landing` |
| Production reference (read-only) | `https://digital.quizandrise.com` |

## 1. Authoritative product decision

Digital Den is an **internal operational system for a digital-services agency**. It must not operate as a second public marketplace alongside WorkforceDen.

The only public multi-provider marketplace in the Quiz & Rise ecosystem is **WorkforceDen**.

Classification key:

| Code | Meaning |
| --- | --- |
| `KEEP_AS_AGENCY_OPERATION` | Valid agency capability; retain |
| `RENAME_OR_REFRAME` | Keep behaviour; correct marketplace-leaning language or naming |
| `DISABLE` | Capability must remain off / unreachable in production |
| `REMOVE_IF_UNREACHABLE` | Safe to remove only if confirmed unused |
| `WORKFORCEDEN_ONLY` | Belongs exclusively to WorkforceDen; do not reuse as Digital Den marketplace |
| `REQUIRES_PRODUCT_DECISION` | Needs explicit product/legal policy before further activation |

## 2. Open PR inspection (not modified)

Inspected at task start. **No existing PR was merged, closed, or edited.**

### Backend (`quizandrise-ltd/digital-den-api`)

| PR | Title | Notes for this task |
| --- | --- | --- |
| #22 (DRAFT) | Add Digital Den central payment shadow adapter | Useful future direction for central-payment consumption; left untouched. Confirms shadow-only payment posture. |

### Frontend (`QuizandRise/digital-den-landing`)

| PR | Title | Notes for this task |
| --- | --- | --- |
| #30 | docs: revise QR-WD-001 to v1.2 | WorkforceDen onboarding docs; left untouched |
| #27 (DRAFT) | Verify team member invitation status mapping | Agency ops improvement; left untouched |
| #26 (DRAFT) | Improve project workspace mobile readability | Agency UX; left untouched |

## 3. Executive audit summary

| Area | Finding |
| --- | --- |
| Public provider directory / discovery / bidding | **Not implemented** in Digital Den runtime |
| Seller / freelancer / vendor roles | **Absent** from Digital Den role model |
| Digital Den roles | `manager`, `team_member`, `client` only |
| Marketplace semantics in this API repo | Almost entirely **WorkforceDen** co-located code/docs |
| Highest-risk Digital Den items | Dispute assignee exposure to clients; settlement/contractor share fields; “discovery/reviews/Professional/earnings” naming; frontend `platformName: WorkforceDen` |
| Payment execution | Digital Den: shadow-only / not connected. Real Stripe Connect / capture / payout **not activated** for Digital Den |

## 4. Backend findings (`digital-den-api`)

### 4.1 Keep as agency operation

| Path | Why |
| --- | --- |
| `api/create-project.js` | Direct client intake into agency project records |
| `api/digital-den/access/*`, `internal-access/*`, `session.js` | Role-scoped secure access |
| `api/digital-den/team/manage.js` | Manager-only internal staffing and assignment |
| `api/digital-den/messages/send.js` | Project messaging with policy controls |
| `api/digital-den/files/*` | Secure delivery files, quarantine, review, downloads |
| `api/digital-den/audit.js` | Manager audit visibility |
| `api/digital-den/dispute-requests/manage.js` | Dispute request foundation; `paymentExecution: not_connected_shadow_only` |
| `DigitalDenUser.js`, `ClientAccessGrant.js`, `DigitalDenInternalAccessGrant.js` | Agency identity/access grants |
| `lib/digital-den-read-model.js` → `scopedProjectQuery` | Client / team_member project isolation |
| `[resource].js` → `clients` | Manager CRM aggregation, not public directory |
| `[resource].js` → `communication-policies` | Off-platform payment / contact controls |

### 4.2 Rename or reframe

| Path | Why |
| --- | --- |
| `Project.js` → `discoveryMode`, `smartDiscovery` | Means **client brand/intake enrichment**, not provider marketplace discovery |
| `[resource].js` → `reviews` / overview `reviewQueue` | Delivery acceptance queue, **not** public ratings |
| `DigitalDenDisputeRequest.js` → `reviewDecision` | Manager triage language, not reputation |
| Dispute `contractor*` naming | Internal assignee / delivery party, not public marketplace contractor |

### 4.3 Disable

| Path | Why |
| --- | --- |
| `api/digital-den/bootstrap-session.js` | Staging-only role minting; must stay flag-gated off in production |
| Real payment execution / Stripe Connect for Digital Den | Must remain disabled; consume central payment later as shadow/adapter only |

### 4.4 Remove if unreachable

| Path | Why |
| --- | --- |
| `api/send.js` (legacy brief mailer) | Superseded by `create-project.js`; wildcard CORS risk if still routed |

### 4.5 Requires product decision

| Path | Why |
| --- | --- |
| `Project.js` → `settlementState.*`, `disputeControl.contractorPaymentHold` | Agency shadow ledger vs marketplace payout appearance |
| `api/digital-den/disputes/manage.js` → `commonView` exposing `contractorActorId` / `caseManagerActorId` | Internal assignee identifiers visible to clients before redaction |
| `lib/digital-den-session.js` role embedded in cookie | Works for agency, but role-in-cookie is an authority surface (not client-supplied today) |
| Additive `projectSource` + external marketplace metadata | Required by product decision; existing records use `source: 'digital-den'` |

### 4.6 WorkforceDen only (co-located; do not alter for this task)

| Path | Why |
| --- | --- |
| `api/workforceden/**` | Marketplace commercial/payment HTTP surface |
| `WorkforceDen*.js` models | Customer/professional marketplace relationships |
| `lib/workforceden-*.js` | Marketplace auth, commercial, payment, Stripe TEST/LIVE boundaries |
| `docs/WORKFORCEDEN_*`, `docs/workforceden/**` | Marketplace governance and payment doctrine |
| Quote acceptance / professional assignment / Central LIVE payment | Marketplace contracting — not Digital Den agency staffing |

### 4.7 Explicit absences (Digital Den runtime)

- No bidding / competing worker quotes
- No public `/providers`, `/directory`, `/professionals` list APIs
- No seller / freelancer / vendor roles
- No `sourcePlatform` field before this alignment (additive fields introduced separately)
- No Stripe Connect / worker payout execution for Digital Den

## 5. Frontend findings (`digital-den-landing`)

### 5.1 Keep as agency operation

| Path | Why |
| --- | --- |
| `index.html` | Agency marketing + direct project intake |
| `workspace-access.*`, `internal-access.*` | Magic-link entry to role-scoped workspace |
| `dashboard-next/` role routes for manager / team_member / client | Agency operational workspace |
| Team invite, messaging permissions, file/dispute shells | Agency delivery controls |
| `FEATURE_FLAGS.billing: false`, `featureFlags.marketplace: false`, `payments: false` | Correct disabled posture |
| `scripts/test-digital-den-role-isolation.mjs` | Role isolation gates |

### 5.2 Rename or reframe

| Path | Why |
| --- | --- |
| `dashboard-next/src/platform-config.js` `platformName: "WorkforceDen"` | Misrepresents Digital Den as WorkforceDen |
| `roleLabels.team_member: "Professional"` and UI copies | Marketplace-leaning label for internal team members |
| “Assign professional”, “Earnings”, “Professional status” | Agency language should say team member / assigned work / compensation shell |
| Landing process “DISCOVER” | Keep meaning: agency discovers client need (not provider discovery) |

### 5.3 Disable / already disabled

| Path | Why |
| --- | --- |
| Payments, billing mutations, settlement execution UI | Remain disabled placeholders |
| Authenticated role preview switching | Already hidden when authentication is on |

### 5.4 Remove if unreachable

| Path | Why |
| --- | --- |
| `dashboard.html` legacy mock | Contains client-side role switch and sample “Stripe Integration” workstream; superseded by `dashboard-next` |

### 5.5 WorkforceDen only

| Path | Why |
| --- | --- |
| `docs/workforceden/fairness-trust-accessibility/**` | Marketplace fairness doctrine for WorkforceDen only |

### 5.6 Requires product decision

| Path | Why |
| --- | --- |
| Keep WD presentation layer vs fully agency-branded dashboard | Alignment in this task reframes Digital Den presentation without deleting WD docs |
| Dispute contractor/settlement UX shells | Retain shadow-only; no money movement |
| Route key `earnings` vs label rename | Keep route key for compatibility; reframe label/copy |

## 6. Retained agency capabilities (must not regress)

- Project enquiries / intake
- Client workspace access
- Manager and Team Member secure access
- Role-scoped sessions and project-scoped access control
- Manager team administration and internal assignment
- Project messages + manager-controlled team messaging permission
- Secure project files (quarantine, review, expiring downloads)
- Delivery / revision / dispute foundations
- Completion and payment holds (non-executing)
- Shadow settlement
- Audit events and email notifications
- Mobile / accessibility improvements already present

## 7. Alignment actions taken after this audit

Documented separately in implementation commits:

1. Product boundary document (`DIGITAL_DEN_AGENCY_OPERATING_MODEL_V1.md`)
2. Additive project-source model and visibility helpers
3. Server-side redaction of internal compensation / assignee identifiers / internal notes from client responses
4. Explicit disabled marketplace capability flags
5. Frontend terminology reframe away from marketplace presentation
6. Focused agency-boundary tests

## 8. Stop conditions observed

| Condition | Status |
| --- | --- |
| Incompatible production API contract break | Avoided — additive fields and response redaction only |
| Destructive stored-record migration | Not performed; compatibility mapping from `source` retained |
| WorkforceDen functionality changes | None |
| Real payment activation | None |
| Existing PR modification / merge | None |
| Production deploy / env changes | None |
