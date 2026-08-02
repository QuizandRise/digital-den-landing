const API_BASE = globalThis.location?.origin ?? "";
let actor = null;
let team = [];
let projects = [];
let loading = false;

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `Workspace request failed (${response.status})`;
    const correlationId = response.headers.get("x-correlation-id") || payload?.error?.correlationId;
    throw new Error(correlationId ? `${message}; correlationId=${correlationId}` : message);
  }
  return payload;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char]));
}

async function loadData() {
  const [sessionPayload, teamPayload, projectsPayload] = await Promise.all([
    requestJson("/api/digital-den/session"),
    requestJson("/api/digital-den/team/manage"),
    requestJson("/api/digital-den/projects"),
  ]);
  actor = sessionPayload.actor || null;
  team = teamPayload.team || [];
  projects = projectsPayload.projects || [];
}

function projectLabel(projectId) {
  const project = projects.find(item => String(item.projectId) === String(projectId));
  return project?.title || projectId;
}

function panelMarkup() {
  const memberOptions = team.map(member =>
    `<option value="${escapeHtml(member.userId)}">${escapeHtml(member.name)} — ${escapeHtml(member.email)}</option>`
  ).join("");

  return `<section id="team-messaging-permissions" class="card panel" style="margin-bottom:18px">
    <div class="panel-header"><div><h2>Client messaging permissions</h2><p>Choose which assigned projects each Team Member may discuss directly with the client.</p></div></div>
    ${team.length ? `<form id="team-messaging-form" class="list" style="gap:12px">
      <label><strong>Team member</strong><select id="team-messaging-member">${memberOptions}</select></label>
      <label><strong>Approved projects</strong><select id="team-messaging-projects" multiple size="6"></select><small class="meta">Only projects already assigned to this Team Member are available.</small></label>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <button id="team-messaging-save" class="button primary" type="submit">Save messaging permissions</button>
        <span id="team-messaging-status" class="notice" hidden></span>
      </div>
    </form>` : `<div class="empty-state"><strong>No Team Members available</strong><span>Invite a Team Member before granting messaging access.</span></div>`}
  </section>`;
}

function renderProjectOptions() {
  const memberId = document.querySelector("#team-messaging-member")?.value;
  const member = team.find(item => String(item.userId) === String(memberId));
  const select = document.querySelector("#team-messaging-projects");
  if (!member || !select) return;

  const approved = new Set((member.clientMessagingScopes || []).map(String));
  select.innerHTML = (member.projectScopes || []).map(projectId =>
    `<option value="${escapeHtml(projectId)}" ${approved.has(String(projectId)) ? "selected" : ""}>${escapeHtml(projectLabel(projectId))}</option>`
  ).join("");
}

async function injectPanel() {
  if (location.hash !== "#team" || loading) return;
  const content = document.querySelector("#workspace-content");
  if (!content || content.querySelector("#team-messaging-permissions")) return;

  loading = true;
  try {
    await loadData();
    if (actor?.role !== "manager") return;
    content.insertAdjacentHTML("afterbegin", panelMarkup());
    renderProjectOptions();

    document.querySelector("#team-messaging-member")?.addEventListener("change", renderProjectOptions);
    document.querySelector("#team-messaging-form")?.addEventListener("submit", async event => {
      event.preventDefault();
      const memberId = document.querySelector("#team-messaging-member").value;
      const selected = [...document.querySelectorAll("#team-messaging-projects option:checked")].map(option => option.value);
      const button = document.querySelector("#team-messaging-save");
      const status = document.querySelector("#team-messaging-status");
      button.disabled = true;
      status.hidden = false;
      status.textContent = "Saving messaging permissions…";
      try {
        const payload = await requestJson("/api/digital-den/team/manage", {
          method: "PATCH",
          headers: { "X-Digital-Den-Intent": "team-administration" },
          body: JSON.stringify({ userId: memberId, clientMessagingScopes: selected }),
        });
        const index = team.findIndex(item => String(item.userId) === String(memberId));
        if (index !== -1) team[index] = payload.teamMember;
        status.textContent = "Messaging permissions saved successfully.";
      } catch (error) {
        status.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });
  } catch {
    // The main Team view remains available if this optional permission panel cannot load.
  } finally {
    loading = false;
  }
}

const observer = new MutationObserver(injectPanel);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("hashchange", injectPanel);
injectPanel();
