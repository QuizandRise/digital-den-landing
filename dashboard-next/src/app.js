import { FEATURE_FLAGS, ROUTE_POLICY, NAVIGATION } from "./config.js";
import { createDashboardService } from "./services/dashboard-service.js";
import { attachTeamInvitationActions, teamInviteStatusPanel, teamMemberActions } from "./team-invite-actions.js";
import { PLATFORM_CONFIG, ROLE_CAPABILITIES, roleLabel } from "./platform-config.js";
import { FINANCIAL_FIELDS, financialValue, normalizeFinancialRecord } from "./financial-contract.js";
import { presentMessageForRole } from "./message-presentation.js";

const service = createDashboardService();
const state = {
  role: FEATURE_FLAGS.authentication ? "client" : "manager",
  view: location.hash.slice(1) || "overview",
  query: "",
  loading: true,
  error: null,
  actor: null,
  overview: null,
  projects: [],
  reviews: [],
  messages: [],
  files: [],
  clients: [],
  teamMembers: [],
  auditEvents: [],
  communicationPolicy: [],
};

const app = document.querySelector("#app");
const nav = document.querySelector("#primary-nav");
const content = document.querySelector("#workspace-content");
const title = document.querySelector("#view-title");
const description = document.querySelector("#view-description");
const search = document.querySelector("#global-search");
const rolePreview = document.querySelector(".role-preview");
const environmentPill = document.querySelector("#environment-pill");
const newProjectButton = document.querySelector("#new-project-button");

const descriptions = {
  overview:"Role-scoped project delivery visibility.", projects:"Projects visible within the current actor scope.",
  review:"Manager-controlled approval queue.", messages:"Authorised project conversations.", communication_control:"Communication policy, moderation rules and flagged-item visibility.",
  clients:"Client relationships, project load and recent activity.", team:"Invite team members and control project access.", audit:"Read-only operational history.",
  assigned_work:"Workstreams assigned to this team member.", files:"Project files available to this role.", billing:"Read-only client billing visibility.",
  financials:"Read-only organisational financial visibility.",
  assignments:"Manager-controlled internal assignments and compensation obligations.",
  my_assignments:"Your assignment offers, acceptance actions and own compensation timeline.",
};

const label = key => NAVIGATION[key]?.[1] ?? key.replaceAll("_", " ");
const ASSIGNMENT_VIEWS = new Set(["assignments", "my_assignments"]);

function assignmentsCapabilityEnabled() {
  if (state.role === "client") return false;
  const caps = state.actor?.agencyCapabilities;
  return Boolean(caps && caps.assignmentsEnabled === true);
}

function allowedRoutes(role = state.role) {
  const routes = ROUTE_POLICY[role] || [];
  return routes.filter(key => {
    if (!ASSIGNMENT_VIEWS.has(key)) return true;
    return assignmentsCapabilityEnabled();
  });
}

const badge = status => {
  const value=String(status).toLowerCase();
  const tone=value.includes("flag")||value.includes("high")||value.includes("suspended")?"red":value.includes("review")||value.includes("pending")||value.includes("capacity")||value.includes("invited")?"amber":value.includes("ready")||value.includes("available")||value.includes("clear")||value.includes("clean")||value.includes("delivered")||value.includes("active")?"green":"cyan";
  return `<span class="badge ${tone}">${String(status).replaceAll("_", " ")}</span>`;
};
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));

function loadingState(message="Loading workspace data…") {
  return `<section class="card panel"><div class="empty-state"><strong>${message}</strong><span>Secure workspace is initialising.</span></div></section>`;
}

function errorState() {
  return `<section class="card panel"><div class="empty-state"><strong>Workspace data could not be loaded</strong><span>${state.error?.message ?? "Unknown adapter error."}</span></div></section>`;
}

function setIdentity(actor) {
  if (!actor) return;
  document.querySelector("#actor-name").textContent = actor.name;
  document.querySelector("#actor-avatar").textContent = actor.initials;
  const resolvedRole = actor.role || state.role;
  document.querySelector("#actor-role").textContent = roleLabel(resolvedRole);
  app.dataset.actorRole = resolvedRole;
}

