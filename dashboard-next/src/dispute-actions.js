const API_BASE = globalThis.location?.origin ?? "";
const INTENT = "dispute-case-management";
const REMEDIES = [
  ["in_scope_correction", "1. In-scope correction at no cost"],
  ["replacement_delivery", "2. Replacement delivery or reassignment"],
  ["agreed_extension", "3. Agreed deadline extension"],
  ["fair_price_reduction", "4. Fair price reduction"],
  ["partial_refund", "5. Partial refund"],
  ["full_refund_and_termination", "6. Full refund and termination"],
];
const REASONS = [
  ["scope_dispute", "Contract scope"], ["quality_dispute", "Quality"],
  ["delivery_delay", "Delivery delay"], ["revision_dispute", "Revision request"],
  ["payment_dispute", "Payment or contractor share"], ["conduct_dispute", "Conduct"], ["other", "Other"],
];
let busy = false;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;",
  }[char]));
}
function money(value) { return `£${Number(value || 0).toFixed(2)}`; }
function dateLabel(value) { return value ? new Date(value).toLocaleString() : "—"; }
function badge(value) { return `<span class="badge cyan">${escapeHtml(String(value || "pending").replaceAll("_", " "))}</span>`; }

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include", cache: "no-store", ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json", "X-Digital-Den-Intent": INTENT } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `Dispute request failed (${response.status})`;
    const correlationId = response.headers.get("x-correlation-id") || payload?.error?.correlationId;
    throw new Error(correlationId ? `${message}; correlationId=${correlationId}` : message);
  }
  return payload;
}

async function loadContext() {
  const [sessionPayload, projectsPayload, disputePayload] = await Promise.all([
    requestJson("/api/digital-den/session"),
    requestJson("/api/digital-den/projects"),
    requestJson("/api/digital-den/disputes/manage"),
  ]);
  return {
    actor: sessionPayload.actor,
    projects: projectsPayload.projects || [],
    disputes: disputePayload.disputes || [],
  };
}

function createCaseForm(context) {
  const projectOptions = context.projects.map(project =>
    `<option value="${escapeHtml(project.projectId)}">${escapeHtml(project.title || project.projectId)}</option>`
  ).join("");
  const managerFields = context.actor.role === "manager" ? `
    <label><strong>Contractor actor ID</strong><input name="contractorActorId" placeholder="team_member:…"></label>
    <label><strong>Contractor type</strong><select name="contractorType"><option value="unassigned">Unassigned</option><option value="employee">Employee</option><option value="contractor">Contractor</option></select></label>
    <label><strong>Contract scope summary</strong><textarea name="scopeSummary" rows="3"></textarea></label>
    <label><strong>Quality criteria</strong><textarea name="qualityCriteria" rows="3"></textarea></label>
    <label><strong>Delivery deadline</strong><input name="deliveryDeadline" type="date"></label>` : "";
  return `<section class="card panel" style="margin-bottom:18px">
    <div class="panel-header"><div><h2>Open a dispute case</h2><p>Opening a case immediately pauses automatic completion, contractor payment release and project timeouts.</p></div></div>
    <form id="dispute-create-form" class="list" style="gap:12px">
      <label><strong>Project</strong><select name="projectId" required>${projectOptions}</select></label>
      <label><strong>Reason</strong><select name="reasonCode" required>${REASONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join("")}</select></label>
      <label><strong>Summary</strong><textarea name="summary" rows="4" maxlength="3000" required placeholder="Explain the issue factually."></textarea></label>
      <label><strong>Your claim or requested outcome</strong><textarea name="claim" rows="4" maxlength="5000"></textarea></label>
      ${managerFields}
      <div><button class="button primary" type="submit">Open case and apply holds</button></div>
      <div id="dispute-create-status" class="notice" hidden></div>
    </form>
  </section>`;
}

