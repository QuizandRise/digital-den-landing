const API_BASE = globalThis.location?.origin ?? "";
const INTENT = "assignment-compensation";
const ASSIGNMENT_HASHES = new Set(["#assignments", "#my_assignments"]);

let busy = false;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char]));
}

function money(value, currency = "GBP") {
  const amount = Number(value || 0).toFixed(2);
  return `${escapeHtml(currency)} ${amount}`;
}

function dateLabel(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

function badge(value) {
  const text = String(value || "pending").replaceAll("_", " ");
  const tone = /held|declined|cancelled/.test(String(value)) ? "red"
    : /offered|submitted|under_review|payable/.test(String(value)) ? "amber"
      : /accepted|approved|in_progress|paid/.test(String(value)) ? "green" : "cyan";
  return `<span class="badge ${tone}">${escapeHtml(text)}</span>`;
}

function idempotencyKey(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? {
        "Content-Type": "application/json",
        "X-Digital-Den-Intent": INTENT,
      } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `Assignment request failed (${response.status})`;
    const correlationId = response.headers.get("x-correlation-id") || payload?.error?.correlationId;
    const error = new Error(correlationId ? `${message}; correlationId=${correlationId}` : message);
    error.status = response.status;
    error.code = payload?.error?.code;
    throw error;
  }
  return payload;
}

async function loadContext() {
  const [sessionPayload, projectsPayload, teamPayload, assignmentPayload] = await Promise.all([
    requestJson("/api/digital-den/session"),
    requestJson("/api/digital-den/projects"),
    requestJson("/api/digital-den/team/manage").catch(error => {
      if (error.status === 403 || error.status === 404) return { team: [] };
      throw error;
    }),
    requestJson("/api/digital-den/assignments/manage"),
  ]);
  return {
    actor: sessionPayload.actor,
    projects: projectsPayload.projects || [],
    team: teamPayload.team || [],
    assignments: assignmentPayload.assignments || [],
    paymentExecution: assignmentPayload.paymentExecution || "disabled_shadow_obligation_only",
  };
}

function createForm(context) {
  if (context.actor.role !== "manager") return "";
  const projectOptions = context.projects.map(project =>
    `<option value="${escapeHtml(project.projectId)}">${escapeHtml(project.title || project.projectId)}</option>`
  ).join("");
  const memberOptions = context.team.map(member =>
    `<option value="${escapeHtml(member.userId)}">${escapeHtml(member.name || member.email)} (${escapeHtml(member.email)})</option>`
  ).join("");
  return `<section class="card panel" style="margin-bottom:18px">
    <div class="panel-header"><div><h2>Create assignment</h2><p>Set scope, deadline, revision allowance and offered compensation for one Team Member. Real payment execution remains disabled.</p></div></div>
    <form id="assignment-create-form" class="list" style="gap:12px">
      <label><strong>Project</strong><select name="projectId" required>${projectOptions || "<option value=''>No projects available</option>"}</select></label>
      <label><strong>Team Member</strong><select name="teamMemberId" required>${memberOptions || "<option value=''>No team members available</option>"}</select></label>
      <label><strong>Title</strong><input name="title" required maxlength="240" placeholder="Assignment title"></label>
      <label><strong>Scope</strong><textarea name="scope" rows="4" maxlength="8000" required placeholder="What the Team Member must deliver"></textarea></label>
      <label><strong>Deliverables</strong><textarea name="deliverables" rows="3" maxlength="8000" placeholder="Concrete outputs"></textarea></label>
      <label><strong>Deadline</strong><input name="deadline" type="datetime-local"></label>
      <label><strong>Revision allowance</strong><input name="revisionAllowance" type="number" min="0" max="100" value="1"></label>
      <label><strong>Currency</strong><input name="currency" value="GBP" maxlength="3" required></label>
      <label><strong>Offered compensation</strong><input name="offeredCompensation" type="number" min="0" step="0.01" required></label>
      <div><button class="button primary" type="submit">Create assignment offer</button></div>
      <div id="assignment-create-status" class="notice" role="status" hidden></div>
    </form>
  </section>`;
}

