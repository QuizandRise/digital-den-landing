# Digital Den Mail — factual release evidence, 20 November 2026

**Status: ready for further controlled preview work; public enquiry submission remains DISABLED.**
This document contains no secret values or customer enquiry content.

## Independently verified

- **Owner/host:** logged-in Vercel account `quiz-rise1`, project
  `digital-den-landing-yulk`, production domain `digital.quizandrise.com`;
  separately isolated from Vercel project `digital-den-api` (which contains
  WorkforceDen-related code). The landing repository is
  `QuizandRise/digital-den-landing`; its legacy tracked files and rewrites are
  unchanged by PR #40.
- **Preview:** a Vercel preview for the Digital Den PR displayed
  `/minimal-enquiry.html`; submit was disabled. A GET to
  `/api/minimal-enquiry` returned a safe 403 when not supplied a trusted Origin.
  No live customer submission was accepted.
- **Host WAF:** in `digital-den-landing-yulk`, published a project-level rule
  named `Digital Den enquiry API limit`. Match: **Request Path equals
  `/api/minimal-enquiry`** (all methods); action Rate Limit, fixed window
  **600 seconds**, **5 allowed requests per source IP**, then **HTTP 429**.
  Bounded read-only check from an authenticated preview on 20 November 2026:
  **403, 403, 403, 403, 403, 429, 429**. The last two statuses confirm
  edge enforcement without an email send. This is not proof of protection
  against rotating IPs or of cross-instance deduplication.
- **Pricing:** Vercel publicly lists first one million allowed rate-limit
  requests included, then usage-based pricing from $0.50 per million,
  potentially higher in some regions. This is not a guarantee that a team or
  project cannot incur additional unrelated Vercel charges. See:
  https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
- **OAuth:** dedicated Google Cloud project `digital-den-mail`, Gmail API
  enabled, internal OAuth client granted only `gmail.send`. Real internal
  mail sent as `dd@quizandrise.com` to `info@quizandrise.com` was received.
  The isolated new handler uses this OAuth design, but has not yet completed
  a deployed secret-bearing end-to-end POST.
- **Preview configuration:** 12 non-secret `DD_ENQUIRY_` settings and
  the OAuth client identifier were created in Vercel **Preview** environment
  for the frontend project. The client secret and refresh token were **not**
  configured via the assistant. Do not infer any production secret change.
- **Privacy operations:** the owner agreed to keep ordinary unconverted
  enquiries for up to **12 months following the last substantive exchange**, with
  monthly manual CEO review/deletion, reasonable legal-hold exceptions and a
  separate record-class policy for converted paid client projects. The public
  draft and internal LIA/retention record reflect this decision. The company
  registered office and privacy mailbox routing were also checked.

## Remaining release controls

1. Owner-approved **secure** injection of two OAuth secret values into the
   confirmed frontend project only, initially Preview. The local macOS Keychain
   denies unattended export of the refresh token; do not bypass OS protections
   or paste secrets into Git, logs, email or chat. A user-mediated handoff may
   be necessary.
2. A bounded real preview end-to-end POST using the latest reviewed artifact,
   with private sender and recipient and a single test record; verify Gmail
   receipt and clean up the test mail according to policy. The current hardcoded
   release flags stay false until an exact tested preview branch is prepared.
3. Confirm operational deletion review ownership and contractual processing/
   international-transfer terms before publishing the final UK GDPR notice.
4. Owner acceptance of residual cross-instance duplicate, recovery and rotating
   IP abuse risk, and a tested rollback blocking direct POST requests.
5. Only then approve a separate production change that enables the two flags,
   replaces the existing homepage form safely, and confirms the correct Vercel
   Production secret environment and verified domain mapping. No changes to
   `digital-den-api`, any WorkforceDen deployment, or DNS.

**Current public site not changed.** The PR remains draft and no production
merge or new secret-bearing deployment has been authorised or performed here.
