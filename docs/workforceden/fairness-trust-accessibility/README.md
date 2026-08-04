# WorkforceDen Marketplace Fairness, Trust & Accessibility Framework

> **Canonical governance document**  
> This file is the authoritative product reference for WorkforceDen marketplace fairness, trust, accessibility, moderation, disputes, account actions, onboarding, verification, financial transparency and proportionate UK governance. Product, engineering, operations and legal decisions must be checked against it.

A product and governance framework for a verified, transparent and
human-reviewed professional-services marketplace

| **Document field** | **Approved value** |
|---|---|
| Document code | QR-WD-001 |
| Version | 1.2 |
| Status | Strategic foundation for product, engineering, operations and legal review |
| Classification | Internal Strategic Framework |
| Owner | Quiz & Rise Ltd |
| Product | WorkforceDen |
| Service network | Digital Den |
| Prepared for | Product, engineering, operations, accessibility and legal teams |
| Date | 4 August 2026 |
| Last updated | 4 August 2026 — balanced UK governance, service standards and data controls |

*What you seek is seeking you.*

# Document Purpose

This framework translates evidence from official platform rules, public complaint patterns, UK regulatory guidance and accessibility standards into mandatory design principles for WorkforceDen. It is intended to prevent the platform from reproducing persistent trust failures reported by users of large freelance marketplaces while retaining the useful mechanics of search, negotiation, formal offers, project workspaces, delivery and protected payment flows.

> **Core product position**  
> WorkforceDen will compete on explainability, verified capacity, fair process, accessible interaction, proportionate onboarding and human review—not on the volume of profiles, proposals or automated enforcement.

This framework applies a balanced approach. It does not require controls that are unnecessary for the actual service, user role or risk. It also does not permit the platform to defer safeguards that are reasonably necessary for money, identity, accessibility, safety, privacy, disputes or lawful marketplace operation in the United Kingdom.

## How to Use This Framework

- **Product decisions:** Every feature must be assessed against the fairness, trust, onboarding and accessibility principles in Sections 4–14.
- **Engineering:** Requirements marked MUST are release-blocking unless an approved exception is documented.
- **Operations:** Moderation, disputes, verification, suspensions and financial holds must follow auditable service-level procedures.
- **Legal and privacy:** Policies and user-facing terms must accurately reflect actual system behaviour. UK employment-status, digital-platform reporting, safeguarding, consumer, equality and data-protection duties must be reviewed before relevant capabilities are activated.
- **Accessibility:** System screen-reader compatibility is mandatory; a built-in Read Aloud option is recommended but does not replace semantic accessibility.
- **Onboarding:** Account creation must remain low-friction. Enhanced identity, tax, immigration, DBS, licensing, insurance or payout checks are permitted only at the stage where the relevant legal duty, capability or documented risk requires them.
- **Proportionality:** Controls must be no broader than reasonably necessary for the purpose they serve.

# Contents

0. Definitions and Interpretation Rules

1. Executive Summary

2. Evidence Base and Research Limitations

3. Marketplace Failure Patterns

4. WorkforceDen Fairness Principles

5. Verified Marketplace Model and Proportionate Onboarding

6. Search, Ranking and Discovery

7. Conversation, Offer and Contract Integrity

8. Reviews, Reputation and Appeals

9. Disputes, Holds and Human Review

10. Financial Fairness and Account Actions

11. Accessibility and Inclusive Design

12. Support, Safety and Data Portability

13. Governance, Audit and Metrics

14. Product Requirements and Acceptance Criteria

15. Phased Implementation Roadmap

- Appendix A. Role-Based Rights
- Appendix B. Accessibility Test Matrix
- Appendix C. References
- Appendix D. Service Standards and Authority Matrix
- Appendix E. Data Governance Minimums

# 0. Definitions and Interpretation Rules

## 0.1 Defined terms

