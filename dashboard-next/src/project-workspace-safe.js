import { ROLE_CAPABILITIES } from "./platform-config.js";

const content = document.querySelector("#workspace-content");
const title = document.querySelector("#view-title");
const description = document.querySelector("#view-description");

const STORAGE_KEY = "digitalDen:selectedProject";
const PROJECT_ROUTE_PREFIX = "project/";

function actorRole() {
  return document.querySelector("#app")?.dataset.actorRole || "client";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function currentRoute() {
  return decodeURIComponent(location.hash.slice(1));
}

function projectRoute(projectId, tab = "overview") {
  return `${PROJECT_ROUTE_PREFIX}${encodeURIComponent(projectId)}/${tab}`;
}

function parseProjectRoute() {
  const raw = location.hash.slice(1);
  if (!raw.startsWith(PROJECT_ROUTE_PREFIX)) return null;
  const parts = raw.split("/");
  if (parts.length < 2) return null;
  return {
    projectId: decodeURIComponent(parts[1] || ""),
    tab: parts[2] || "overview",
  };
}

function projectListRoute(project) {
  if (["assigned_work", "projects"].includes(project?.returnRoute)) return project.returnRoute;
  return actorRole() === "team_member" ? "assigned_work" : "projects";
}

function projectFromCard(card) {
  const heading = card.querySelector("h3")?.textContent?.trim() || "Digital Den project";
  const meta = card.querySelector(".meta")?.textContent?.trim() || "";
  const [id = "", service = "Creative service"] = meta.split("·").map(part => part.trim());
  const progressText = card.querySelector(".progress")?.getAttribute("aria-label") || "0% complete";
  const progress = Number.parseInt(progressText, 10) || 0;
  const status = card.querySelector(".badge")?.textContent?.trim() || "draft";
  const metaRows = card.querySelectorAll(".meta");
  const updated = metaRows.length > 1 ? metaRows[metaRows.length - 1].textContent.trim() : "Update information unavailable";
  return {
    id,
    title: heading,
    service,
    progress,
    status,
    updated,
    client: "Not recorded",
    brief: "No project brief is currently exposed by the workspace API.",
    assignedTeam: "Not assigned",
    deadline: "Not recorded",
    budget: "Not recorded",
    priority: "Normal",
  };
}

function saveProject(project) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(project));
}

function loadProject(projectId) {
  try {
    const project = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    return project?.id === projectId ? project : null;
  } catch {
    return null;
  }
}

function tabLink(project, tab, label, activeTab) {
  return `<a class="project-workspace-tab ${activeTab === tab ? "active" : ""}" href="#${projectRoute(project.id, tab)}">${label}</a>`;
}

function reservedPanel(titleText, message) {
  return `<section class="card panel project-workspace-panel"><div class="empty-state"><strong>${escapeHtml(titleText)}</strong><span>${escapeHtml(message)}</span></div></section>`;
}

function infoRow(label, value, tone = "neutral") {
  return `<div class="list-row"><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(value)}</small></span><span class="pill ${tone}">${value === "Not recorded" || value === "Not assigned" ? "Pending" : "Available"}</span></div>`;
}

function quickAction(project, tab, label) {
  return `<a class="button secondary project-quick-action" href="#${projectRoute(project.id, tab)}">${escapeHtml(label)}</a>`;
}

function overviewPanel(project) {
  const role = actorRole();
  const currentStage = project.status.replaceAll("_", " ");
  const recentActivity = project.updated || "No recent activity recorded";
  return `<div class="project-workspace-grid project-overview-metrics">
    <section class="card panel project-workspace-panel">
      <small>Progress</small>
      <div class="project-workspace-progress"><strong>${project.progress}%</strong><span>complete</span></div>
      <div class="progress" aria-label="${project.progress}% complete"><span style="width:${Math.max(0, Math.min(100, project.progress))}%"></span></div>
    </section>
    <section class="card panel project-workspace-panel"><small>Current stage</small><h3>${escapeHtml(currentStage)}</h3><p class="meta">Project workflow status</p></section>
    <section class="card panel project-workspace-panel"><small>Priority</small><h3>${escapeHtml(project.priority)}</h3><p class="meta">Default until a manager records a value</p></section>
  </div>

  <div class="project-overview-columns">
    <section class="card panel project-workspace-panel">
      <div class="panel-header"><div><h2>Project brief</h2><p>Core client and delivery information currently available to this workspace.</p></div></div>
      ${role === "manager" ? `<div class="project-brief-block">
        <span class="meta">Client</span>
        <strong>${escapeHtml(project.client)}</strong>
      </div>` : ""}
      <div class="project-brief-block">
        <span class="meta">Service</span>
        <strong>${escapeHtml(project.service)}</strong>
      </div>
      <div class="project-brief-block">
        <span class="meta">Brief</span>
        <p>${escapeHtml(project.brief)}</p>
      </div>
    </section>

    ${role === "manager" ? `<section class="card panel project-workspace-panel">
      <div class="panel-header"><div><h2>Delivery controls</h2><p>Manager-visible operational fields for this project.</p></div></div>
      <div class="list">
        ${infoRow("Assigned team", project.assignedTeam)}
        ${infoRow("Deadline", project.deadline)}
        ${infoRow("Budget", project.budget)}
        ${infoRow("Last update", recentActivity)}
      </div>
    </section>` : `<section class="card panel project-workspace-panel"><div class="panel-header"><div><h2>Delivery information</h2><p>Information available within your project scope.</p></div></div><div class="list">${infoRow("Last update", recentActivity)}</div></section>`}
  </div>

  <section class="card panel project-workspace-panel">
    <div class="panel-header"><div><h2>Quick actions</h2><p>Safe navigation only. No new write operation is enabled in this release.</p></div></div>
    <div class="project-quick-actions">
      ${quickAction(project, "messages", "Open messages")}
      ${quickAction(project, "files", "Open files")}
      ${quickAction(project, "disputes", "Open disputes")}
      ${role === "manager" ? `<a class="button secondary project-quick-action" href="#team">Assign team member</a><a class="button secondary project-quick-action" href="#clients">View client area</a>` : ""}
    </div>
  </section>

  <section class="card panel project-workspace-panel">
    <div class="panel-header"><div><h2>Recent activity</h2><p>Latest project event currently exposed by the workspace.</p></div></div>
    <div class="list">
      <div class="list-row"><span><strong>Project status updated</strong><small>${escapeHtml(recentActivity)}</small></span><span class="pill neutral">${escapeHtml(currentStage)}</span></div>
      <div class="list-row"><span><strong>Project identity</strong><small>${escapeHtml(project.id)}</small></span><span class="pill neutral">Connected</span></div>
      <div class="list-row"><span><strong>Role-scoped access</strong><small>Inherited from the authenticated workspace</small></span><span class="pill neutral">Active</span></div>
    </div>
  </section>`;
}

