# Digital Den minimal enquiry — release checklist v1

2026-11-20. **DISABLED — NOT RELEASE AUTHORISATION. Every gate below is pending.**
Frontend `RELEASE_APPROVED = false`; existing server gate false and unchanged.
Scope: agency enquiry → manual email response/delivery. No marketplace or database.
No backend, tracked route, live account, credentials, deployment or paid action
changed by this preparation. Local passing checks cannot clear external gates.

**Evidence update 20 November 2026:** the host/project is independently identified, a route-limited Vercel WAF rule was published and bounded-tested, and Preview-only non-secret settings were installed. Retention and a draft legitimate-interests assessment were recorded. See [dated release evidence](DIGITAL_DEN_RELEASE_EVIDENCE_20261120.md). Two OAuth secrets, end-to-end preview, provider/retention operations and final production sign-off remain pending. The earlier blanket statement that no hosting changes occurred refers only to the original disabled preparation, not this dated update.

Record a dated non-secret evidence reference, reviewer and owner decision for each
gate in a separate approved release review; never store enquiry content or secrets.

| Gate | Required evidence / decision | Status |
| --- | --- | --- |
| Actual host and company ownership | Dashboard verified project quiz-rise1/digital-den-landing-yulk serving digital.quizandrise.com, distinct from the shared digital-den-api; verify every ingress/preview/alias route and deployment hook. Preserve legacy routes and project isolation. | Pending |
| Workspace authority and delivery | Verify independent Digital Den credential provenance, least-privilege gmail.send delegation, real mailbox/inbox ownership and access. Existing strict sender allowlist remains. Prior Admin evidence of dd@quizandrise.com under ceo@quizandrise.com does not prove Gmail send-as: verify exact accepted sender authorisation separately. | Pending |
| Privacy notice and operations | Complete [privacy record](DD_PRIVACY_RELEASE_V1.md): registered office known, privacy alias delivery tested, 12-month-after-last-correspondence enquiry retention approved, monthly manual review documented with CEO as operator, and draft purpose-to-lawful-basis assessment recorded; still verify real operator review, provider terms, logs, transfers, deletion and final published notice. Owner/privacy reviewer approves accurate visible notice before collection. | Pending |
| Cross-instance abuse prevention | Vercel Firewall rule published: exact Request Path /api/minimal-enquiry, five requests/IP per 600s, 429; verify host-enforced admission/rate controls across all reachable send routes, trusted IP overwrite/spoof handling, body/header/time limits and bypass prevention. Define limits, shared-IP impacts, monitor and stop thresholds. Warm-instance counters, CORS and honeypots alone do not clear this gate. | Pending |
| Low-volume risk acceptance | Owner explicitly accepts residual duplicates, uncertain acceptance, loss/no recovery queue and manual mailbox workload; assigns operator/deputy, cadence and capacity. No exactly-once or inbox-delivery guarantee. If hard shared deduplication/global send ceiling is required, remain disabled pending separate design approval; do not add a database here. | Pending |
| Exact artifact and bounded verification | Review exact local artifact and existing mock/security/isolation checks. Separately authorise a bounded integration test proving real provider acceptance and recipient receipt, honest failures, host ingress and abuse enforcement; agree test-mail deletion and costs first. No live testing performed here. | Pending |
| Rollback and incident response | Assign operator, known disabled artifact/configuration, direct-POST block verification, stop triggers and reconciliation of in-flight/uncertain mail. Preserve existing routes/security; disabling only the button is insufficient. | Pending |
| Final owner release approval | Approve exact artifact/destination, completed notice, operations, residual risk and cost exposure. Any later enabling of both gates or new route is a separate reviewed change. | Pending |

## Risk boundaries

A host-level edge rule may be considered only after actual routing, enforcement,
counter scope and existing entitlement/cost exposure are verified. No vendor or plan
is assumed. Per-IP rules can miss botnets and block shared networks; request limits
do not deduplicate mail or guarantee a global cost ceiling. Owner risk acceptance
cannot substitute for required privacy information or essential abuse controls.
If protection, privacy terms or operating capacity are unresolved, remain disabled.

Use the [manual triage procedure](DIGITAL_DEN_MINIMAL_ENQUIRY_INTAKE_V1.md): confirm
possible duplicates by sender/service/time/brief, use one response thread, check sent
mail, avoid auto-deletion and repeated retries. A 502/timeout may still have sent mail;
200 confirms provider acceptance only. Labels do not enforce deletion.

## Local checks, cost and rollback

The intake record documents passing mock-only and standalone frontend checks.
The scope audit found concurrent backend/test edits outside this pass; those were
left untouched. A stable exact-artifact review remains pending. Existing backend security,
mock/adversarial checks, both false gates, tracked files and release controls are
preserved. No Actions, cloud builds, live requests to intake, mail or paid action.
Potential avoidable consumption: duplicate sends and abuse from instance-local state
and ambiguous acceptance. Mitigation: remain disabled, reconcile manually and verify
cross-instance admission before release. No cost figures or savings asserted.
Any purchase, upgrade, paid resource, higher spending limit or materially billable
workflow requires explicit owner approval; none is requested or executed here.

This pass can be reversed by restoring only the four permitted local untracked files
from their prior versions. Do not reset other untracked work. A future live rollback
requires the approved disabled server/frontend artifact, blocking direct submissions
and manual reconciliation; it cannot unsend accepted email.