| **Term** | **Meaning for this framework** |
|---|---|
| Account action | A restriction, suspension, closure, recovery intervention or capability change affecting a user account. |
| Authorised Manager | A person assigned the relevant role and permission to make the specific operational decision, with actions recorded in the audit trail. |
| Capability | A discrete platform permission such as publishing a profile, receiving payment, accessing a private address, accepting regulated work or opening a formal dispute case. |
| Formal Dispute Case | A manager-opened case following triage, with defined scope, evidence, affected sums or project states, review date and possible remedies. |
| High-impact decision | A decision materially affecting livelihood, money, identity status, access to purchased work, permanent access, safeguarding or legal rights. |
| Hold | A temporary, separately justified restriction on a defined payment, completion event, timeout or file-access state. |
| Human review | Review by an appropriately authorised person able to consider evidence, context, corrections, reasonable adjustments and available remedies. |
| Material restriction | A restriction that significantly limits earning, purchasing, project, financial, account, profile or data-access capability. |
| Professional | A person or approved team offering services through WorkforceDen, regardless of the final legal classification of the relationship. |
| Sensitive field | Personal data whose misuse, disclosure or inaccurate processing could create material privacy, discrimination, financial, immigration, safeguarding or security harm. |
| Verified capability | A capability enabled after the checks proportionate to that service, role, jurisdiction and risk have been completed. |

## 0.2 Interpretation rules

- `MUST` means release-blocking unless a written, approved and time-limited exception exists.
- `SHOULD` means expected unless a documented product or operational reason justifies a different approach.
- A control must be interpreted narrowly enough to avoid unnecessary burden but broadly enough to address the identified risk.
- A report, automated signal or failed machine check is evidence requiring assessment; it is not conclusive proof.
- Legal duties must be assessed against the real operating model and current law, not assumed solely from labels in Terms or interface copy.
- Where UK-wide law applies, WorkforceDen must also account for Scotland-specific service, licensing, safeguarding or procedural requirements where relevant to the category being offered.

## Repository Structure

- [Part 1 — Executive Summary, Evidence and Marketplace Failure Patterns](01-RESEARCH-AND-FAILURE-PATTERNS.md)
- [Part 2 — Fairness Principles, Verified Marketplace, Proportionate Onboarding and Search](02-FAIRNESS-MARKETPLACE-AND-SEARCH.md)
- [Part 3 — Conversations, Offers, Reviews and Disputes](03-CONTRACTS-REVIEWS-AND-DISPUTES.md)
- [Part 4 — Financial Fairness, Accessibility and Support](04-FINANCE-ACCESSIBILITY-AND-SUPPORT.md)
- [Part 5 — Governance, Requirements, Roadmap and Appendices](05-GOVERNANCE-REQUIREMENTS-AND-ROADMAP.md)

## Engineering Rule

Every WorkforceDen feature PR must identify which requirements in this framework it implements, preserves or intentionally defers. Any deviation affecting fairness, accessibility, onboarding, identity verification, account enforcement, disputes, ranking or money requires written risk acceptance.

No developer may add a sensitive onboarding field without documenting its purpose, capability gate, lawful basis, access control, retention rule, correction route and accessible alternative.

Every relevant PR must also answer these questions:

1. Does the change affect money, identity, verification, privacy, accessibility, ranking, disputes, account action or private-location access?
2. Which QR-WD-001 requirements are implemented, preserved, deferred or changed?
3. What is the least restrictive control that adequately manages the risk?
4. Is a legal, privacy, accessibility, security or operational review required before release?
5. Are audit events, user-facing reasons and correction or appeal routes included?

## Proportionate Governance Rule

WorkforceDen must not create enterprise-level bureaucracy for low-risk routine activity. Formal review is required only where the change materially affects regulated duties, money, identity, safeguarding, accessibility, legal status, private data, marketplace fairness or irreversible access.

The Product Owner may approve simplified controls for low-risk features, provided the decision does not override a MUST requirement, conceal a material risk or remove a user remedy.
