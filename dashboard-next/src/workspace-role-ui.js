const API_BASE = globalThis.location?.origin ?? "";

let actorRole = null;

async function loadActorRole() {
  if (actorRole) return actorRole;
  try {
    const response = await fetch(`${API_BASE}/api/digital-den/session`, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const payload = await response.json().catch(() => ({}));
    actorRole = payload?.actor?.role || null;
    return actorRole;
  } catch {
    return null;
  }
}

function roleName(role) {
  if (role === "manager") return "Manager";
  if (role === "team_member") return "Team";
  return "Client";
}

function applyRoleLabels(role) {
  if (!role) return;
  const name = roleName(role);

  const eyebrow = document.querySelector(".workspace-heading .eyebrow");
  if (eyebrow) eyebrow.textContent = `Digital Den ${name} Workspace`;

  const brandSubtitle = document.querySelector(".sidebar .brand small");
  if (brandSubtitle) brandSubtitle.textContent = `${name} workspace`;

  const environmentPill = document.querySelector("#environment-pill");
  if (environmentPill) environmentPill.textContent = `${name} Workspace`;

  document.title = `Digital Den ${name} Workspace`;
}

function applyCapabilityState(role) {
  if (role !== "manager") return;
  const rows = [...document.querySelectorAll(".list-row")];
  const mutationRow = rows.find(row => row.querySelector("strong")?.textContent?.trim() === "Mutations");
  if (!mutationRow) return;

  const detail = mutationRow.querySelector("small");
  const pill = mutationRow.querySelector(".pill");
  if (detail) detail.textContent = "Role-scoped controlled operations";
  if (pill) pill.textContent = "Controlled";
}

async function refreshRoleUI() {
  const role = await loadActorRole();
  if (!role) return;
  applyRoleLabels(role);
  applyCapabilityState(role);
}

const observer = new MutationObserver(() => {
  void refreshRoleUI();
});

observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("hashchange", () => void refreshRoleUI());
void refreshRoleUI();