async function loadRoleData(role, actorOverride = null) {
  state.loading = true;
  state.error = null;
  render();
  try {
    const actorPromise = actorOverride ? Promise.resolve(actorOverride) : service.getActor(role);
    const [actor, overview, projects, reviews, messages, files, clients, teamMembers, auditEvents, communicationPolicy] = await Promise.all([
      actorPromise,
      service.getOverview(role),
      service.getProjects(role),
      service.getReviews(role),
      service.getMessages(role),
      service.getFiles(role),
      service.getClients(role),
      service.getTeam(role),
      service.getAuditEvents(role),
      service.getCommunicationPolicies(role),
    ]);
    Object.assign(state, { actor, overview, projects, reviews, messages, files, clients, teamMembers, auditEvents, communicationPolicy });
    setIdentity(actor);
  } catch (error) {
    state.error = error instanceof Error ? error : new Error("Unknown adapter error");
  } finally {
    state.loading = false;
    render();
  }
}

async function setRole(role){
  if(!ROUTE_POLICY[role]) return;
  if(FEATURE_FLAGS.authentication && state.actor && role !== state.actor.role) return;
  state.role=role;
  const allowed=allowedRoutes(role);
  if(!allowed.includes(state.view)) state.view="overview";
  document.querySelectorAll("[data-role]").forEach(button=>button.classList.toggle("active",button.dataset.role===role));
  history.replaceState(null,"",`#${state.view}`);
  await loadRoleData(role);
}

function renderNav(){
  nav.innerHTML=allowedRoutes().map(key=>`<a class="nav-link ${state.view===key?"active":""}" href="#${key}" data-view="${key}"><span aria-hidden="true">${NAVIGATION[key][0]}</span><span>${NAVIGATION[key][1]}</span></a>`).join("");
}

function professionalOverview(){
  const activeCount = state.projects.filter(project => !["delivered", "cancelled"].includes(project.status)).length;
  const latest = state.projects[0]?.updated || "Not available";
  return `<div class="stats-grid"><div class="card stat-card"><small>Assigned projects</small><strong>${state.projects.length}</strong><em>Project scoped</em></div><div class="card stat-card"><small>Active work</small><strong>${activeCount}</strong><em>Assigned delivery</em></div><div class="card stat-card"><small>Messages</small><strong>${state.messages.length}</strong><em>Project scoped</em></div><div class="card stat-card"><small>Files</small><strong>${state.files.length}</strong><em>Available to you</em></div></div><div class="content-grid"><section class="card panel"><div class="panel-header"><div><h2>Assigned work activity</h2><p>Your current Digital Den agency assignments in ${PLATFORM_CONFIG.platformName}.</p></div></div>${projectCards()}</section><aside class="card panel"><div class="panel-header"><div><h2>Team member status</h2><p>Operational information for your assigned work.</p></div></div><div class="list"><div class="list-row"><span><strong>Recent project activity</strong><small>${escapeHtml(latest)}</small></span><span class="pill neutral">Assigned</span></div><div class="list-row"><span><strong>Messages and files</strong><small>Limited to assigned project scopes</small></span><span class="pill neutral">Scoped</span></div><div class="list-row"><span><strong>Compensation connection</strong><small>Real payment execution is not enabled</small></span><span class="pill neutral">Shadow only</span></div></div></aside></div>`;
}

function visibleProjects(){
  const q=state.query.trim().toLowerCase();
  if(!q) return state.projects;
  return state.projects.filter(project=>[project.id,project.title,project.client,project.service].some(value=>String(value).toLowerCase().includes(q)));
}

function projectCards(){
  const list=visibleProjects();
  if(!list.length) return `<div class="empty-state"><strong>No projects are available</strong><span>No project in this authenticated scope matches the current view.</span></div>`;
  return list.map(project=>`<article class="project-card"><div class="project-head"><div><h3>${escapeHtml(project.title)}</h3><div class="meta">${escapeHtml(project.id)} · ${escapeHtml(project.service)}</div></div>${badge(project.status)}</div><div class="progress" aria-label="${project.progress}% complete"><span style="width:${project.progress}%"></span></div><div class="meta">${project.progress}% complete · Updated ${escapeHtml(project.updated)}</div></article>`).join("");
}

