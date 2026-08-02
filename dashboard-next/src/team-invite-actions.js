export function attachTeamInvitationActions({ content, state, service, render, escapeHtml }) {
  content.addEventListener("click", async event => {
    const button = event.target.closest("[data-team-resend]");
    if (!button) return;

    const member = state.teamMembers.find(item => item.id === button.dataset.teamResend);
    if (!member || member.status === "suspended") return;

    const statusBox = document.querySelector("#team-invite-status");
    button.disabled = true;
    if (statusBox) {
      statusBox.hidden = false;
      statusBox.textContent = `Sending a new invitation to ${member.email}…`;
    }

    try {
      const result = await service.resendTeamInvitation(member.id);
      if (statusBox) {
        statusBox.textContent = result.invitationSent
          ? `Invitation sent successfully to ${member.email}.`
          : `The invitation was prepared, but email delivery was not confirmed.`;
      }
    } catch (error) {
      if (statusBox) statusBox.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}

export function teamInviteStatusPanel() {
  return `<div id="team-invite-status" class="notice" hidden></div>`;
}

export function teamMemberActions(member, escapeHtml) {
  const resendDisabled = member.status === "suspended" ? "disabled" : "";
  const resendTitle = member.status === "suspended"
    ? "Reactivate the account before sending an invitation"
    : "Send a new one-time invitation link";

  return `<div style="display:flex;gap:8px;flex-wrap:wrap">
    <button class="button secondary" type="button" data-team-edit="${escapeHtml(member.id)}">Manage</button>
    <button class="button secondary" type="button" data-team-resend="${escapeHtml(member.id)}" ${resendDisabled} title="${escapeHtml(resendTitle)}">Resend invite</button>
  </div>`;
}
