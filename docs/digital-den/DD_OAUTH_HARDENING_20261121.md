# OAuth refresh audit — 21 November 2026

Branch: `agent/dd-gmail-release-hardening-20261121`. Local code review and
synthetic tests only. No credentials, Keychain, secret files, Vercel administration,
private data or browser sessions accessed. No grant changes, push, merge or deploy.

The refresh request included `scope`. The narrow correction omits that optional
field and sends only `grant_type`, `client_id`, `client_secret`, `refresh_token`,
matching [Google's refresh flow](https://developers.google.com/identity/protocols/oauth2/web-server#offline).
[RFC 6749 section 6](https://www.rfc-editor.org/rfc/rfc6749#section-6) permits
`scope`; omission inherits the original grant. Thus the previous field is a
documented-flow compatibility concern, **not a reproduced cause of Google's
production `invalid_grant`**. The mock request-contract regression fails before
the correction and passes afterward; it does not simulate Google's internals.

Exact send-only configuration and returned-scope validation remain. An omitted
response scope inherits the owner-confirmed grant; it cannot independently prove
the real grant's scope or mailbox. A returned different, broad, empty or malformed
scope fails closed. Bearer type is mandatory; a supplied lifetime must be a
positive safe integer. Missing lifetime remains compatible with the protocol.
No token inspection endpoint or additional Google permission is introduced.

Each token/send operation has a five-second deadline including response parsing
and an abort signal; the handler has a twelve-second outer bound. Late token
completion cannot initiate a Gmail send after its deadline. Cancellation cannot
unsend a message already accepted by Gmail. No automatic retry or fallback auth
exists, including on 400, 401, 429, 500 or 503. Provider failures return redacted
`502 delivery_unconfirmed`; configuration failures remain 503. Logs retain only
allowlisted OAuth category, HTTP status and provider stage, never response bodies.

Existing per-instance limits remain five requests per IP per fifteen minutes,
100 admitted requests globally per window, and bounded maps. Retries consume rate
admission before idempotency lookup. Concurrent and completed identical failures
reuse the same reservation; completed reservations persist thirty minutes.
Changing keys to retry can duplicate uncertain mail. Cold starts and multiple
instances remain best-effort limitations; preserve existing host WAF enforcement.
No reproducible rate/retry defect warranted production changes in those modules.
Sender alias, fixed mailbox routing, MIME/header controls, origin checks, privacy
notice, retention controls and identity isolation are preserved.

Supervisor handoff (agent must not execute these external steps):

1. Independently review this diff and local checks; merge only through the approved
   process. Confirm the intended account/project is
   `quiz-rise1/digital-den-landing-yulk` and public host is
   `digital.quizandrise.com`. Stop on a team mismatch rather than using another
   account or connector workaround.
2. The owner must resolve any secret-provisioning issue through the approved
   human-managed process. The existing blocked programmatic Keychain-to-Vercel
   transfer must remain blocked. Do not ask this agent to retrieve, compare,
   display or transfer values, or to change Google grants. Confirm only that the
   three server-side OAuth settings are provisioned as a matching client/grant
   set for Production, with existing scope, identity and alias acknowledgments.
   Setting names are `DD_ENQUIRY_GOOGLE_OAUTH_CLIENT_ID`,
   `DD_ENQUIRY_GOOGLE_OAUTH_CLIENT_SECRET`,
   `DD_ENQUIRY_GOOGLE_OAUTH_REFRESH_TOKEN`. No values belong in review evidence.
3. Supervisor redeploys the reviewed **server function** with the intended
   Production environment under existing release authorization; rebuilding only
   the static frontend is insufficient. Confirm the new deployment serves the
   public host. Existing function instances cannot be assumed to acquire updated
   environment settings. Preserve WAF rules and all release/privacy gates.
4. Once the correct deployment and environment are confirmed, make **one**
   authorized synthetic submission through the public form (privacy accepted,
   unique idempotency key, no customer information). Expect HTTP 200 with
   `ok: true`; this proves provider acceptance only. The authorized mailbox owner
   separately confirms receipt and the approved sender alias, then handles test
   mail under existing retention rules. Record only status, request ID and
   acceptance/receipt outcome. Do not capture tokens, request bodies or mail data.
   On 502/timeout stop; retain the key, reconcile possible delivery manually and
   use only existing redacted category/stage evidence. Do not repeatedly replace
   credentials, regenerate grants or send more tests. Persistent `invalid_grant`
   remains an owner/provider provisioning blocker outside this code-only audit.

Local verification (clean environment, synthetic fixtures; no external requests):

- `node scripts/test-minimal-enquiry-oauth.mjs`: passed, including exact four-field
  refresh body, scope/type/lifetime rejection, HTTP failures, late completion,
  response-body deadlines, redacted diagnostics, concurrent failure idempotency
  and rate admission.
- `node scripts/test-minimal-enquiry.mjs`: passed existing and adversarial checks
  (also imports the OAuth suite).
- `node scripts/test-homepage-minimal-enquiry.mjs`: passed gate, payload, retry,
  fallback, privacy and response checks with mocks; homepage unchanged.
- `git diff --check`: passed before final report.

Rollback: supervisor can reverse only this patch's mailer, targeted test and audit
document changes after review, leaving unrelated work intact, then redeploy the
previous approved server artifact if necessary. Rollback cannot unsend mail.
If intake must stop, use the existing owner-approved server disable/rollback
procedure and verify direct POST is blocked; a disabled button alone is inadequate.

Cost report: no new avoidable paid consumption discovered. Repeated credential
replacement/test sends would be avoidable while deployment provenance is unresolved;
the actual production root cause is unproven. Mitigation is one reviewed server
redeploy and one bounded test after owner provisioning confirmation. Existing
security, privacy, WAF, idempotency, rate limits and targeted checks are preserved.
No CI run, paid infrastructure, plan or limit change was made. No new paid action
is required by this patch; any materially billable deployment/workflow outside
existing authorized release settings still requires owner approval.