function evidenceRows(items) {
  if (!items?.length) return `<div class="empty-state"><strong>No evidence registered</strong><span>The case manager can add references to files, messages, deliveries and revisions.</span></div>`;
  return `<div class="list">${items.map(item => `<div class="list-row"><span><strong>${escapeHtml(item.evidenceType)}</strong><small>${escapeHtml(item.description || item.referenceId)}</small></span><small>${dateLabel(item.addedAt)}</small></div>`).join("")}</div>`;
}

function responseRows(items) {
  if (!items?.length) return `<div class="empty-state"><strong>No party response yet</strong><span>The proposed remedy remains under review.</span></div>`;
  return `<div class="list">${items.map(item => `<div class="list-row"><span><strong>${escapeHtml(item.party)} — ${escapeHtml(item.decision)}</strong><small>${escapeHtml(item.statement)}</small></span><small>${dateLabel(item.submittedAt)}</small></div>`).join("")}</div>`;
}

function settlementView(dispute, role) {
  const s = dispute.settlement || {};
  if (role === "manager") return `<div class="stats-grid">
    <div class="card stat-card"><small>Client paid</small><strong>${money(s.amountPaidByClient)}</strong></div>
    <div class="card stat-card"><small>Approved work</small><strong>${money(s.approvedWorkValue)}</strong></div>
    <div class="card stat-card"><small>Refund</small><strong>${money(s.refundAmount)}</strong></div>
    <div class="card stat-card"><small>Contractor final share</small><strong>${money(s.contractorFinalShare)}</strong></div>
  </div>`;
  if (role === "client") return `<div class="stats-grid">
    <div class="card stat-card"><small>Amount paid</small><strong>${money(s.amountPaidByClient)}</strong></div>
    <div class="card stat-card"><small>Price reduction</small><strong>${money(s.priceReduction)}</strong></div>
    <div class="card stat-card"><small>Refund</small><strong>${money(s.refundAmount)}</strong></div>
    <div class="card stat-card"><small>Final client cost</small><strong>${money(s.clientFinalCost)}</strong></div>
  </div>`;
  return `<div class="stats-grid">
    <div class="card stat-card"><small>Approved work</small><strong>${money(s.approvedWorkValue)}</strong></div>
    <div class="card stat-card"><small>Gross share</small><strong>${money(s.contractorGrossShare)}</strong></div>
    <div class="card stat-card"><small>Deductions</small><strong>${money(s.contractorDeductions)}</strong></div>
    <div class="card stat-card"><small>Final share</small><strong>${money(s.contractorFinalShare)}</strong></div>
  </div>`;
}

function partyResponseForm(dispute) {
  if (["resolved", "closed"].includes(dispute.status)) return "";
  return `<form class="dispute-response-form list" data-case-id="${escapeHtml(dispute.caseId)}" style="gap:10px;margin-top:14px">
    <label><strong>Response to proposed remedy</strong><select name="decision"><option value="accepted">Accept</option><option value="rejected">Reject</option><option value="counter_proposed">Counter-propose</option></select></label>
    <label><strong>Statement</strong><textarea name="statement" rows="3" maxlength="3000" required></textarea></label>
    <button class="button primary" type="submit">Submit response</button>
    <span class="notice" data-status hidden></span>
  </form>`;
}

