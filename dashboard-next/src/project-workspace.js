const PROJECT_PREFIX = "project/";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char]));
}

function toneFor(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("flag") || value.includes("high") || value.includes("suspended")) return "red";
  if (value.includes("review") || value.includes("pending") || value.includes("invited")) return "amber";
  if (value.includes("ready") || value.includes("available") || value.includes("clear") || value.includes("clean") || value.includes("delivered") || value.includes("active")) return "green";
  return "cyan";
}

function badge(status) {
  return `<span class="badge ${toneFor(status)}">${escapeHtml(String(status || "unknown").replaceAll("_", " "))}</span>`;
}

function currentProjectId() {
  const hash = location.hash.slice(1);
  return hash.startsWith(PROJECT_PREFIX) ? decodeURIComponent(hash.slice(PROJECT_PREFIX.length)) : null;
}

function projectTab(projectId, key, label, active = false) {
  return `<a class="project-workspace-tab ${active ? "active" : ""}" href="#${PROJECT_PREFIX}${encodeURIComponent(projectId)}?tab=${encodeURIComponent(key)}" data-project-tab="${escapeHtml(key)}">${escapeHtml(label)}</a>`;
}

function currentTab() {
  const hash = location.hash.slice(1);
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return "overview";
  return new URLSearchParams(hash.slice(queryIndex + 1)).get("tab") || "overview";
}

function itemMatchesProject(item, projectId) {
  return [item?.project, item?.projectId, item?.target, item?.id].some(value => String(value || "") === String(projectId));
}

function tabContent(state, project, tab) {
  if (tab === "messages") {
    const rows = state.messages.filter(item => itemMatchesProject(item, project.id));
    return rows.length ? `<div class="list">${rows.map(item => `<div class="list-row"><span><strong>${escapeHtml(item.from)}</strong><small>${escapeHtml(item.text)}</small></span><small>${escapeHtml(item.time)}</small></div>`).join("")}</div>` : `<div class="empty-state"><strong>No project messages</strong><span>No messages are currently linked to this project.</span></div>`;
  }

  if (tab === "files") {
    const rows = state.files.filter(item => itemMatchesProject(item, project.id));
    return rows.length ? `<div class="list">${rows.map(item => `<div class="list-row"><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.project)}</small></span><span>${badge(item.scan)} ${badge(item.availability)}</span></div>`).join("")}</div>` : `<div class="empty-state"><strong>No project files</strong><span>No files are currently linked to this project.</span></div>`;
  }

  if (tab === "audit") {
    const rows = state.auditEvents.filter(item => itemMatchesProject(item, project.id));
    return rows.length ? `<div class="list">${rows.map(item => `<div class="list-row"><span><strong>${escapeHtml(item.event)}</strong><small>${escapeHtml(item.actor)} → ${escapeHtml(item.target)}</small></span><small>${escapeHtml(item.time)}</small></div>`).join("")}</div>` : `<div class="empty-state"><strong>No project audit events</strong><span>No project-specific events are visible in the current role scope.</span></div>`;
  }

  if (tab === "disputes") {
    return `<div class="notice">Dispute records remain available in the dedicated Disputes module. Project-specific filtering will be connected in the next backend phase.</div>`;
  }

  if (tab === "billing") {
    return `<div class="notice">Billing is reserved for the central payment integration. No payment, refund or contractor-share action is executed from this version.</div>`;
  }

  return `<div class="project-workspace-grid">
    <section class="card panel">
      <div class="panel-header"><div><h2>Project summary</h2><p>Role-scoped project information from the Digital Den API.</p></div></div>
      <div class="list">
        <div class="list-row"><span><strong>Project ID</strong><small>${escapeHtml(project.id)}</small></span></div>
        <div class="list-row"><span><strong>Client</strong><small>${escapeHtml(project.client)}</small></span></div>
        <div class="list-row"><span><strong>Service</strong><small>${escapeHtml(project.service)}</small></span></div>
        <div class="list-row"><span><strong>Last updated</strong><small>${escapeHtml(project.updated)}</small></span></div>
      </div>
    </section>
    <section class="card panel">
      <div class="panel-header"><div><h2>Delivery state</h2><p>Current project progress and operational state.</p></div></div>
      <div class="project-workspace-progress"><strong>${Number(project.progress || 0)}%</strong><span>complete</span></div>
      <div class="progress" aria-label="${Number(project.progress || 0)}% complete"><span style="width:${Math.max(0, Math.min(100, Number(project.progress || 0)))}%"></span></div>
      <div style="margin-top:14px">${badge(project.status)}</div>
    </section>
    <section class="card panel">
      <div class="panel-header"><div><h2>Operational modules</h2><p>Project-linked records visible to the authenticated role.</p></div></div>
      <div class="list">
        <div class="list-row"><span><strong>Messages</strong><small>Project conversation records</small></span><span class="pill neutral">${state.messages.filter(item => itemMatchesProject(item, project.id)).length}</span></div>
        <div class="list-row"><span><strong>Files</strong><small>Project file records</small></span><span class="pill neutral">${state.files.filter(item => itemMatchesProject(item, project.id)).length}</span></div>
        <div class="list-row"><span><strong>Audit events</strong><small>Project operational history</small></span><span class="pill neutral">${state.auditEvents.filter(item => itemMatchesProject(item, project.id)).length}</span></div>
      </div>
    </section>
  </div>`;
}

export function isProjectWorkspaceRoute() {
  return Boolean(currentProjectId());
}

export function renderProjectWorkspace(state) {
  const projectId = currentProjectId();
  if (!projectId) return null;
  const project = state.projects.find(item => String(item.id) === String(projectId));
  if (!project) {
    return `<section class="card panel"><div class="empty-state"><strong>Project not available</strong><span>This project is not visible in the current authenticated scope.</span><a class="button secondary" href="#projects">Back to projects</a></div></section>`;
  }

  const tab = currentTab();
  const tabs = [
    ["overview", "Overview"], ["messages", "Messages"], ["files", "Files"],
    ["disputes", "Disputes"], ["billing", "Billing"], ["audit", "Audit log"],
  ];

  return `<section class="project-workspace-shell" data-project-id="${escapeHtml(project.id)}">
    <div class="project-workspace-header">
      <div>
        <a class="project-workspace-back" href="#projects">← Back to projects</a>
        <p class="eyebrow">Project workspace</p>
        <h2>${escapeHtml(project.title)}</h2>
        <p>${escapeHtml(project.id)} · ${escapeHtml(project.service)} · ${escapeHtml(project.client)}</p>
      </div>
      <div>${badge(project.status)}</div>
    </div>
    <nav class="project-workspace-tabs" aria-label="Project workspace sections">
      ${tabs.map(([key, label]) => projectTab(project.id, key, label, tab === key)).join("")}
    </nav>
    <section class="card panel project-workspace-content">
      ${tabContent(state, project, tab)}
    </section>
  </section>`;
}

export function projectWorkspaceTitle(state) {
  const projectId = currentProjectId();
  const project = state.projects.find(item => String(item.id) === String(projectId));
  return project ? project.title : "Project Workspace";
}
