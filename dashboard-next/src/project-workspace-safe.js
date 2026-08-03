const content = document.querySelector("#workspace-content");
const title = document.querySelector("#view-title");
const description = document.querySelector("#view-description");

const STORAGE_KEY = "digitalDen:selectedProject";
const PROJECT_ROUTE_PREFIX = "project/";

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

function projectFromCard(card) {
  const heading = card.querySelector("h3")?.textContent?.trim() || "Digital Den project";
  const meta = card.querySelector(".meta")?.textContent?.trim() || "";
  const [id = "", service = "Creative service"] = meta.split("·").map(part => part.trim());
  const progressText = card.querySelector(".progress")?.getAttribute("aria-label") || "0% complete";
  const progress = Number.parseInt(progressText, 10) || 0;
  const status = card.querySelector(".badge")?.textContent?.trim() || "draft";
  const metaRows = card.querySelectorAll(".meta");
  const updated = metaRows.length > 1 ? metaRows[metaRows.length - 1].textContent.trim() : "Update information unavailable";
  return { id, title: heading, service, progress, status, updated };
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

function overviewPanel(project) {
  return `<div class="project-workspace-grid">
    <section class="card panel project-workspace-panel">
      <small>Progress</small>
      <div class="project-workspace-progress"><strong>${project.progress}%</strong><span>complete</span></div>
      <div class="progress" aria-label="${project.progress}% complete"><span style="width:${Math.max(0, Math.min(100, project.progress))}%"></span></div>
    </section>
    <section class="card panel project-workspace-panel"><small>Service</small><h3>${escapeHtml(project.service)}</h3><p class="meta">Project delivery category</p></section>
    <section class="card panel project-workspace-panel"><small>Status</small><h3>${escapeHtml(project.status)}</h3><p class="meta">${escapeHtml(project.updated)}</p></section>
  </div>
  <section class="card panel project-workspace-panel">
    <div class="panel-header"><div><h2>Project command centre</h2><p>This first safe version establishes the dedicated project boundary without changing authentication, API contracts or write operations.</p></div></div>
    <div class="list">
      <div class="list-row"><span><strong>Project identity</strong><small>${escapeHtml(project.id)}</small></span><span class="pill neutral">Connected</span></div>
      <div class="list-row"><span><strong>Role-scoped access</strong><small>Inherited from the authenticated workspace</small></span><span class="pill neutral">Active</span></div>
      <div class="list-row"><span><strong>Project mutations</strong><small>No new write operations in this release</small></span><span class="pill neutral">Controlled</span></div>
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
  title.textContent = project?.title || "Project Workspace";
  description.textContent = "Role-scoped project delivery command centre.";

  if (!project) {
    content.innerHTML = `<section class="card panel"><div class="empty-state"><strong>Project context is unavailable</strong><span>Return to Projects and open the project again.</span><a class="button primary" href="#projects">Return to projects</a></div></section>`;
    return true;
  }

  content.innerHTML = `<div class="project-workspace-shell">
    <header class="card panel project-workspace-header">
      <div><a class="project-workspace-back" href="#projects">← Back to projects</a><p class="eyebrow">Project Workspace</p><h2>${escapeHtml(project.title)}</h2><p>${escapeHtml(project.id)} · ${escapeHtml(project.service)}</p></div>
      <span class="badge cyan">${escapeHtml(project.status)}</span>
    </header>
    <nav class="project-workspace-tabs" aria-label="Project workspace sections">
      ${tabLink(project, "overview", "Overview", route.tab)}
      ${tabLink(project, "messages", "Messages", route.tab)}
      ${tabLink(project, "files", "Files", route.tab)}
      ${tabLink(project, "disputes", "Disputes", route.tab)}
      ${tabLink(project, "billing", "Billing", route.tab)}
      ${tabLink(project, "audit", "Audit log", route.tab)}
    </nav>
    <div class="project-workspace-content">${panelForTab(project, route.tab)}</div>
  </div>`;
  return true;
}

function openProject(card) {
  const project = projectFromCard(card);
  if (!project.id) return;
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

// Bounded retries cover the asynchronous initial dashboard render without observing the whole DOM.
[400, 900, 1600, 2600].forEach(delay => window.setTimeout(() => {
  if (!parseProjectRoute()) prepareCards();
}, delay));