function managerControls(dispute) {
  return `<div class="content-grid" style="margin-top:16px">
    <section class="card panel"><h3>Case assignment</h3>
      <form class="dispute-action-form list" data-action="assign_case_manager" data-case-id="${escapeHtml(dispute.caseId)}">
        <label><strong>Case manager actor ID</strong><input name="caseManagerActorId" value="${escapeHtml(dispute.caseManagerActorId)}" placeholder="Leave blank to assign yourself"></label>
        <button class="button secondary" type="submit">Assign case manager</button><span class="notice" data-status hidden></span>
      </form>
      <form class="dispute-action-form list" data-action="assign_parties" data-case-id="${escapeHtml(dispute.caseId)}" style="margin-top:12px">
        <label><strong>Contractor actor ID</strong><input name="contractorActorId" value="${escapeHtml(dispute.contractorActorId)}"></label>
        <label><strong>Type</strong><select name="contractorType"><option value="unassigned">Unassigned</option><option value="employee">Employee</option><option value="contractor">Contractor</option></select></label>
        <button class="button secondary" type="submit">Save contractor party</button><span class="notice" data-status hidden></span>
      </form>
    </section>
    <section class="card panel"><h3>Evidence register</h3>
      <form class="dispute-action-form list" data-action="add_evidence" data-case-id="${escapeHtml(dispute.caseId)}">
        <label><strong>Evidence type</strong><select name="evidenceType"><option value="contract">Contract/scope</option><option value="file">File/version</option><option value="message">Message</option><option value="revision">Revision request</option><option value="delivery">Delivery</option><option value="payment">Payment record</option></select></label>
        <label><strong>Reference ID</strong><input name="referenceId" required></label>
        <label><strong>Description</strong><textarea name="description" rows="2"></textarea></label>
        <button class="button secondary" type="submit">Add evidence</button><span class="notice" data-status hidden></span>
      </form>
    </section>
    <section class="card panel"><h3>Work assessment</h3>
      <form class="dispute-action-form list" data-action="assess_work" data-case-id="${escapeHtml(dispute.caseId)}">
        <label><strong>Completion %</strong><input name="completionPercent" type="number" min="0" max="100" value="${escapeHtml(dispute.workAssessment?.completionPercent || 0)}"></label>
        <label><strong>Quality score</strong><input name="qualityScore" type="number" min="0" max="100" value="${escapeHtml(dispute.workAssessment?.qualityScore || 0)}"></label>
        <label><strong>Approved work value</strong><input name="approvedWorkValue" type="number" min="0" step="0.01" value="${escapeHtml(dispute.workAssessment?.approvedWorkValue || 0)}"></label>
        <label><strong>Assessment note</strong><textarea name="assessmentNote" rows="3"></textarea></label>
        <button class="button secondary" type="submit">Save assessment</button><span class="notice" data-status hidden></span>
      </form>
    </section>
    <section class="card panel"><h3>Proposed remedy</h3>
      <form class="dispute-action-form list" data-action="propose_remedy" data-case-id="${escapeHtml(dispute.caseId)}">
        <label><strong>Remedy</strong><select name="remedy">${REMEDIES.map(([v,l])=>`<option value="${v}" ${dispute.proposedRemedy===v?"selected":""}>${l}</option>`).join("")}</select></label>
        <label><strong>Rationale</strong><textarea name="rationale" rows="3" required>${escapeHtml(dispute.remedyRationale)}</textarea></label>
        <label><strong>Why higher-priority remedies are unsuitable</strong><textarea name="higherPriorityRemediesRejectedBecause" rows="3">${escapeHtml(dispute.higherPriorityRemediesRejectedBecause)}</textarea></label>
        <label><strong>Party response deadline</strong><input name="responseDeadline" type="datetime-local"></label>
        <button class="button secondary" type="submit">Issue proposed remedy</button><span class="notice" data-status hidden></span>
      </form>
    </section>
    <section class="card panel"><h3>Shadow settlement</h3>
      <form class="dispute-action-form list" data-action="calculate_settlement" data-case-id="${escapeHtml(dispute.caseId)}">
        <label><strong>Approved work value</strong><input name="approvedWorkValue" type="number" min="0" step="0.01"></label>
        <label><strong>Price reduction</strong><input name="priceReduction" type="number" min="0" step="0.01"></label>
        <label><strong>Refund amount</strong><input name="refundAmount" type="number" min="0" step="0.01"></label>
        <label><strong>Replacement cost</strong><input name="replacementCost" type="number" min="0" step="0.01"></label>
        <label><strong>Contractor deductions</strong><input name="contractorDeductions" type="number" min="0" step="0.01"></label>
        <button class="button secondary" type="submit">Calculate without moving money</button><span class="notice" data-status hidden></span>
      </form>
    </section>
    <section class="card panel"><h3>Final decision</h3>
      <form class="dispute-action-form list" data-action="resolve" data-case-id="${escapeHtml(dispute.caseId)}">
        <label><strong>Company decision</strong><textarea name="finalDecision" rows="5" maxlength="7000" required>${escapeHtml(dispute.finalDecision)}</textarea></label>
        <label><strong>Final refund</strong><input name="refundAmount" type="number" min="0" step="0.01"></label>
        <label><strong>Final contractor deductions</strong><input name="contractorDeductions" type="number" min="0" step="0.01"></label>
        <button class="button primary" type="submit">Resolve and release operational holds</button><span class="notice" data-status hidden></span>
      </form>
      ${dispute.status === "resolved" ? `<button class="button secondary dispute-close" data-case-id="${escapeHtml(dispute.caseId)}" type="button">Close case</button>` : ""}
    </section>
  </div>`;
}

