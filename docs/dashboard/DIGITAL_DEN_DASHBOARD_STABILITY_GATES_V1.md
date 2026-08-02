# Digital Den Dashboard Stability Gates v1

## Non-disruption principle

The current active dashboards and production routes must remain available while Digital Den is completed. No cutover occurs merely because a preview deployment builds successfully.

## Mandatory controls

### Source-control isolation

- Development occurs on dedicated feature branches.
- `main` remains the operational baseline.
- No direct changes to production data or production secrets.
- Every production-impacting change requires a pull request and an explicit operator decision.

### Feature flags

The completed application should support at least:

- `DIGITAL_DEN_DASHBOARD_V2_ENABLED`
- `DIGITAL_DEN_MANAGER_WORKSPACE_ENABLED`
- `DIGITAL_DEN_TEAM_WORKSPACE_ENABLED`
- `DIGITAL_DEN_CLIENT_WORKSPACE_ENABLED`
- `DIGITAL_DEN_PAYMENTS_READONLY_ENABLED`
- `DIGITAL_DEN_MUTATIONS_ENABLED`

All flags default to disabled outside approved staging environments.

### Compatibility

- Existing public enquiry and project-request flows must remain intact.
- Existing email delivery must not be replaced until the new workflow is proven.
- New APIs must be additive and versioned.
- Database changes must be backward compatible and reversible.

### Security

- Roles and project scopes are resolved server-side.
- Client ownership, team assignment and manager authority are validated for every request.
- Hidden interface elements are not treated as access control.
- Files, messages and project transitions require audit records.
- Payment data is read from the central platform; Digital Den does not store provider credentials or duplicate the financial ledger.

### Quality gates

Before any merge toward production:

1. Build succeeds.
2. Typecheck succeeds.
3. Unit tests succeed.
4. API contract tests succeed.
5. Role-isolation tests succeed.
6. Accessibility checks succeed.
7. Mobile review succeeds.
8. Vercel preview succeeds.
9. Existing enquiry and email flows show no regression.
10. Rollback instructions are documented.

### Rollout sequence

1. Preview only.
2. Internal manager account.
3. Limited internal team accounts.
4. Test client account.
5. Staging acceptance.
6. Controlled production canary.
7. Wider production activation.

## Stop conditions

Rollout stops immediately if any of the following occurs:

- cross-client or cross-project data exposure;
- role escalation;
- duplicate project mutation;
- lost or unaudited message/file operation;
- payment-state mismatch;
- regression in the existing enquiry or notification flow;
- inability to disable the new workspace without a code deployment.

## Ownership boundaries

- Digital Den owns project-delivery workflows.
- Quiz & Rise identity owns authentication and account authority.
- The unified payment platform owns checkout, refunds, disputes and payment truth.
- The enterprise audit service owns durable security and workflow evidence.
- Production activation remains an explicit operational decision.
