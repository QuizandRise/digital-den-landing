import { FEATURE_FLAGS, ROUTE_POLICY, NAVIGATION } from "./config.js";
import { previewActors, projects, reviews, messages, files, clients, teamMembers, auditEvents, communicationPolicy } from "./mock-data.js";

const state = { role: "manager", view: location.hash.slice(1) || "overview", query: "" };
const app = document.querySelector("#app");
const nav = document.querySelector("#primary-nav");
const content = document.querySelector("#workspace-content");
const title = document.querySelector("#view-title");
const description = document.querySelector("#view-description");
const search = document.querySelector("#global-search");

const descriptions = {
  overview:"Role-scoped project delivery visibility.", projects:"Projects visible within the current actor scope.",
  review:"Manager-controlled approval queue.", messages:"Authorised project conversations.", communication_control:"Communication policy, moderation rules and flagged-item visibility.",
  clients:"Client relationships, project load and recent activity.", team:"Team capacity and assignment visibility.", audit:"Read-only operational history.",
  assigned_work:"Workstreams assigned to this team member.", files:"Scanned project files available to this role.", billing:"Payment-state placeholder for future central integration.",
};

const label = key => NAVIGATION[key]?.[1] ?? key.replaceAll("_", " ");
const badge = status => {
  const value=String(status).toLowerCase();
  const tone=value.includes("flag")||value.includes("high")?"red":value.includes("review")||value.includes("capacity")?"amber":value.includes("ready")||value.includes("available")||value.includes("clear")?"green":"cyan";
  return `<span class="badge ${tone}">${String(status).replaceAll("_", " ")}</span>`;
};

function setRole(role){
  if(!ROUTE_POLICY[role]) return;
  state.role=role;
  const allowed=ROUTE_POLICY[role];
  if(!allowed.includes(state.view)) state.view="overview";
  const actor=previewActors[role];
  document.querySelector("#actor-name").textContent=actor.name;
  document.querySelector("#actor-avatar").textContent=actor.initials;
  document.querySelector("#actor-role").textContent=actor.label;
  document.querySelectorAll("[data-role]").forEach(button=>button.classList.toggle("active",button.dataset.role===role));
  history.replaceState(null,"",`#${state.view}`);
  render();
}

function renderNav(){
  nav.innerHTML=ROUTE_POLICY[state.role].map(key=>`<a class="nav-link ${state.view===key?"active":""}" href="#${key}" data-view="${key}"><span aria-hidden="true">${NAVIGATION[key][0]}</span><span>${NAVIGATION[key][1]}</span></a>`).join("");
}

function visibleProjects(){
  const q=state.query.trim().toLowerCase();
  if(!q) return projects;
  return projects.filter(project=>[project.id,project.title,project.client,project.service].some(value=>value.toLowerCase().includes(q)));
}

function projectCards(){
  const list=visibleProjects();
  if(!list.length) return `<div class="empty-state"><strong>No matching projects</strong><span>Try a different search term.</span></div>`;
  return list.map(project=>`<article class="project-card"><div class="project-head"><div><h3>${project.title}</h3><div class="meta">${project.id} · ${project.client} · ${project.service}</div></div>${badge(project.status)}</div><div class="progress" aria-label="${project.progress}% complete"><span style="width:${project.progress}%"></span></div><div class="meta">${project.progress}% complete · Updated ${project.updated}</div></article>`).join("");
}

function overview(){
  const scoped = state.role==="team_member" ? 2 : projects.length;
  return `<div class="stats-grid"><div class="card stat-card"><small>Visible projects</small><strong>${scoped}</strong><em>Role scoped</em></div><div class="card stat-card"><small>Awaiting review</small><strong>${state.role==="manager"?reviews.length:"—"}</strong><em>${state.role==="manager"?"Manager action required":"Not in this role"}</em></div><div class="card stat-card"><small>Ready to deliver</small><strong>1</strong><em>All checks passed</em></div><div class="card stat-card"><small>Flagged messages</small><strong>${state.role==="manager"?1:"—"}</strong><em>Policy controlled</em></div></div><div class="content-grid"><section class="card panel"><div class="panel-header"><div><h2>Current projects</h2><p>Preview data through an isolated adapter.</p></div></div>${projectCards()}</section><aside class="card panel"><div class="panel-header"><div><h2>System state</h2><p>Production capabilities remain disabled.</p></div></div><div class="list"><div class="list-row"><span><strong>Live API</strong><small>External data connection</small></span><span class="pill neutral">${FEATURE_FLAGS.liveApi?"On":"Off"}</span></div><div class="list-row"><span><strong>Authentication</strong><small>Real session enforcement</small></span><span class="pill neutral">${FEATURE_FLAGS.authentication?"On":"Off"}</span></div><div class="list-row"><span><strong>Mutations</strong><small>Write operations</small></span><span class="pill neutral">${FEATURE_FLAGS.projectMutations?"On":"Off"}</span></div></div><div class="notice" style="margin-top:14px">This workspace is structurally ready for staged read-only integration, but it cannot modify production data.</div></aside></div>`;
}

