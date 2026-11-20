# Digital Den minimal enquiry — local readiness record

Updated 2026-11-20. **DISABLED; not release approval.** Minimal agency enquiry,
followed by human assessment, quoting and manual delivery of agreed work by email.
No marketplace, customer account, enquiry database, queue or automated fulfilment.

This pass changes only the untracked `minimal-enquiry.html`, this document,
[release checklist](DIGITAL_DEN_RELEASE_CHECKLIST_V1.md) and
[privacy release record](DD_PRIVACY_RELEASE_V1.md). This pass does not write backend source, tests, tracked
files or routes. No credentials, account access, real enquiry,
mail, commit/push/merge, deployment, paid service or CI run is authorised here.
Public ICO guidance was consulted for drafting; no live endpoint was tested.

## Release status: disabled

The frontend hardcodes `var RELEASE_APPROVED = false`; its submit button starts
and remains disabled. The existing server `RELEASE_APPROVED = false` is unchanged.
Environment configuration alone cannot clear that gate. Frontend gating is not a
substitute for blocking direct API requests. Only a separate owner-approved release
may change either gate or routing.

The visible privacy notice uses the owner-supplied controller and contact facts;
retention and other unverified processing terms remain pending. The registered office is 6 Sicily Road, Inverness, Scotland, IV2 3YL (Companies House).
An internal email to privacy@quizandrise.com was received on 20 November 2026;
ongoing mailbox monitoring and response ownership still require approval. The notice must be completed,
verified and available at collection before intake can open.

## Remediation and regression coverage

| Finding | Implemented control |
| --- | --- |
| 1. MIME/header injection | Reject controls before trimming input; validate mailboxes and configured display name; independently validate raw MIME headers; encode subject/display name as UTF-8 RFC 2047 words with trusted folding; base64 body. |
| 2. Production mock success | Environment cannot select a mock transport at the entrypoint. Mock configuration is accepted only with an explicitly injected test mailer and absent production/Vercel markers. `createMailer` rejects mock and forceMock. |
| 3. Changed idempotent payload | Same strict 1–128 ASCII letter/digit/underscore/hyphen grammar in header and body; mismatching keys rejected; SHA-256 fingerprint of normalised validated fields; changed payload returns 409. |
| 4. Concurrent duplicate send | Synchronous reservation before asynchronous work; shared promise; retain completed success and uncertain failure for 30 minutes; fail closed at 500 entries instead of eviction. Pending reservations never expire. |
| 5. Rate bypass/eviction | IP only, no user-agent; arbitrary XFF ignored; Vercel-only single parsed `x-vercel-forwarded-for` IP, otherwise socket IP outside Vercel; unknown addresses share a bucket. Five requests/IP/15 minutes, 100 admitted requests/instance/15 minutes, at most 2,000 unexpired buckets; capacity rejects without eviction. |
| 6. Exceptions/timeouts | Strict field types and unknown-field rejection; outer handler/entrypoint catch; generic errors; token exchange and Gmail send each have a 5-second abort deadline including JSON reads; 12-second handler send deadline; no payload/exception logging. |
| 7. Empty Gmail acknowledgement | Require actual nonempty syntactically valid Gmail message ID; no fabricated ID. Acceptance is not proof of inbox delivery. |
| 8. Workspace provenance | Validate mailboxes, sender exactly matching delegated user or the explicitly registered company-approved alias/real-mailbox pair, service-account identity syntax, parseable RSA private key of at least 2048 bits. Hard release gate remains false; these checks do not prove authorisation or independent ownership. |
| 9. Privacy and retention | Draft notice identifies Quiz & Rise Ltd SC848141, Inverness, privacy@quizandrise.com, purpose, proposed bases, intended recipients, rights/ICO and pending owner decisions. Reject URL userinfo; warn against sensitive data; no external font requests. Mailbox retention remains the owner's responsibility. |
| 10. Browser state | Guard every sessionStorage operation, memory fallback for key, in-flight guard against re-entry/input re-enable; accepted state stays accepted and disabled even if storage removal fails. |
| 11. Origin/type/size | Require canonical allow-listed HTTP(S) Origin; reject absent/opaque/malformed/userinfo/path origins. Only application/json, optionally charset=utf-8. Reject duplicate/array headers; check Content-Length and actual available body bytes against 12,288. |