function overview(){
  const readyCount = state.projects.filter(x=>["ready_for_delivery","delivered"].includes(x.status)).length;
  if(state.role === "team_member") return professionalOverview();
  if(state.role === "client") {
    return `<div class="stats-grid"><div class="card stat-card"><small>Your projects</small><strong>${state.projects.length}</strong><em>Securely scoped</em></div><div class="card stat-card"><small>Project messages</small><strong>${state.messages.length}</strong><em>Read-only visibility</em></div><div class="card stat-card"><small>Available files</small><strong>${state.files.length}</strong><em>Project scoped</em></div><div class="card stat-card"><small>Ready to deliver</small><strong>${readyCount}</strong><em>Delivery status</em></div></div><div class="content-grid"><section class="card panel"><div class="panel-header"><div><h2>Your Digital Den projects</h2><p>Only projects linked to your verified email are visible.</p></div></div>${projectCards()}</section><aside class="card panel"><div class="panel-header"><div><h2>Secure access</h2><p>Authenticated client workspace.</p></div></div><div class="list"><div class="list-row"><span><strong>Live project data</strong><small>Read from Digital Den API</small></span><span class="pill neutral">On</span></div><div class="list-row"><span><strong>Client session</strong><small>HTTP-only secure session</small></span><span class="pill neutral">Active</span></div><div class="list-row"><span><strong>Write operations</strong><small>Updates and payments</small></span><span class="pill neutral">Off</span></div></div><div class="notice" style="margin-top:14px">Your workspace is connected securely to your Digital Den project records.</div></aside></div>`;
  }

  const flagged = state.overview?.flaggedMessageCount ?? 0;
  return `<div class="stats-grid"><div class="card stat-card"><small>Visible projects</small><strong>${state.projects.length}</strong><em>Role scoped</em></div><div class="card stat-card"><small>Awaiting review</small><strong>${state.role==="manager"?state.reviews.length:"—"}</strong><em>${state.role==="manager"?"Manager action required":"Not in this role"}</em></div><div class="card stat-card"><small>Ready to deliver</small><strong>${readyCount}</strong><em>All checks passed</em></div><div class="card stat-card"><small>Flagged messages</small><strong>${state.role==="manager"?flagged:"—"}</strong><em>Policy controlled</em></div></div><div class="content-grid"><section class="card panel"><div class="panel-header"><div><h2>Current projects</h2><p>Read through the isolated dashboard service.</p></div></div>${projectCards()}</section><aside class="card panel"><div class="panel-header"><div><h2>System state</h2><p>Authenticated production workspace.</p></div></div><div class="list"><div class="list-row"><span><strong>Live API</strong><small>External data connection</small></span><span class="pill neutral">${FEATURE_FLAGS.liveApi?"On":"Off"}</span></div><div class="list-row"><span><strong>Authentication</strong><small>Real session enforcement</small></span><span class="pill neutral">${FEATURE_FLAGS.authentication?"On":"Off"}</span></div><div class="list-row"><span><strong>Mutations</strong><small>Controlled operations</small></span><span class="pill neutral">${FEATURE_FLAGS.projectMutations?"On":"Off"}</span></div></div></aside></div>`;
}

function messagesView(){
  const rows = state.messages.map(message => presentMessageForRole(message, state.role)).map(x=>`<tr><td><strong>${escapeHtml(x.project)}</strong></td><td>${escapeHtml(x.from)}</td><td>${escapeHtml(x.text)}</td><td>${escapeHtml(x.time)}</td><td>${badge(x.state)}</td></tr>`);
  const list = rows.length ? tableView(["Project","Sender","Message","Time","State"], rows, "<h2>Project conversations</h2><p>Messages visible within your authorised project scope.</p>") : "";
  return `<div id="message-capability-slot"></div>${list || `<section class="card panel"><div class="empty-state"><strong>No project messages</strong><span>No messages are currently available in your project scope.</span></div></section>`}`;
}