function managerActions(assignment) {
  return `
    <form class="assignment-action-form list" style="gap:10px;margin-top:12px" data-assignment-id="${escapeHtml(assignment.assignmentId)}" data-version="${escapeHtml(assignment.version)}" data-action="mark_under_review">
      <button class="button secondary" type="submit">Mark under review</button>
    </form>
    <form class="assignment-action-form list" style="gap:10px;margin-top:12px" data-assignment-id="${escapeHtml(assignment.assignmentId)}" data-version="${escapeHtml(assignment.version)}" data-action="approve">
      <button class="button primary" type="submit">Approve work</button>
    </form>
    <form class="assignment-action-form list" style="gap:10px;margin-top:12px" data-assignment-id="${escapeHtml(assignment.assignmentId)}" data-version="${escapeHtml(assignment.version)}" data-action="hold">
      <label><strong>Hold reason</strong><input name="holdReason" required maxlength="2000"></label>
      <button class="button secondary" type="submit">Hold compensation</button>
    </form>
    <form class="assignment-action-form list" style="gap:10px;margin-top:12px" data-assignment-id="${escapeHtml(assignment.assignmentId)}" data-version="${escapeHtml(assignment.version)}" data-action="mark_payable">
      <button class="button secondary" type="submit">Mark payable</button>
      <small>Payable means internally approved and awaiting a future authorised payment rail. No funds move now.</small>
    </form>
    <form class="assignment-action-form list" style="gap:10px;margin-top:12px" data-assignment-id="${escapeHtml(assignment.assignmentId)}" data-version="${escapeHtml(assignment.version)}" data-action="adjust_compensation">
      <label><strong>Adjusted final compensation</strong><input name="finalCompensation" type="number" min="0" step="0.01" required></label>
      <label><strong>Adjustment reason</strong><input name="adjustmentReason" required maxlength="2000"></label>
      <button class="button secondary" type="submit">Record compensation adjustment</button>
    </form>`;
}

function teamMemberActions(assignment) {
  if (assignment.assignmentStatus === "offered") {
    return `
      <div class="list" style="gap:10px;margin-top:12px">
        <form class="assignment-action-form" data-assignment-id="${escapeHtml(assignment.assignmentId)}" data-version="${escapeHtml(assignment.version)}" data-action="accept">
          <button class="button primary" type="submit">Accept assignment</button>
        </form>
        <form class="assignment-action-form" data-assignment-id="${escapeHtml(assignment.assignmentId)}" data-version="${escapeHtml(assignment.version)}" data-action="decline">
          <button class="button secondary" type="submit">Decline assignment</button>
        </form>
      </div>`;
  }
  if (assignment.assignmentStatus === "accepted") {
    return `<div class="list" style="gap:10px;margin-top:12px">
      <form class="assignment-action-form" data-assignment-id="${escapeHtml(assignment.assignmentId)}" data-version="${escapeHtml(assignment.version)}" data-action="start">
        <button class="button secondary" type="submit">Mark in progress</button>
      </form>
      <form class="assignment-action-form" data-assignment-id="${escapeHtml(assignment.assignmentId)}" data-version="${escapeHtml(assignment.version)}" data-action="submit">
        <button class="button primary" type="submit">Submit for review</button>
      </form>
    </div>`;
  }
  if (assignment.assignmentStatus === "in_progress") {
    return `<form class="assignment-action-form" style="margin-top:12px" data-assignment-id="${escapeHtml(assignment.assignmentId)}" data-version="${escapeHtml(assignment.version)}" data-action="submit">
      <button class="button primary" type="submit">Submit for review</button>
    </form>`;
  }
  return "";
}

function timeline(assignment) {
  const items = Array.isArray(assignment.compensationTimeline) ? assignment.compensationTimeline : [];
  if (!items.length) {
    return `<div class="list-row"><span><strong>Offered</strong><small>${money(assignment.offeredCompensation, assignment.currency)}</small></span>${badge(assignment.compensationStatus)}</div>`;
  }
  return items.map(item =>
    `<div class="list-row"><span><strong>${escapeHtml(item.status)}</strong><small>${money(item.amount, assignment.currency)} · ${dateLabel(item.at)}</small></span>${badge(item.status)}</div>`
  ).join("");
}

function assignmentCard(assignment, role) {
  return `<article class="card panel" style="margin-bottom:16px">
    <div class="panel-header">
      <div>
        <h2>${escapeHtml(assignment.title)}</h2>
        <p>${escapeHtml(assignment.assignmentReference)} · Project ${escapeHtml(assignment.projectId)}${role === "manager" && assignment.teamMemberEmail ? ` · ${escapeHtml(assignment.teamMemberEmail)}` : ""}</p>
      </div>
      <div>${badge(assignment.assignmentStatus)} ${badge(assignment.compensationStatus)}</div>
    </div>
    <div class="list">
      <div class="list-row"><span><strong>Scope</strong><small>${escapeHtml(assignment.scope)}</small></span></div>
      <div class="list-row"><span><strong>Deliverables</strong><small>${escapeHtml(assignment.deliverables || "—")}</small></span></div>
      <div class="list-row"><span><strong>Deadline</strong><small>${dateLabel(assignment.deadline)}</small></span><span><strong>Revisions</strong><small>${escapeHtml(assignment.revisionAllowance)}</small></span></div>
      <div class="list-row"><span><strong>Offered compensation</strong><small>${money(assignment.offeredCompensation, assignment.currency)}</small></span><span><strong>Final compensation</strong><small>${money(assignment.finalCompensation, assignment.currency)}</small></span></div>
    </div>
    <div class="panel-header" style="margin-top:12px"><div><h3>Compensation timeline</h3><p>Shadow obligation only. No Stripe payout or transfer is executed from this workspace.</p></div></div>
    <div class="list">${timeline(assignment)}</div>
    ${role === "manager" ? managerActions(assignment) : teamMemberActions(assignment)}
    <div class="notice assignment-status" hidden role="status"></div>
  </article>`;
}

