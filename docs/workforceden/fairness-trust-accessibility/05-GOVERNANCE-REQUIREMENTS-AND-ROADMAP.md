# 13. Governance, Audit and Metrics

## 13.1 Governance roles

| **Function**        | **Accountability**                                                      |
|---------------------|-------------------------------------------------------------------------|
| Product owner       | Approves marketplace rules and prioritises user harm reduction.         |
| Trust & Safety      | Moderation, verification, account actions and high-risk review.         |
| Dispute manager     | Triage, evidence collection, hold decisions and remedies.               |
| Accessibility owner | WCAG conformance, assistive-technology testing and adjustment requests. |
| Engineering         | Policy enforcement, auditability, resilience and data isolation.        |
| Privacy/legal       | Terms, privacy, retention, lawful basis and regulatory review.          |
| Tax/reporting owner | Determines digital-platform operator duties, seller due diligence and HMRC reporting controls. |
| Service-category owner | Defines category-specific licences, insurance, DBS eligibility and local-service safeguards. |

## 13.2 Mandatory metrics

- Percentage of account actions reversed on appeal.
- Median time to human review for identity, funds and suspension cases.
- Funds held beyond the published timeframe.
- Dispute requests converted to formal cases.
- Average hold duration by hold type.
- Rate of fake/abusive jobs removed before professional exposure.
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

# 14. Product Requirements and Acceptance Criteria

| **ID** | **Requirement**               | **Acceptance criterion**                                                                                                 | **Priority** |
|--------|-------------------------------|--------------------------------------------------------------------------------------------------------------------------|--------------|
| FR-01  | Permanent accounts            | Client, Professional and Manager can sign in/out independently; manager intervention is not required for routine access. | MUST         |
| FR-02  | Verified professional profile | Public profile is published only after required checks; private verification data is never publicly exposed.             | MUST         |
| FR-03  | Capacity-led discovery        | Search shows only approved providers/teams with relevant services and declared availability.                             | MUST         |
| FR-04  | Versioned Offer               | Scope, fee, delivery and revision terms are versioned and accepted before project creation.                              | MUST         |
| FR-05  | Role-scoped workspace         | Client, Professional and Manager see only authorised project, financial and audit information.                           | MUST         |
| FR-06  | Dispute request split         | Submitting a request creates no automatic payment/completion/timeout hold.                                               | MUST         |
| FR-07  | Human case opening            | Only an authorised manager can open a formal dispute case and apply holds.                                               | MUST         |
| FR-08  | Explainable account action    | Material restrictions provide a reason category, impact and appeal route.                                                | MUST         |
| FR-09  | Financial transparency        | Relevant gross, fee, net, paid, pending and held states are visible before and during a contract.                        | MUST         |
| FR-10  | Accessible zoom               | Core flows work at 400% browser zoom with reflow and no loss of function.                                                | MUST         |
| FR-11  | Screen-reader compatibility   | Core flows work with NVDA, VoiceOver and TalkBack using semantic controls and announcements.                             | MUST         |
| FR-12  | Built-in Read Aloud           | User-controlled reading support is available for long text without exposing sensitive fields.                           | SHOULD       |
| FR-13  | Data export                   | Users can obtain contracts, statements and lawful project records.                                                       | SHOULD       |
| FR-14  | Review challenge              | Users can challenge reviews that are abusive, retaliatory or demonstrably false.                                         | SHOULD       |
| FR-15  | Low-friction account creation | Basic Client and Professional accounts require only the information necessary for identity-independent account access.   | MUST         |
| FR-16  | Progressive verification      | Enhanced checks occur only before the capability, payment, service or risk that requires them is enabled.                | MUST         |
| FR-17  | Data minimisation             | Every sensitive onboarding field has a documented purpose, access rule and retention period; speculative collection is prohibited. | MUST |
| FR-18  | Verification correction       | Incomplete or failed checks support correction, resubmission and human review before permanent adverse action.           | MUST         |
| FR-19  | Self-employment boundary      | Employer-style Right to Work checks are not automatically imposed on all marketplace Professionals; the real legal relationship is assessed. | MUST |
| FR-20  | Seller reporting readiness    | Reportable seller information is collected and verified before the relevant payment/reporting duty arises, not from ordinary Clients. | MUST |
| FR-21  | Category-specific safeguards  | DBS, licence, registration and insurance requirements are applied only to eligible or relevant service categories.       | MUST         |
| FR-22  | Accessible verification       | Identity and eligibility journeys have keyboard, screen-reader, zoom/reflow and reasonable-adjustment alternatives.      | MUST         |
| FR-23  | Public/private profile split  | Public profiles contain approved marketplace information only; identity, tax, address, payout and safeguarding evidence remains restricted. | MUST |
| FR-24  | Capability-level restriction  | A failed or pending check restricts only the capability that requires it unless a broader evidenced risk justifies more. | MUST |

