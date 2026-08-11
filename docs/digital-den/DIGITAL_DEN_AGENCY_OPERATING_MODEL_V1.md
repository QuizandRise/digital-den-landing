# Digital Den Agency Operating Model V1

| Field | Value |
| --- | --- |
| Product | Digital Den |
| Operator | Quiz & Rise Ltd (Scotland, United Kingdom) |
| Document type | Product and engineering governance |
| Status | Authoritative operating boundary |
| Not | Legal advice |

## 1. What Digital Den is

Digital Den is the digital-services agency operated by Quiz & Rise Ltd.

It is an **internal operational system** for:

- receiving client work;
- defining and approving scope;
- quoting and agreeing commercial terms with the client;
- assigning delivery resources internally;
- managing delivery, revisions, files, communication, QA and disputes;
- recording internal compensation and shadow settlement states.

It is **not** a public multi-provider marketplace.

## 2. Client-to-agency relationship

The client-facing service provider is **Digital Den / Quiz & Rise Ltd**.

A customer interacts with:

1. one controlled agency identity; and
2. an authorised Digital Den representative (Manager, or a Team Member explicitly authorised to communicate).

Digital Den remains responsible for:

- scope definition / approval;
- quotation and service agreement;
- client price;
- internal resource assignment;
- quality assurance;
- client communication;
- delivery and revisions;
- complaints, disputes, refunds or remedies where applicable.

Internal workers are **delivery resources**, not public marketplace providers. They do not need separate customer-facing marketplace identities.

## 3. Internal assignment relationship

| Actor | Authority |
| --- | --- |
| Manager | Assigns / reassigns internal resources; sets client price; manages notes, QA, disputes, internal compensation |
| Team Member | Sees only assigned projects and authorised fields; performs assigned work; may message clients only when granted; cannot set client price or view other workers’ compensation |
| Client | Sees own authorised project commercial and delivery information only |

Prohibited:

- clients searching or comparing individual Digital Den workers;
- workers bidding against each other;
- public freelancer profiles;
- direct client-to-worker contracting;
- workers setting independent customer prices;
- exposing internal compensation to clients.

## 4. WorkforceDen relationship

Digital Den may later hold **one Agency Provider account** on WorkforceDen.

A WorkforceDen project awarded to Digital Den enters Digital Den as an **agency project** (`projectSource = workforceden`).

WorkforceDen must not receive or expose Digital Den’s:

- internal assignee compensation;
- internal management notes;
- internal QC / reassignment / performance notes;
- internal settlement calculations.

This document does not change WorkforceDen product behaviour.

## 5. External marketplace relationship

Digital Den may accept work through permitted external marketplaces (`projectSource = external_marketplace`).

The system must preserve originating marketplace restrictions as metadata, including:

- communication restrictions;
- payment restrictions;
- fee and customer-ownership constraints.

Digital Den must not implement mechanisms intended to bypass an external marketplace’s payment, communication, fee, ownership or terms-of-service rules.

## 6. Project source model

Controlled values:

| `projectSource` | Meaning |
| --- | --- |
| `direct` | Client arrived via Digital Den website / direct channel |
| `workforceden` | Awarded to Digital Den as agency provider on WorkforceDen |
| `external_marketplace` | Sourced from a permitted external marketplace |
| `referral` | Referral channel |
| `internal` | Internal Quiz & Rise channel |

Compatibility:

- Existing records with `source: 'digital-den'` map to `projectSource: 'direct'` when unset.
- Do not break existing project records; prefer additive fields.

Optional external metadata (internal by default):

- `sourcePlatform`
- `externalProjectReference`
- `externalProjectUrl`
- `externalGrossAmount`
- `externalPlatformFee`
- `externalNetAmount`
- `externalCurrency`
- `externalDeadline`
- `externalCommunicationRestricted`
- `externalPaymentRestricted`
- `assignedAccountManager`

Private source metadata must not appear in client APIs unless explicitly required for that client’s project.

## 7. Commercial boundary

| Concept | Visibility | Owner |
| --- | --- | --- |
| `clientCommercialAmount` (client price; compatible with `agreedPrice`) | Client + Manager | Manager |
| `internalAssigneeCompensation` (project-level) | Manager only | Manager |

Never expose `internalAssigneeCompensation` (or legacy contractor share fields) through a client response.

### 7.1 Team Member compensation visibility (assignment-level)

Current release policy:

- Manager may view internal project compensation and create assignment-level compensation offers.
- Client must never view internal compensation or assignments.
- Team Member must **not** receive global project-level compensation fields.
- Team Member compensation visibility is provided only through `DigitalDenProjectAssignment` records for their own assignments.
- Accepted assignment compensation is preserved as `originalCompensation`; later Manager adjustments require a reason and audit before/after values.
- `payable` means internally approved and awaiting a future authorised payment rail. Real payment execution remains disabled.

## 8. Payment-system boundary

Digital Den must consume the shared Quiz & Rise **central payment system**.

Digital Den must not create a separate Stripe or marketplace payment engine.

Current engineering gate:

- real payment execution disabled;
- Shadow Settlement preserved;
- no Stripe capture / refund / transfer;
- no contractor compensation release;
- no Stripe Connect activation;
- no payment credential deployment from this task.

## 9. Prohibited marketplace capabilities

Capability flags must remain false for Digital Den:

- public provider directory;
- public provider discovery / search / compare;
- worker bidding;
- public freelancer profiles;
- direct client–worker contracting;
- independent worker pricing;
- client-visible internal compensation;
- marketplace payment engine / Connect payouts;
- role switching as authority.

## 10. Security and audit requirements

Server-side enforcement is mandatory:

- client project isolation;
- Team Member assignment scope;
- Manager-only internal notes;
- Manager-only internal compensation;
- Manager-only assignment / reassignment;
- no client access to internal worker records;
- no Team Member access to unrelated clients;
- no authority derived from a client-provided role value;
- no secrets or personal data in logs;
- no confidential external-marketplace metadata in client APIs;
- immutable audit events for assignment, reassignment and sensitive visibility changes.

## 11. Role model (narrow)

1. `manager`
2. `team_member`
3. `client`

Do not introduce Digital Den roles named `seller`, `freelancer`, `bidder`, `vendor`, or public provider-discovery personas.

## 12. UK / Scotland legal-review gates

This document is **not** legal advice and does not claim compliance.

Before production activation of customer contracting, subcontracting disclosures, or payment remedies, obtain professional UK/Scotland review for:

- customer terms and cancellation rights;
- Consumer Rights Act 2015 implications;
- Consumer Contracts Regulations where applicable;
- subcontracting disclosures;
- employment-status and worker-classification risks;
- VAT and invoice treatment;
- UK GDPR roles, retention and lawful basis;
- complaint, remedy and refund terms;
- intellectual-property ownership and licensing;
- external marketplace contractual restrictions.

## 13. Engineering change policy

Allowed without broad migration:

- terminology reframes;
- additive source / commercial fields;
- server-side visibility rules;
- capability flags;
- tests proving agency boundaries.

Not allowed in ordinary alignment work:

- incompatible API contract breaks;
- destructive renames of stored enums without mapping;
- activating real payments;
- changing WorkforceDen marketplace behaviour;
- bypassing external marketplace rules;
- merging or rewriting unrelated open PRs.