function panelForTab(project, tab) {
  if (tab === "overview") return overviewPanel(project);
  if (tab === "messages") return reservedPanel("Project messages", "Project-scoped conversation data will be connected after this workspace shell is verified on mobile and desktop.");
  if (tab === "files") return reservedPanel("Project files", "Project-scoped file controls remain unchanged and will be connected in the next tested stage.");
  if (tab === "disputes") return reservedPanel("Project disputes", "The existing dispute module remains available from the main navigation until project-level integration is verified.");
  if (tab === "billing") return reservedPanel("Project billing", "Payments, refunds and contractor settlements remain disabled in this workspace version.");
  if (tab === "audit") return reservedPanel("Project audit log", "Project-scoped audit filtering will be connected without altering the existing read-only audit service.");
  return reservedPanel("Project workspace", "This project tab is not available.");
}

function renderProjectWorkspace() {
  const route = parseProjectRoute();
  if (!route || !content) return false;

  const project = loadProject(route.projectId);
  const canViewProjectAudit = Boolean(ROLE_CAPABILITIES[actorRole()]?.viewProjectAudit);
  const visibleTab = route.tab === "audit" && !canViewProjectAudit ? "overview" : route.tab;
  const returnRoute = projectListRoute(project);
  title.textContent = project?.title || "Project Workspace";
  description.textContent = "Role-scoped project delivery command centre.";

  if (!project) {
    content.innerHTML = `<section class="card panel"><div class="empty-state"><strong>Project context is unavailable</strong><span>Return to your project list and open the project again.</span><a class="button primary" href="#${returnRoute}">Return to project list</a></div></section>`;
    return true;
  }

  content.innerHTML = `<div class="project-workspace-shell">
    <header class="card panel project-workspace-header">
      <div><a class="project-workspace-back" href="#${returnRoute}">← Back to projects</a><p class="eyebrow">Project Workspace</p><h2>${escapeHtml(project.title)}</h2><p>${escapeHtml(project.id)} · ${escapeHtml(project.service)}</p></div>
      <span class="badge cyan">${escapeHtml(project.status)}</span>
    </header>
    <nav class="project-workspace-tabs" aria-label="Project workspace sections">
      ${tabLink(project, "overview", "Overview", visibleTab)}
      ${tabLink(project, "messages", "Messages", visibleTab)}
      ${tabLink(project, "files", "Files", visibleTab)}
      ${tabLink(project, "disputes", "Disputes", visibleTab)}
      ${tabLink(project, "billing", "Billing", visibleTab)}
      ${canViewProjectAudit ? tabLink(project, "audit", "Audit log", visibleTab) : ""}
    </nav>
    <div class="project-workspace-content">${panelForTab(project, visibleTab)}</div>
  </div>`;
  return true;
}

function openProject(card) {
  const project = projectFromCard(card);
  if (!project.id) return;
  project.returnRoute = currentRoute() === "assigned_work" ? "assigned_work" : "projects";
  saveProject(project);
  location.hash = projectRoute(project.id);
}

content?.addEventListener("click", event => {
  if (parseProjectRoute()) return;
  const card = event.target.closest(".project-card");
  if (!card) return;
  event.preventDefault();
  openProject(card);
});

content?.addEventListener("keydown", event => {
  if (parseProjectRoute() || !["Enter", " "].includes(event.key)) return;
  const card = event.target.closest(".project-card");
  if (!card) return;
  event.preventDefault();
  openProject(card);
});

function prepareCards() {
  if (parseProjectRoute()) return;
  content?.querySelectorAll(".project-card").forEach(card => {
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", `Open project workspace for ${card.querySelector("h3")?.textContent || "this project"}`);
    card.dataset.projectWorkspaceReady = "true";
  });
}

window.addEventListener("hashchange", () => {
  if (!renderProjectWorkspace()) {
    window.setTimeout(prepareCards, 0);
  }
});

window.addEventListener("load", () => {
  if (!renderProjectWorkspace()) {
    window.setTimeout(prepareCards, 1200);
  }
});

new MutationObserver(() => {
  if (!parseProjectRoute()) prepareCards();
}).observe(content, { childList: true, subtree: true });

[400, 900, 1600, 2600].forEach(delay => window.setTimeout(() => {
  if (!parseProjectRoute()) prepareCards();
}, delay));