# 15. Phased Implementation Roadmap

| **Phase** | **Delivery**                                | **Purpose**                                                                           |
|-----------|---------------------------------------------|---------------------------------------------------------------------------------------|
| Phase 1   | Dispute Request / Formal Case separation    | Remove the most serious current fairness defect before expanding the platform.        |
| Phase 2   | Account, credentials and revocable sessions | Permanent self-service access for Client, Professional and Manager with low-friction account creation. |
| Phase 3   | Client and Professional profiles            | Progressive private verification, public profiles, seller-reporting readiness, service eligibility and skills workflows. |
| Phase 4   | Project ownership and assignments           | Replace email ownership and session-scoped project arrays with current relationships. |
| Phase 5   | Search and capacity discovery               | Profiles, teams, services, availability and explainable ranking.                      |
| Phase 6   | Pre-project conversations and Offers        | Secure negotiation, versioned terms and acceptance.                                   |
| Phase 7   | Offer-to-project conversion                 | Reuse the existing role-scoped Project Workspace.                                     |
| Phase 8   | Financial ledger and payout onboarding      | Currency-aware, auditable billing, seller reporting and earnings states.              |
| Phase 9   | Accessibility hardening and PWA             | Assistive-technology testing, Read Aloud enhancement and installable web app.         |
| Phase 10  | Tenant-ready SaaS productisation            | Organisation isolation, branding and configurable workflows for Digital Den clients.  |

# Appendix A. Role-Based Rights

| **Capability**                  | **Client**        | **Professional**           | **Manager**          |
|---------------------------------|-------------------|----------------------------|----------------------|
| Create basic account            | Yes               | Yes                        | Controlled           |
| Search profiles/teams           | Yes               | Yes                        | Yes                  |
| Publish verified profile        | Not applicable    | After required checks      | Approve/restrict     |
| Receive marketplace payout      | No                | After payout/tax checks    | Oversight only       |
| Create/accept Offer             | Client acceptance | Professional/team proposal | Oversight only       |
| View project financials         | Own billing only  | Own earnings only          | Full authorised view |
| Submit dispute request          | Yes               | Yes                        | May open/manage formal cases under policy; should not self-review a personal request |
| Open formal dispute case        | No                | No                         | Yes                  |
| Apply/release holds             | No                | No                         | Yes                  |
| View internal moderation reason | No                | No                         | Yes                  |
| View project audit              | No                | No                         | Yes                  |
| Manage assignments              | No                | No                         | Yes                  |
| Export own records              | Yes               | Yes                        | Yes                  |
| Request correction/adjustment   | Yes               | Yes                        | Administer           |

# Appendix B. Accessibility Test Matrix

| **Test area**       | **Minimum test**                     | **Pass condition**                                                          |
|---------------------|--------------------------------------|-----------------------------------------------------------------------------|
| Zoom                | Chrome/Edge/Firefox at 200% and 400% | No loss of information/function; reflow at 320 CSS px equivalent.           |
| Text resize         | 200% text size                       | No overlap, clipping or hidden action.                                      |
| Keyboard            | Full core journey without mouse      | Logical order, visible focus, no trap.                                      |
| NVDA                | Windows + Chrome/Firefox             | Landmarks, headings, labels, errors and dynamic states announced correctly. |
| VoiceOver           | macOS/iOS + Safari                   | Controls, navigation and forms usable.                                      |
| TalkBack            | Android + Chrome                     | Mobile actions and forms usable.                                            |
| Contrast            | Automated and manual checks          | WCAG AA minimum; states not colour-only.                                    |
| Reduced motion      | OS reduced-motion preference         | Non-essential movement disabled.                                            |
| Read Aloud          | Long brief/offer/messages            | User-controlled, no sensitive-field speech, correct language.               |
| Cognitive usability | Task-based user testing              | Plain language, recoverable errors, saved progress.                         |
| Verification alternative | Document/identity journey with assistive technology or adjustment | No user is blocked solely because the default capture or automated check is inaccessible. |
| Error recovery      | Failed/incomplete onboarding step    | Clear reason, preserved progress, correction path and human-review route.    |

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

# Approval Note

This framework should be approved before implementation of marketplace search, ranking, reviews, financial execution, automated account enforcement or enhanced verification. Deviations must be documented, risk-assessed and approved by the Product Owner and the relevant Trust, Accessibility, Security, Tax/Reporting or Legal owner.

Before Account & Identity Architecture V1 is activated in production, Quiz & Rise Ltd must complete a UK legal and operational review covering employment-status boundaries, digital-platform seller reporting, privacy/lawful basis, safeguarding, category-specific licensing and accessible verification.