function filesView(){
  const rows = state.files.map(file => `<tr><td><strong>${escapeHtml(file.name)}</strong></td><td>${escapeHtml(file.project)}</td><td>${badge(file.scan)}</td><td>${badge(file.availability)}</td></tr>`);
  const fallback = tableView(["File","Project","Scan","Availability"], rows, "<h2>Project files</h2><p>Files currently available within your authorised project scope.</p>");
  return `<div id="file-upload-slot"></div><div id="file-security-slot">${fallback}</div>`;
}

const FINANCIAL_LABELS = {
  contractValue:"Client commercial amount", clientPaid:"Client paid", clientOutstanding:"Client outstanding", platformFee:"Agency overhead (internal)",
  professionalAllocation:"Internal assignee compensation", approvedMilestoneEarnings:"Approved delivery milestones", professionalPaid:"Paid compensation",
  professionalOutstanding:"Pending compensation", heldAmount:"Held amount", refundAmount:"Refund status", paymentStatus:"Payment status",
  settlementStatus:"Settlement status", settlementHistory:"Settlement history", invoiceStatus:"Invoice status", nextSettlementDate:"Next settlement date",
  milestones:"Payment milestones", receipts:"Receipts",
};

function financialView(){
  const record = normalizeFinancialRecord();
  const fields = FINANCIAL_FIELDS[state.role] || [];
  const heading = state.role === "manager" ? "Financials" : state.role === "client" ? "Billing" : "Compensation";
  return `<section class="card panel"><div class="panel-header"><div><h2>${heading}</h2><p>Read-only agency financial visibility. Real payment execution remains disabled; shadow settlement only.</p></div><span class="pill neutral">Pending integration</span></div><div class="financial-grid">${fields.map(field => `<div class="financial-field"><small>${FINANCIAL_LABELS[field]}</small><strong>${escapeHtml(financialValue(record[field]))}</strong></div>`).join("")}</div><div class="notice">No payment, refund, invoice or payout action is enabled from this workspace. Digital Den is not a public marketplace payment engine.</div></section>`;
}

function tableView(headers, rows, intro=""){
  const body = rows.length ? rows.join("") : `<tr><td colspan="${headers.length}"><div class="empty-state"><strong>No records available</strong><span>Nothing is currently visible in this authenticated scope.</span></div></td></tr>`;
  return `<section class="card panel">${intro?`<div class="panel-header"><div>${intro}</div></div>`:""}<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div></section>`;
}

function projectOptions(selected = []) {
  return state.projects.map(project => `<option value="${escapeHtml(project.id)}" ${selected.includes(project.id)?"selected":""}>${escapeHtml(project.title)} — ${escapeHtml(project.client)}</option>`).join("");
}

function teamView(){
  const rows = state.teamMembers.length ? state.teamMembers.map(member => `<tr>
    <td><strong>${escapeHtml(member.name)}</strong><small style="display:block">${escapeHtml(member.email)}</small></td>
    <td>${badge(member.status)}</td>
    <td>${member.projectScopes.length}</td>
    <td>${escapeHtml(member.lastAccessAt)}</td>
    <td>${teamMemberActions(member, escapeHtml)}</td>
  </tr>`).join("") : `<tr><td colspan="5"><div class="empty-state"><strong>No team members yet</strong><span>Invite the first delivery team member using the form.</span></div></td></tr>`;

  return `<div class="content-grid"><section class="card panel"><div class="panel-header"><div><h2>Invite team member</h2><p>Create or update a team account and assign project access.</p></div></div>
    <form id="team-form" class="list" style="gap:14px">
      <input id="team-user-id" type="hidden">
      <label><strong>Name</strong><input id="team-name" type="text" maxlength="160" required placeholder="Team member name"></label>
      <label><strong>Email</strong><input id="team-email" type="email" maxlength="320" required placeholder="name@example.com"></label>
      <label><strong>Assigned projects</strong><select id="team-projects" multiple size="6">${projectOptions()}</select><small class="meta">Select one or more projects. Leave empty for no project access.</small></label>
      <label id="team-status-row" hidden><strong>Status</strong><select id="team-status"><option value="invited">Invited</option><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="button primary" type="submit" id="team-save">Save team member</button><button class="button secondary" type="button" id="team-cancel" hidden>Cancel edit</button></div>
      <div id="team-form-status" class="notice" hidden></div>
      ${teamInviteStatusPanel()}
    </form>
  </section><section class="card panel"><div class="panel-header"><div><h2>Team access</h2><p>Manager-controlled identities and project assignments.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Team member</th><th>Status</th><th>Projects</th><th>Last access</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div></section></div>`;
}

