const API_BASE = globalThis.location?.origin ?? "";

let actorRole = null;
let retryTimer = null;
let retryCount = 0;
const MAX_RETRIES = 8;

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
  if (role === "team_member") return "Professional";
  return "Client";
}

function setTextIfChanged(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function applyRoleLabels(role) {
  if (!role) return;
  const name = roleName(role);

  setTextIfChanged(document.querySelector(".workspace-heading .eyebrow"), `Digital Den ${name} Workspace`);
  setTextIfChanged(document.querySelector(".sidebar .brand small"), `${name} workspace`);
  setTextIfChanged(document.querySelector("#environment-pill"), `${name} Workspace`);

  const title = `Digital Den ${name} Workspace`;
  if (document.title !== title) document.title = title;
}

function applyCapabilityState(role) {
  if (role !== "manager") return true;
  const rows = [...document.querySelectorAll(".list-row")];
  const mutationRow = rows.find(row => row.querySelector("strong")?.textContent?.trim() === "Mutations");
  if (!mutationRow) return false;

  setTextIfChanged(mutationRow.querySelector("small"), "Role-scoped controlled operations");
  setTextIfChanged(mutationRow.querySelector(".pill"), "Controlled");
  return true;
}

async function refreshRoleUI() {
  const role = await loadActorRole();
  if (!role) return;
  applyRoleLabels(role);

  const capabilityReady = applyCapabilityState(role);
  if (!capabilityReady && retryCount < MAX_RETRIES) {
    retryCount += 1;
    window.clearTimeout(retryTimer);
    retryTimer = window.setTimeout(() => void refreshRoleUI(), 250);
  }
}

window.addEventListener("hashchange", () => {
  retryCount = 0;
  void refreshRoleUI();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void refreshRoleUI(), { once: true });
} else {
  void refreshRoleUI();
}
