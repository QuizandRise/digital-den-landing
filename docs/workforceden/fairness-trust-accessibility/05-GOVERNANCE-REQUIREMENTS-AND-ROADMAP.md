# 13. Governance, Audit and Metrics

## 13.1 Governance roles

| **Function** | **Accountability** |
|---|---|
| Product owner | Approves marketplace rules, prioritises user-harm reduction and authorises proportionate exceptions. |
| Trust & Safety | Moderation, verification, account actions and high-risk review. |
| Dispute manager | Triage, evidence collection, hold decisions and remedies. |
| Accessibility owner | WCAG conformance, assistive-technology testing and adjustment requests. |
| Engineering | Policy enforcement, auditability, resilience, role scoping and data isolation. |
| Privacy/legal | Terms, privacy, retention, lawful basis and regulatory review. |
| Tax/reporting owner | Determines digital-platform operator duties, seller due diligence and HMRC reporting controls. |
| Service-category owner | Defines category-specific licences, insurance, DBS eligibility and local-service safeguards. |

## 13.2 Mandatory metrics

- Percentage of account actions reversed on appeal.
- Median time to human review for identity, funds and suspension cases.
- Funds held beyond the published timeframe.
- Dispute requests converted to formal cases.
- Average hold duration by hold type.
- Rate of fake or abusive jobs removed before professional exposure.
- Proposal-to-conversation and conversation-to-offer conversion.
- Unpaid out-of-scope work reports.
- Accessibility defects by severity and resolution time.
- Screen-reader and 400% zoom test pass rate for core journeys.
- Percentage of users asked for enhanced verification by role, capability and reason category.
- Verification failure, correction, resubmission and reversal rates.
- Time from verification submission to human decision.
- Data fields collected by onboarding stage and documented purpose.
- Number of users routed through reasonable-adjustment or alternative verification paths.
- Percentage of seller records complete before reportable payment capability is enabled.

Metrics must be reviewed in proportion to platform scale. WorkforceDen is not required to create complex reporting processes before there is sufficient activity to make a metric meaningful, but the system must retain the audit data needed to calculate material fairness, accessibility, verification and financial metrics when operations expand.

## 13.3 Onboarding governance gate

No new identity, immigration, tax, criminal-record, location, biometric, licensing or insurance field may be added to a production form unless the change records:

1. the user role and capability to which it applies;
2. the legal, operational, safeguarding, fraud or insurance purpose;
3. the lawful basis and privacy notice impact;
4. whether collection is mandatory or optional;
5. who may access it;
6. its retention and deletion rule;
7. its verification and correction process;
8. the accessible alternative or reasonable-adjustment route; and
9. the Product, Privacy/Legal and Security owner approval.

A field must not be collected at account creation merely because it may be needed at a later marketplace stage.

## 13.4 Change governance

A documented impact review is required before a production change that materially affects:

- money, payout, refund, settlement or holds;
- identity, immigration, tax, DBS, licensing or insurance data;
- account suspension, permanent restriction or recovery;
- ranking, reviews or marketplace visibility;
- accessibility of a core journey;
- dispute handling, evidence or remedies;
- private-address access or safeguarding;
- tenant, role, project or financial isolation.

The review may be concise. It must identify the affected QR-WD-001 requirements, material risks, least restrictive control, required approvals and user remedy. Routine low-risk UI or content changes do not require a formal legal or governance record unless they alter actual rights, obligations or system behaviour.

## 13.5 Minimum audit events

The system must record, where relevant:

- actor, role and timestamp;
- affected account, capability, project, payment or case;
- previous and new state;
- reason category and policy basis;
- evidence reference without unnecessary duplication of sensitive content;
- reviewer and next review date where applicable;
- correction, appeal or release outcome.

Audit records must be role-restricted and protected from ordinary user modification. Immutability may be implemented through append-only events or an equivalent tamper-evident design proportionate to the platform’s scale and risk.

# 14. Product Requirements and Acceptance Criteria