function renderView(){
  if(state.loading) return loadingState();
  if(state.error) return errorState();
  if(state.view==="overview") return overview();
  if(state.view==="projects"||state.view==="assigned_work") return `<section class="card panel"><div class="panel-header"><div><h2>${label(state.view)}</h2><p>Authenticated project view.</p></div></div>${projectCards()}</section>`;
  if(state.view==="review") return tableView(["Project","Submission","Owner","Waiting","Priority"],state.reviews.map(x=>`<tr><td><strong>${escapeHtml(x.project)}</strong></td><td>${escapeHtml(x.item)}</td><td>${escapeHtml(x.owner)}</td><td>${escapeHtml(x.age)}</td><td>${badge(x.priority)}</td></tr>`),"<h2>Items requiring manager decision</h2><p>No approval action is enabled yet.</p>");
  if(state.view==="messages") return messagesView();
  if(state.view==="communication_control") return `<div class="content-grid"><section class="card panel"><div class="panel-header"><div><h2>Flagged communications</h2><p>Messages requiring policy review.</p></div></div>${state.messages.filter(x=>x.state==="flagged").map(x=>`<article class="policy-alert"><div><strong>${escapeHtml(x.project)}</strong><p>${escapeHtml(x.text)}</p><small>${escapeHtml(x.time)}</small></div>${badge(x.state)}</article>`).join("")||`<div class="empty-state"><strong>No flagged messages</strong><span>No policy review is currently required.</span></div>`}</section><aside class="card panel"><div class="panel-header"><div><h2>Policy rules</h2></div></div><div class="list">${state.communicationPolicy.map(x=>`<div class="list-row policy-row"><span><strong>${escapeHtml(x.rule)}</strong><small>${escapeHtml(x.action)}</small></span>${badge(x.state)}</div>`).join("")}</div></aside></div>`;
  if(state.view==="files") return filesView();
  if(state.view==="clients") return tableView(["Client","Primary contact","Projects","Status","Last activity"],state.clients.map(x=>`<tr><td><strong>${escapeHtml(x.name)}</strong></td><td>${escapeHtml(x.contact)}</td><td>${x.projects}</td><td>${badge(x.status)}</td><td>${escapeHtml(x.lastActivity)}</td></tr>`),"<h2>Client portfolio</h2><p>Relationship visibility for management.</p>");
  if(state.view==="team") return teamView();
  if(state.view==="audit") return tableView(["Event","Actor","Target","Time"],state.auditEvents.map(x=>`<tr><td><strong>${escapeHtml(x.event)}</strong></td><td>${escapeHtml(x.actor)}</td><td>${escapeHtml(x.target)}</td><td>${escapeHtml(x.time)}</td></tr>`),"<h2>Operational audit trail</h2><p>Read-only derived events.</p>");
  if(["financials","billing"].includes(state.view)) return financialView();
  if(["assignments","my_assignments"].includes(state.view)) {
    return `<section class="card panel"><div class="empty-state"><strong>Loading assignments…</strong><span>Role-scoped assignment compensation module is initialising.</span></div></section>`;
  }
  return `<section class="card panel"><div class="empty-state"><strong>${label(state.view)}</strong><span>This module boundary is reserved for a later integration phase.</span></div></section>`;
}

function render(){
  app.dataset.actorRole=state.role;
  newProjectButton.hidden=!ROLE_CAPABILITIES[state.role]?.startProject;
  renderNav();
  title.textContent=label(state.view);
  description.textContent=descriptions[state.view] ?? "Structured workspace module.";
  content.innerHTML=renderView();
}

function selectedProjectIds() {
  return [...document.querySelectorAll("#team-projects option:checked")].map(option => option.value);
}