## Request and response contract

POST JSON fields: name (160 chars), email (320 input chars, restricted mailbox syntax),
service (enum), brief (4,000 chars), privacyAccepted exactly true; optional http/https
URL (500 chars, no username/password), optional idempotency key and empty honeypots.
Optional fields must be strings when present; null, objects, arrays, numbers and
booleans are rejected. Brief may contain tab/newline but not other C0/C1 controls.
Filled honeypots return 400 without sending, rather than claiming success.

Origin is mandatory even for server-to-server or command-line requests. OPTIONS also
requires an allowed Origin. CORS is a browser restriction, not authentication: a
non-browser client can supply an allowed Origin. No credentials are enabled.

Header and body keys, if both supplied, must match exactly. Keys are case-sensitive,
not trimmed. Clients should provide a fresh random key per enquiry and keep it with
the exact same payload during retries. Without a key, requests cannot be deduplicated.
A changed payload under the same key returns 409. The browser retains its key on
failure, so changing fields after an uncertain send can cause 409; do not silently
rotate the key. A separate new-enquiry/reset flow would need explicit design.

200 requires provider acceptance with a message ID (local injected mocks simulate it).
502 means unconfirmed delivery, including ambiguous timeouts; it does not prove that
no mail was sent. Replays of such failures stay 502 during the retention window.
Capacity returns 503; rate rejection returns 429. Error responses omit credentials,
payloads and provider exceptions. No automatic retry is performed.

## Limits that remain

- In-memory idempotency and rate limits apply only to one warm instance. Multiple
  instances/regions, cold starts and the end of the TTL allow duplicate sends and
  bypass aggregate limits. Crashes after Gmail acceptance can also cause duplicates.
  A process-local global ceiling is not a deployment-wide ceiling or anti-DDoS guarantee.
  Fixed windows allow bursts at window boundaries. Shared IPs can block legitimate users.
- No database, queue or shared paid service was added. Fingerprints and cached
  acceptance/failure status are in memory; no full enquiry payload is stored in the maps.
- Trusted IP selection assumes the hosting platform overwrites its documented header.
  Deployment must verify that assumption and the ingress path; no proxy headers are
  trustworthy merely because a client sends them. No infrastructure was inspected here.
- Hosting may buffer and parse bodies before invoking this code. Local byte checks
  cannot impose a pre-buffer network ingress cap. Re-serialised objects provide only
  an approximate size check on the already parsed input. Verify host size/time limits,
  duplicate-header handling and parser behaviour before release. A streaming request
  without an available parsed/raw body is rejected; no unbounded stream is read.
- Abort deadlines bound waiting but cannot retract a Gmail send already accepted.
  Injected dependencies that ignore AbortSignal can continue after a timeout; production
  fetch is given the signal. No exactly-once or confirmed-delivery claim is made.
- Restricted mailbox syntax deliberately rejects some valid unusual addresses.

## Manual triage and email delivery — proposed operating procedure

Before release, assign a named primary operator and deputy, mailbox permissions,
a review cadence, response target and maximum manageable volume. All are pending
owner decision; no response-time promise is published. Use the approved company
mailbox with restricted access and MFA. No forwarding to personal mail, shared
platform, CRM, database, spreadsheet export or external AI tool.

1. Review the enquiry in the approved mailbox. Treat links and message text as
   untrusted; do not open suspicious URLs or supply credentials. Do not ask for
   passwords, card details or sensitive personal information by email. Escalate
   accidental sensitive data to the privacy operator for minimisation/deletion.
2. Check service fit and ask only necessary clarifying questions in the same thread.
   Acknowledge personally when appropriate; agree scope, price, timing and delivery
   before starting work. Submitting an enquiry creates no contract or payment.
3. Use simple owner-approved mailbox labels: new, awaiting clarification, quoted,
   agreed, closed and possible duplicate. Labels are a proposed manual workflow,
   not software changes or retention enforcement. Deliver agreed work by email
   within approved scope; assess a separate arrangement before sending material
   that cannot safely be delivered this way.
4. At closure record the status/review date in the mailbox thread with minimal
   detail. Apply the approved retention schedule to all copies; do not invent a
   period or retain enquiries indefinitely while waiting for a policy. Rights,
   complaints and suspected incidents go to the designated privacy operator.

