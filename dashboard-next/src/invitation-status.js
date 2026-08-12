/**
 * Compatibility helper for team invitation delivery confirmation.
 * API returns payload.invitation.sent; older clients read payload.invitationSent.
 */
export function invitationWasSent(payload) {
  return Boolean(payload?.invitation?.sent ?? payload?.invitationSent);
}