function pageMarkup(context) {
  const role = context.actor.role;
  const heading = role === "manager" ? "Assignments" : "My Assignments";
  const intro = role === "manager"
    ? "Create and manage Team Member assignments and compensation obligations. Clients never see this information."
    : "Review offered compensation before acceptance, then track your own assignment and compensation status.";
  const cards = context.assignments.length
    ? context.assignments.map(item => assignmentCard(item, role)).join("")
    : `<section class="card panel"><div class="empty-state"><strong>No assignments yet</strong><span>${role === "manager" ? "Create an assignment offer for a Team Member." : "When a Manager assigns work to you, it will appear here with the offered compensation."}</span></div></section>`;
  return `${createForm(context)}
    <section class="card panel" style="margin-bottom:18px">
      <div class="panel-header"><div><h2>${heading}</h2><p>${intro}</p></div><span class="pill neutral">${escapeHtml(context.paymentExecution)}</span></div>
    </section>
    ${cards}`;
}

async function mutate(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const body = {
    ...data,
    action: form.dataset.action,
    assignmentId: form.dataset.assignmentId,
    expectedVersion: Number(form.dataset.version),
    idempotencyKey: idempotencyKey(form.dataset.action),
  };
  if (body.finalCompensation !== undefined) body.finalCompensation = Number(body.finalCompensation);
  if (body.offeredCompensation !== undefined) body.offeredCompensation = Number(body.offeredCompensation);
  return requestJson("/api/digital-den/assignments/manage", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

function bind(content) {
  content.querySelector("#assignment-create-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = form.querySelector("#assignment-create-status");
    status.hidden = false;
    status.textContent = "Creating assignment offer…";
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      await requestJson("/api/digital-den/assignments/manage", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          offeredCompensation: Number(data.offeredCompensation),
          revisionAllowance: Number(data.revisionAllowance || 0),
          deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
          idempotencyKey: idempotencyKey("create"),
        }),
      });
      status.textContent = "Assignment offer created.";
      await renderPage(true);
    } catch (error) {
      status.textContent = error.message;
    }
  });

  content.querySelectorAll(".assignment-action-form").forEach(form => {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const card = form.closest("article");
      const status = card?.querySelector(".assignment-status");
      if (status) {
        status.hidden = false;
        status.textContent = "Saving assignment action…";
      }
      try {
        await mutate(form);
        if (status) status.textContent = "Assignment updated and audited.";
        await renderPage(true);
      } catch (error) {
        if (status) {
          status.textContent = error.code === "VERSION_CONFLICT"
            ? "This assignment changed before your action completed. Refresh and try again."
            : error.message;
        }
      }
    });
  });
}

async function renderPage(force = false) {
  if (!ASSIGNMENT_HASHES.has(location.hash) || busy) return;
  const content = document.querySelector("#workspace-content");
  if (!content) return;
  if (!force && content.dataset.assignmentsReady === "true") return;
  busy = true;
  content.dataset.assignmentsReady = "true";
  content.innerHTML = `<section class="card panel"><div class="empty-state"><strong>Loading assignments…</strong><span>Applying role-based assignment and compensation visibility.</span></div></section>`;
  try {
    const context = await loadContext();
    if (context.actor.role === "client") {
      content.innerHTML = `<section class="card panel"><div class="empty-state"><strong>Assignments unavailable</strong><span>Clients cannot view internal assignments or Team Member compensation.</span></div></section>`;
      return;
    }
    content.innerHTML = pageMarkup(context);
    bind(content);
  } catch (error) {
    content.innerHTML = `<section class="card panel"><div class="empty-state"><strong>Assignments unavailable</strong><span>${escapeHtml(error.message)}</span></div></section>`;
  } finally {
    busy = false;
  }
}

window.addEventListener("hashchange", () => {
  const content = document.querySelector("#workspace-content");
  if (content) delete content.dataset.assignmentsReady;
  renderPage();
});
new MutationObserver(() => renderPage()).observe(document.documentElement, { childList: true, subtree: true });
renderPage();