## Safe low-volume duplicate management

Search only the authorised mailbox for matching sender, service, approximate time
and brief. Verify contents before marking a possible duplicate; similar requests
may be distinct or intentional revisions. Keep one primary response thread, link
related messages internally, and check sent mail before sending another quote or
starting work twice. Do not auto-delete, bulk merge, suppress all mail from a sender,
or copy briefs into another tracking system. Retain/review labelled duplicates
under the same approved schedule as other enquiry copies.

Request IDs aid correlation but are not stable duplicate keys; the staff email does
not expose the client idempotency key. Never ask customers to share browser storage.
The browser retains a random session retry identifier after failure, not the brief.
Changing fields after uncertain acceptance can yield 409; do not silently rotate
keys, refresh/retry repeatedly or promise a second submit is safe. Staff first
reconcile mailbox and sent-mail evidence. Provider acceptance is not inbox delivery;
a timeout/502 is uncertain and can still mean mail was sent. No automatic resend.

Independent instances, cold starts, expiry and crashes can lose reservations and
create duplicates. Manual triage is acceptable only if the owner explicitly accepts
low-volume duplicate/loss/uncertainty risks and funds staff capacity. It does not
prevent cross-instance abuse. Verify enforcement across all reachable send routes;
if required protection or manageable volume cannot be established, keep disabled.
Stop intake on suspected abuse, rising volume beyond the approved threshold,
repeated uncertainty, mailbox access failure or privacy incidents; thresholds,
operator and stop procedure must be agreed before release.

## Release evidence and rollback

Use the concise [release checklist](DIGITAL_DEN_RELEASE_CHECKLIST_V1.md).
Actual host/company ownership, ingress controls, independent Workspace credential
provenance and sender permissions remain unverified. Prior owner-reported Google
Admin alias ownership for dd@quizandrise.com under ceo@quizandrise.com does not prove
Gmail send-as permission. The existing strict sender/alias allowlist and delegation
checks remain unchanged; no identities, configuration or credentials were edited.
No assumed host, WAF entitlement, free plan or new paid resource is a solution here.

Current rollback requires no service action: keep both gates false. To reverse this
pass, restore only prior local versions of the four allowlisted untracked files;
do not reset/delete other untracked work. A future operational rollback must block
direct submissions using the approved disabled server artifact/configuration as
well as the frontend; preserve legacy routes and reconcile in-flight mail, which
cannot be recalled. No production rollback was performed.

## Local verification and cost control

The existing 2026-11-18 record reported mock-only security/adversarial/isolation
checks passing. This pass reruns the existing local suite without editing backend
or tests, plus HTML/script and file-scope checks; results are in the completion
report. Mocks do not establish host ownership, Gmail delivery, provider contracts
or legal approval. Existing security, privacy, release and CI controls are retained.

Avoidable consumption found: potential future duplicate sends and abuse work;
no new paid consumption or measured cost identified. Root cause: instance-local
state and ambiguous provider acceptance. Mitigation: disabled gates, bounded local
checks, manual reconciliation and verified cross-instance admission controls before
release. No CI/cloud build or paid action taken. Any purchase, upgrade, new paid
resource, spend increase or materially billable validation requires owner approval.

### Results for this pass — 2026-11-20

- Existing `node scripts/test-minimal-enquiry.mjs`: PASS, mock-only existing and
  adversarial assertions. This result belongs to the run performed; it does not
  certify subsequent concurrent backend changes.
- HTML nesting, unique IDs, label targets, minimal field set, privacy drafting
  inputs and local document links: PASS. Extracted inline script syntax: PASS.
- Standalone synthetic DOM with valid fields: initial/input/change/direct submit
  all remain disabled; zero fetch or sessionStorage calls: PASS.
- Both frontend and server false code gates observed. Tracked working-tree and
  staged diffs empty. All four files written by this pass are untracked.
- Scope audit detected concurrent changes outside this pass: config.js, mailer.js,
  test-minimal-enquiry.mjs and new test-minimal-enquiry-oauth.mjs. Those files were
  not written or restored by this pass. Therefore a claim that the entire repository
  changed only in the four allowlisted paths cannot be made. No additional suite
  was launched against the changing backend. Coordinate a stable artifact review
  before relying on the historical technical findings above for release.