function resetTeamForm() {
  document.querySelector("#team-form")?.reset();
  const id = document.querySelector("#team-user-id"); if (id) id.value = "";
  const email = document.querySelector("#team-email"); if (email) email.disabled = false;
  const statusRow = document.querySelector("#team-status-row"); if (statusRow) statusRow.hidden = true;
  const cancel = document.querySelector("#team-cancel"); if (cancel) cancel.hidden = true;
}

async function refreshTeam() {
  state.teamMembers = await service.getTeam("manager");
  render();
}

attachTeamInvitationActions({ content, state, service, render, escapeHtml });

content.addEventListener("click", event => {
  const button = event.target.closest("[data-team-edit]");
  if (button) {
    const member = state.teamMembers.find(item => item.id === button.dataset.teamEdit);
    if (!member) return;
    document.querySelector("#team-user-id").value = member.id;
    document.querySelector("#team-name").value = member.name;
    document.querySelector("#team-email").value = member.email;
    document.querySelector("#team-email").disabled = true;
    document.querySelector("#team-status").value = member.status;
    document.querySelector("#team-status-row").hidden = false;
    document.querySelector("#team-cancel").hidden = false;
    document.querySelectorAll("#team-projects option").forEach(option => { option.selected = member.projectScopes.includes(option.value); });
  }
  if (event.target.closest("#team-cancel")) resetTeamForm();
});

content.addEventListener("submit", async event => {
  if (event.target.id !== "team-form") return;
  event.preventDefault();
  const statusBox = document.querySelector("#team-form-status");
  const save = document.querySelector("#team-save");
  save.disabled = true;
  statusBox.hidden = false;
  statusBox.textContent = "Saving team access…";
  try {
    const userId = document.querySelector("#team-user-id").value;
    let result;
    if (userId) {
      result = await service.updateTeamMember({
        userId,
        name: document.querySelector("#team-name").value,
        status: document.querySelector("#team-status").value,
        projectScopes: selectedProjectIds(),
      });
    } else {
      result = await service.createTeamMember({
        name: document.querySelector("#team-name").value,
        email: document.querySelector("#team-email").value,
        projectScopes: selectedProjectIds(),
      });
    }
    statusBox.textContent = result.invitationSent
      ? "Team access saved and invitation sent successfully."
      : "Team access saved. Invitation delivery was not confirmed.";
    resetTeamForm();
    await refreshTeam();
  } catch (error) {
    statusBox.textContent = error.message;
  } finally {
    save.disabled = false;
  }
});

window.addEventListener("hashchange",()=>{const key=location.hash.slice(1)||"overview";if(allowedRoutes().includes(key)){state.view=key;render();}else if(ASSIGNMENT_VIEWS.has(key)){state.view="overview";history.replaceState(null,"",`#overview`);render();}});
nav.addEventListener("click",event=>{const link=event.target.closest("[data-view]");if(link){state.view=link.dataset.view;app.classList.remove("menu-open");render();}});
document.querySelectorAll("[data-role]").forEach(button=>button.addEventListener("click",()=>setRole(button.dataset.role)));
search.addEventListener("input",()=>{state.query=search.value;render();});
document.querySelector("#mobile-menu-button").addEventListener("click",event=>{const open=app.classList.toggle("menu-open");event.currentTarget.setAttribute("aria-expanded",String(open));});

async function initialise() {
  if (!FEATURE_FLAGS.authentication) {
    await setRole("manager");
    return;
  }

  rolePreview.hidden = true;
  app.classList.add("authenticated-workspace");
  try {
    const actor = await service.getActor();
    if (!ROUTE_POLICY[actor.role]) throw new Error("Unsupported authenticated role");
    state.actor = actor;
    state.role = actor.role;
    environmentPill.textContent = actor.role === "manager" ? "Manager Workspace" : actor.role === "team_member" ? "Team Workspace" : "Client Workspace";
    if (!allowedRoutes(state.role).includes(state.view)) state.view = "overview";
    history.replaceState(null, "",`#${state.view}`);
    await loadRoleData(state.role, actor);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication required";
    if (message.toLowerCase().includes("authentication required")) {
      location.replace("../workspace-access.html");
      return;
    }
    state.error = error instanceof Error ? error : new Error("Unable to initialise authenticated workspace");
    state.loading = false;
    render();
  }
}

initialise();