function caseCard(dispute, role) {
  const holdsActive = !["resolved", "closed"].includes(dispute.status);
  const claim = role === "manager"
    ? `<p><strong>Client claim:</strong> ${escapeHtml(dispute.clientClaim || "—")}</p><p><strong>Contractor claim:</strong> ${escapeHtml(dispute.contractorClaim || "—")}</p>`
    : `<p><strong>Your claim:</strong> ${escapeHtml(role === "client" ? dispute.clientClaim : dispute.contractorClaim || "—")}</p>`;
  return `<article class="card panel dispute-case" data-case-id="${escapeHtml(dispute.caseId)}" style="margin-bottom:18px">
    <div class="panel-header"><div><p class="eyebrow">${escapeHtml(dispute.caseNumber)}</p><h2>${escapeHtml(dispute.projectTitle)}</h2><p>${escapeHtml(dispute.summary)}</p></div>${badge(dispute.status)}</div>
    <div class="stats-grid">
      <div class="card stat-card"><small>Completion hold</small><strong>${holdsActive ? "ON" : "Released"}</strong></div>
      <div class="card stat-card"><small>Contractor payment</small><strong>${holdsActive ? "HELD" : "Shadow calculated"}</strong></div>
      <div class="card stat-card"><small>Timeout</small><strong>${holdsActive ? "PAUSED" : "Active"}</strong></div>
      <div class="card stat-card"><small>Response deadline</small><strong style="font-size:14px">${dateLabel(dispute.responseDeadline)}</strong></div>
    </div>
    <div class="content-grid" style="margin-top:16px">
      <section class="card panel"><h3>Contract and claims</h3><p><strong>Reason:</strong> ${escapeHtml(dispute.reasonCode.replaceAll("_", " "))}</p>${claim}<p><strong>Scope:</strong> ${escapeHtml(dispute.contractSnapshot?.scopeSummary || "Not recorded")}</p><p><strong>Quality criteria:</strong> ${escapeHtml(dispute.contractSnapshot?.qualityCriteria || "Not recorded")}</p></section>
      <section class="card panel"><h3>Current remedy</h3><p><strong>${escapeHtml((dispute.proposedRemedy || "Not proposed").replaceAll("_", " "))}</strong></p><p>${escapeHtml(dispute.remedyRationale || "No remedy has been proposed yet.")}</p><p><strong>Final decision:</strong> ${escapeHtml(dispute.finalDecision || "Pending")}</p></section>
    </div>
    <section class="card panel" style="margin-top:16px"><h3>Settlement view</h3>${settlementView(dispute, role)}<div class="notice">Financial values are shadow calculations only. No refund or contractor payout is executed from this screen.</div></section>
    <div class="content-grid" style="margin-top:16px"><section class="card panel"><h3>Evidence</h3>${evidenceRows(dispute.evidence)}</section><section class="card panel"><h3>Party responses</h3>${responseRows(dispute.responses)}</section></div>
    ${role === "manager" ? managerControls(dispute) : partyResponseForm(dispute)}
  </article>`;
}