| **ID** | **Requirement** | **Acceptance criterion** | **Priority** |
|---|---|---|---|
| FR-01 | Permanent accounts | Client, Professional and Manager can sign in and out independently; manager intervention is not required for routine access. | MUST |
| FR-02 | Verified professional profile | Public profile is published only after required checks; private verification data is never publicly exposed. | MUST |
| FR-03 | Capacity-led discovery | Search shows only approved providers or teams with relevant services and declared availability. | MUST |
| FR-04 | Versioned Offer | Scope, fee, delivery and revision terms are versioned and accepted before project creation. | MUST |
| FR-05 | Role-scoped workspace | Client, Professional and Manager see only authorised project, financial and audit information. | MUST |
| FR-06 | Dispute request split | Submitting a request creates no automatic payment, completion or timeout hold. | MUST |
| FR-07 | Human case opening | Only an authorised manager can open a formal dispute case and apply holds. | MUST |
| FR-08 | Explainable account action | Material restrictions provide a reason category, impact and appeal route. | MUST |
| FR-09 | Financial transparency | Relevant gross, fee, net, paid, pending and held states are visible before and during a contract. | MUST |
| FR-10 | Accessible zoom | Core flows work at 400% browser zoom with reflow and no loss of function. | MUST |
| FR-11 | Screen-reader compatibility | Core flows work with NVDA, VoiceOver and TalkBack using semantic controls and announcements. | MUST |
| FR-12 | Built-in Read Aloud | User-controlled reading support is available for long text without exposing sensitive fields. | SHOULD |
| FR-13 | Data export | Users can obtain contracts, statements and lawful project records. | SHOULD |
| FR-14 | Review challenge | Users can challenge reviews that are abusive, retaliatory or demonstrably false. | SHOULD |
| FR-15 | Low-friction account creation | Basic Client and Professional accounts require only the information necessary for identity-independent account access. | MUST |
| FR-16 | Progressive verification | Enhanced checks occur only before the capability, payment, service or risk that requires them is enabled. | MUST |
| FR-17 | Data minimisation | Every sensitive onboarding field has a documented purpose, access rule and retention period; speculative collection is prohibited. | MUST |
| FR-18 | Verification correction | Incomplete or failed checks support correction, resubmission and human review before permanent adverse action. | MUST |
| FR-19 | Self-employment boundary | Employer-style Right to Work checks are not automatically imposed on all marketplace Professionals; the real legal relationship is assessed. | MUST |
| FR-20 | Seller reporting readiness | Reportable seller information is collected and verified before the relevant payment or reporting duty arises, not from ordinary Clients. | MUST |
| FR-21 | Category-specific safeguards | DBS, licence, registration and insurance requirements are applied only to eligible or relevant service categories. | MUST |
| FR-22 | Accessible verification | Identity and eligibility journeys have keyboard, screen-reader, zoom or reflow and reasonable-adjustment alternatives. | MUST |
| FR-23 | Public/private profile split | Public profiles contain approved marketplace information only; identity, tax, address, payout and safeguarding evidence remains restricted. | MUST |
| FR-24 | Capability-level restriction | A failed or pending check restricts only the capability that requires it unless a broader evidenced risk justifies more. | MUST |
| FR-25 | Service standards | High-impact reviews, disputes, holds and accessibility blockers have published target times, escalation and status visibility. | MUST |
| FR-26 | Authority control | High-impact actions are available only to authorised roles and are recorded in an audit trail. | MUST |
| FR-27 | Payment model approval | Production payment, payout, refund and hold flows are activated only after the operating model, provider responsibilities and UK legal boundaries are documented. | MUST |
| FR-28 | Tenant and object isolation | Role, project, financial and organisation access is enforced in backend queries and data relationships, not only hidden in the interface. | MUST |

# 15. Phased Implementation Roadmap

| **Phase** | **Delivery** | **Purpose** |
|---|---|---|
| Phase 1 | Dispute Request and Formal Case separation | Remove the most serious current fairness defect before expanding the platform. |
| Phase 2 | Account, credentials and revocable sessions | Permanent self-service access for Client, Professional and Manager with low-friction account creation. |
| Phase 3 | Client and Professional profiles | Progressive private verification, public profiles, seller-reporting readiness, service eligibility and skills workflows. |
| Phase 4 | Project ownership and assignments | Replace email ownership and session-scoped project arrays with current relationships and backend-enforced object access. |
| Phase 5 | Search and capacity discovery | Profiles, teams, services, availability and explainable ranking. |
| Phase 6 | Pre-project conversations and Offers | Secure negotiation, versioned terms and acceptance. |
| Phase 7 | Offer-to-project conversion | Reuse the existing role-scoped Project Workspace. |
| Phase 8 | Financial ledger and payout onboarding | Currency-aware, auditable billing, seller reporting and earnings states after payment-model approval. |
| Phase 9 | Accessibility hardening and PWA | Assistive-technology testing, Read Aloud enhancement and installable web app. |
| Phase 10 | Tenant-ready SaaS productisation | Organisation branding and configurable workflows, building on tenant and object-isolation controls already required in earlier phases. |

# Appendix A. Role-Based Rights