function tableView(headers, rows, intro=""){
  return `<section class="card panel">${intro?`<div class="panel-header"><div>${intro}</div></div>`:""}<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div></section>`;
}

function renderView(){
  if(state.view==="overview") return overview();
  if(state.view==="projects"||state.view==="assigned_work") return `<section class="card panel"><div class="panel-header"><div><h2>${label(state.view)}</h2><p>Read-only structured preview.</p></div></div>${projectCards()}</section>`;
  if(state.view==="review") return tableView(["Project","Submission","Owner","Waiting","Priority"],reviews.map(x=>`<tr><td><strong>${x.project}</strong></td><td>${x.item}</td><td>${x.owner}</td><td>${x.age}</td><td>${badge(x.priority)}</td></tr>`),"<h2>Items requiring manager decision</h2><p>No approval action is enabled in preview.</p>");
  if(state.view==="messages") return tableView(["Project","Sender","Message","Time","State"],messages.map(x=>`<tr><td><strong>${x.project}</strong></td><td>${x.from}</td><td>${x.text}</td><td>${x.time}</td><td>${badge(x.state)}</td></tr>`),"<h2>Project conversations</h2><p>Read-only message visibility for the current role.</p>");
  if(state.view==="communication_control") return `<div class="content-grid"><section class="card panel"><div class="panel-header"><div><h2>Flagged communications</h2><p>Messages requiring policy review.</p></div></div>${messages.filter(x=>x.state==="flagged").map(x=>`<article class="policy-alert"><div><strong>${x.project}</strong><p>${x.text}</p><small>${x.time}</small></div>${badge(x.state)}</article>`).join("")}</section><aside class="card panel"><div class="panel-header"><div><h2>Policy rules</h2><p>Preview-only enforcement model.</p></div></div><div class="list">${communicationPolicy.map(x=>`<div class="list-row policy-row"><span><strong>${x.rule}</strong><small>${x.action}</small></span>${badge(x.state)}</div>`).join("")}</div></aside></div>`;
  if(state.view==="files") return tableView(["File","Project","Scan","Availability"],files.map(x=>`<tr><td><strong>${x.name}</strong></td><td>${x.project}</td><td>${badge(x.scan)}</td><td>${badge(x.availability)}</td></tr>`),"<h2>Secure project files</h2><p>Downloads and uploads remain disabled.</p>");
  if(state.view==="clients") return tableView(["Client","Primary contact","Projects","Status","Last activity"],clients.map(x=>`<tr><td><strong>${x.name}</strong></td><td>${x.contact}</td><td>${x.projects}</td><td>${badge(x.status)}</td><td>${x.lastActivity}</td></tr>`),"<h2>Client portfolio</h2><p>Relationship visibility for management.</p>");
  if(state.view==="team") return tableView(["Team","Specialism","Active work","Capacity","State"],teamMembers.map(x=>`<tr><td><strong>${x.name}</strong></td><td>${x.role}</td><td>${x.active}</td><td>${x.capacity}</td><td>${badge(x.state)}</td></tr>`),"<h2>Delivery capacity</h2><p>Assignment and workload visibility.</p>");
  if(state.view==="audit") return tableView(["Event","Actor","Target","Time"],auditEvents.map(x=>`<tr><td><strong>${x.event}</strong></td><td>${x.actor}</td><td>${x.target}</td><td>${x.time}</td></tr>`),"<h2>Operational audit trail</h2><p>Immutable event integration will be added later.</p>");
  if(state.view==="billing") return `<section class="card panel"><div class="empty-state"><strong>Central billing integration is not enabled</strong><span>Future payment state will be read from the shared ecosystem payment platform.</span></div></section>`;
  return `<section class="card panel"><div class="empty-state"><strong>${label(state.view)}</strong><span>This module boundary is reserved for a later integration phase.</span></div></section>`;
}

function render(){
  renderNav();
  title.textContent=label(state.view);
  description.textContent=descriptions[state.view] ?? "Structured workspace module.";
  content.innerHTML=renderView();
}

window.addEventListener("hashchange",()=>{const key=location.hash.slice(1)||"overview";if(ROUTE_POLICY[state.role].includes(key)){state.view=key;render();}});
nav.addEventListener("click",event=>{const link=event.target.closest("[data-view]");if(link){state.view=link.dataset.view;app.classList.remove("menu-open");render();}});
document.querySelectorAll("[data-role]").forEach(button=>button.addEventListener("click",()=>setRole(button.dataset.role)));
search.addEventListener("input",()=>{state.query=search.value;render();});
document.querySelector("#mobile-menu-button").addEventListener("click",event=>{const open=app.classList.toggle("menu-open");event.currentTarget.setAttribute("aria-expanded",String(open));});

setRole("manager");