function pageMarkup(context) {
  const list = context.disputes.length
    ? context.disputes.map(item => caseCard(item, context.actor.role)).join("")
    : `<section class="card panel"><div class="empty-state"><strong>No dispute cases</strong><span>No case is currently visible in this authenticated scope.</span></div></section>`;
  return `${createCaseForm(context)}<section id="dispute-list">${list}</section>`;
}

async function mutate(form, extra = {}) {
  const data = Object.fromEntries(new FormData(form).entries());
  for (const key of ["completionPercent","qualityScore","approvedWorkValue","priceReduction","refundAmount","replacementCost","contractorDeductions"]) {
    if (data[key] !== undefined && data[key] !== "") data[key] = Number(data[key]);
  }
  if (data.responseDeadline) data.responseDeadline = new Date(data.responseDeadline).toISOString();
  return requestJson("/api/digital-den/disputes/manage", { method: "PATCH", body: JSON.stringify({ ...data, ...extra }) });
}

function bind(content) {
  content.querySelector("#dispute-create-form")?.addEventListener("submit", async event => {
    event.preventDefault(); const form = event.currentTarget; const status = form.querySelector("#dispute-create-status");
    status.hidden = false; status.textContent = "Opening case and applying holds…";
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      await requestJson("/api/digital-den/disputes/manage", { method: "POST", body: JSON.stringify(data) });
      status.textContent = "Case opened. Completion, payout and timeout holds are active."; await renderPage(true);
    } catch (error) { status.textContent = error.message; }
  });

  content.querySelectorAll(".dispute-action-form").forEach(form => form.addEventListener("submit", async event => {
    event.preventDefault(); const status = form.querySelector("[data-status]"); status.hidden = false; status.textContent = "Saving case action…";
    try { await mutate(form, { caseId: form.dataset.caseId, action: form.dataset.action }); status.textContent = "Case updated and recorded in the audit trail."; await renderPage(true); }
    catch (error) { status.textContent = error.message; }
  }));

  content.querySelectorAll(".dispute-response-form").forEach(form => form.addEventListener("submit", async event => {
    event.preventDefault(); const status = form.querySelector("[data-status]"); status.hidden = false; status.textContent = "Submitting response…";
    try { await mutate(form, { caseId: form.dataset.caseId, action: "respond" }); status.textContent = "Response submitted."; await renderPage(true); }
    catch (error) { status.textContent = error.message; }
  }));

  content.querySelectorAll(".dispute-close").forEach(button => button.addEventListener("click", async () => {
    button.disabled = true;
    try { await requestJson("/api/digital-den/disputes/manage", { method: "PATCH", body: JSON.stringify({ caseId: button.dataset.caseId, action: "close" }) }); await renderPage(true); }
    finally { button.disabled = false; }
  }));
}

async function renderPage(force = false) {
  if (location.hash !== "#disputes" || busy) return;
  const content = document.querySelector("#workspace-content");
  if (!content) return;
  if (!force && content.dataset.disputesReady === "true") return;
  busy = true; content.dataset.disputesReady = "true"; content.innerHTML = `<section class="card panel"><div class="empty-state"><strong>Loading dispute cases…</strong><span>Applying role-based visibility.</span></div></section>`;
  try { const context = await loadContext(); content.innerHTML = pageMarkup(context); bind(content); }
  catch (error) { content.innerHTML = `<section class="card panel"><div class="empty-state"><strong>Disputes unavailable</strong><span>${escapeHtml(error.message)}</span></div></section>`; }
  finally { busy = false; }
}

window.addEventListener("hashchange", () => { const content = document.querySelector("#workspace-content"); if (content) delete content.dataset.disputesReady; renderPage(); });
new MutationObserver(() => renderPage()).observe(document.documentElement, { childList: true, subtree: true });
renderPage();