| **Capability** | **Client** | **Professional** | **Manager** |
|---|---|---|---|
| Create basic account | Yes | Yes | Controlled |
| Search profiles or teams | Yes | Yes | Yes |
| Publish verified profile | Not applicable | After required checks | Approve or restrict |
| Receive marketplace payout | No | After payout and tax checks | Oversight only |
| Create or accept Offer | Client acceptance | Professional or team proposal | Oversight only |
| View project financials | Own billing only | Own earnings only | Full authorised view |
| Submit dispute request | Yes | Yes | Yes, but must not self-review a personal request |
| Open formal dispute case | No | No | Yes, authorised role only |
| Apply or release holds | No | No | Yes, authorised role only |
| View internal moderation reason | No | No | Yes, within assigned scope |
| View project audit | No | No | Yes, within assigned scope |
| Manage assignments | No | No | Yes |
| Export own records | Yes | Yes | Yes |
| Request correction or adjustment | Yes | Yes | Administer |

# Appendix B. Accessibility Test Matrix

| **Test area** | **Minimum test** | **Pass condition** |
|---|---|---|
| Zoom | Chrome, Edge and Firefox at 200% and 400% | No loss of information or function; reflow at 320 CSS px equivalent. |
| Text resize | 200% text size | No overlap, clipping or hidden action. |
| Keyboard | Full core journey without mouse | Logical order, visible focus, no trap. |
| NVDA | Windows with Chrome and Firefox | Landmarks, headings, labels, errors and dynamic states announced correctly. |
| VoiceOver | macOS or iOS with Safari | Controls, navigation and forms usable. |
| TalkBack | Android with Chrome | Mobile actions and forms usable. |
| Contrast | Automated and manual checks | WCAG AA minimum; states not colour-only. |
| Reduced motion | OS reduced-motion preference | Non-essential movement disabled. |
| Read Aloud | Long brief, Offer or messages | User-controlled, no sensitive-field speech, correct language. |
| Cognitive usability | Task-based user testing | Plain language, recoverable errors, saved progress. |
| Verification alternative | Document or identity journey with assistive technology or adjustment | No user is blocked solely because the default capture or automated check is inaccessible. |
| Error recovery | Failed or incomplete onboarding step | Clear reason, preserved progress, correction path and human-review route. |

# Appendix C. References

**[1] The complete guide to your Fiverr order: Statuses and process.** Fiverr Help Center. Accessed 4 August 2026.

**[2] How cancellations work for clients.** Fiverr Help Center. Accessed 4 August 2026.

**[3] Managing your orders: A freelancer’s guide to the Fiverr order process.** Fiverr Help Center. Accessed 4 August 2026.

**[4] How to sign up as a freelancer on Upwork.** Upwork Help. Accessed 4 August 2026.

**[5] Learn about the Freelancer Service Fee.** Upwork Help. Accessed 4 August 2026.

**[6] What is arbitration on Upwork?** Upwork Help. Accessed 4 August 2026.

**[7] What happens if you file a chargeback as a client on Upwork.** Upwork Help. Accessed 4 August 2026.

**[8] Upwork complaints summary.** Better Business Bureau, review conducted July 2026. Accessed 4 August 2026.

**[9] Fiverr customer review summary and complaint patterns.** Trustpilot, accessed August 2026. Accessed 4 August 2026.

**[10] Disability: quick start guide for service providers.** GOV.UK. Accessed 4 August 2026.

**[11] Equality Act 2010 draft Code of Practice for services, public functions and associations, 2026.** GOV.UK. Accessed 4 August 2026.

**[12] Web Content Accessibility Guidelines (WCAG) 2.2.** World Wide Web Consortium (W3C). Accessed 4 August 2026.

**[13] Meet the requirements of equality and accessibility regulations.** GOV.UK. Accessed 4 August 2026.

**[14] Check if you need to register as a digital platform operator.** HM Revenue & Customs, GOV.UK. Updated 21 July 2026; accessed 4 August 2026.

**[15] Collect and verify digital platform seller information.** HM Revenue & Customs, GOV.UK. Updated 10 February 2026; accessed 4 August 2026.

**[16] Selling goods or services on a digital platform.** HM Revenue & Customs, GOV.UK. Updated 22 September 2025; accessed 4 August 2026.

**[17] Right to work checks: an employer’s guide.** UK Visas and Immigration and Immigration Enforcement, GOV.UK. Current guidance and July 2026 draft update reviewed 4 August 2026.

**[18] DBS checks for self-employed people and personal employees.** Disclosure and Barring Service, GOV.UK. Updated 23 January 2026; accessed 4 August 2026.

**[19] Principle (c): Data minimisation.** Information Commissioner’s Office. Accessed 4 August 2026.

# Appendix D. Service Standards and Authority Matrix

## D.1 Initial operating targets

These are internal service targets, not guarantees of outcome. They may be revised as WorkforceDen gains operational evidence, provided users are informed where a published service level changes.

