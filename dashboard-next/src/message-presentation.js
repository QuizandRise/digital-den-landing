const INTERNAL_MODERATION_STATES = ["flag", "block", "moderation", "policy", "quarantine", "review"];

function isInternalModerationState(state) {
  const value = String(state || "").toLowerCase();
  return INTERNAL_MODERATION_STATES.some(marker => value.includes(marker));
}

export function presentMessageForRole(message, role) {
  if (role === "manager" || !isInternalModerationState(message?.state)) return message;

  return {
    project: message?.project,
    from: "Digital Den",
    text: "Message under review",
    time: message?.time,
    state: "under_review",
  };
}