| **Matter** | **Initial target** | **Escalation rule** |
|---|---|---|
| Verification submission acknowledgement | Immediate system confirmation | Support route shown if confirmation fails. |
| Routine verification review | Within 5 working days | Escalate to authorised reviewer if overdue. |
| High-impact verification or account appeal acknowledgement | Within 2 working days | Assign case reference and reviewer. |
| High-impact appeal decision | Normally within 10 working days after sufficient evidence is received | Explain delay and provide next review date. |
| Dispute Request triage | Within 3 working days | Escalate if money, safety or delivery deadline creates urgency. |
| Formal hold review | At least every 5 working days, or sooner where the justification may have ended | Release immediately when justification ends. |
| Accessibility blocker affecting a core journey | Acknowledge within 2 working days and provide a practical workaround or adjustment plan as soon as reasonably possible | Immediate escalation where account, money, dispute or safety access is blocked. |
| Undisputed settlement exception | Review within 3 working days | User receives reason and expected resolution date. |

## D.2 Authority matrix

| **Decision** | **Responsible** | **Accountable** | **Required consultation** |
|---|---|---|---|
| Publish or restrict verified profile | Trust & Safety or authorised service reviewer | Product owner | Service-category owner where category-specific evidence applies. |
| Open Formal Dispute Case | Dispute manager | Product owner or delegated operations lead | Finance where money is affected. |
| Apply or release payment hold | Dispute manager or authorised finance role | Product owner or delegated finance lead | Privacy or legal for exceptional legal restrictions. |
| Permanent account restriction | Trust & Safety | Product owner | Legal or privacy where identity, discrimination, legal process or significant funds are involved. |
| Approve new sensitive onboarding field | Product owner | Product owner | Privacy or legal, Security and Accessibility. |
| Activate new regulated or safeguarding-sensitive category | Service-category owner | Product owner | Legal or privacy, Trust & Safety and Accessibility. |
| Activate production payment model | Finance or payment owner | Product owner | Legal or privacy, Tax/reporting and Engineering. |

One person may hold more than one role during early-stage operations, but high-impact decisions must still identify the capacity in which the person acted. Wherever reasonably practicable, the person deciding an appeal should not be the sole original decision-maker.

# Appendix E. Data Governance Minimums

| **Data category** | **Purpose limitation** | **Access** | **Retention principle** | **User remedy** |
|---|---|---|---|---|
| Basic account data | Account access, security and communication | User and authorised support | Retain while account is active and as required for security or legal records | Access, correction and closure route. |
| Identity evidence | Identity or fraud control for a defined capability | Restricted verification roles and approved processor | Keep no longer than necessary for verification, audit, legal or fraud purpose | Correction, resubmission, alternative route and human review. |
| Immigration or work-eligibility evidence | Only where the real legal relationship, contract or service requires it | Strictly restricted authorised roles | Category- and duty-specific retention, documented before collection | Reason, correction and review route. |
| DBS or safeguarding evidence | Eligible safeguarding purpose only | Restricted safeguarding or verification roles | Retain status and necessary audit data; avoid retaining full certificates without documented need | Correction and human review. |
| Tax or seller-reporting data | Actual digital-platform reporting or tax duty | Tax/reporting and authorised finance roles | Retain according to applicable reporting and record-keeping rules | Correction and seller-copy route. |
| Bank and payout data | Payout and settlement | Payment provider and strictly authorised finance roles | Prefer provider tokenisation; avoid unnecessary local storage | Update and payout-support route. |
| Private address | Fulfilment, local service or legally required contact | Assigned authorised parties only when needed | Remove or restrict access when the assignment or legal purpose ends | Correction and access-log inquiry route. |
| Dispute evidence | Assess defined dispute and remedies | Parties as appropriate and authorised case reviewers | Retain according to published dispute, legal-hold and deletion rules | Submit evidence, respond and appeal where available. |

Before production collection of any sensitive category, the product record must state the lawful basis, privacy notice wording, processor or subprocessor, encryption and access design, retention period, deletion handling, export handling and accessible alternative.

# Approval Note

This framework should be approved before implementation of marketplace search, ranking, reviews, financial execution, automated account enforcement or enhanced verification. Deviations must be documented, risk-assessed and approved by the Product Owner and the relevant Trust, Accessibility, Security, Tax/Reporting or Legal owner.

Before Account & Identity Architecture V1 or production financial execution is activated, Quiz & Rise Ltd must complete a proportionate UK legal and operational review covering employment-status boundaries, digital-platform seller reporting, privacy and lawful basis, safeguarding, category-specific licensing, payment responsibilities and accessible verification.

This framework does not replace legal advice. It requires legal review only where the real feature, operating model or risk justifies it and should not be interpreted as requiring unnecessary checks or bureaucracy for low-risk platform activity.
