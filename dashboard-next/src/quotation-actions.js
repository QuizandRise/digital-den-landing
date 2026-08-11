import { quotationsCapabilityEnabled } from "./launch-readiness-capability.js";

const API_BASE = globalThis.location?.origin ?? "";
const INTENT = "quotation-lifecycle";
const SLOT_SELECTOR = "#quotation-lifecycle-slot";

let busy = false;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char]));
}

function money(value, currency = "GBP") {
  return `${escapeHtml(currency)} ${Number(value || 0).toFixed(2)}`;
}

function dateLabel(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

function badge(value) {
  const text = String(value || "draft").replaceAll("_", " ");
  const tone = /declined|expired|superseded/.test(String(value)) ? "red"
    : /issued|awaiting/.test(String(value)) ? "amber"
      : /accepted/.test(String(value)) ? "green" : "cyan";
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
    const message = payload?.error?.message || `Quotation request failed (${response.status})`;
    const correlationId = response.headers.get("x-correlation-id") || payload?.error?.correlationId;
    const error = new Error(correlationId ? `${message}; correlationId=${correlationId}` : message);
    error.status = response.status;
    error.code = payload?.error?.code;
    throw error;
  }
  return payload;
}

function capabilityEnabled(actor) {
  return quotationsCapabilityEnabled(actor);
}

async function loadContext() {
  const sessionPayload = await requestJson("/api/digital-den/session");
  const actor = sessionPayload.actor;
  if (!capabilityEnabled(actor)) {
    return { actor, enabled: false, projects: [], quotations: [] };
  }

  let quotationsPayload;
  try {
    quotationsPayload = await requestJson("/api/digital-den/quotations/manage");
  } catch (error) {
    if (error.status === 404 || error.status === 403) {
      return { actor, enabled: false, projects: [], quotations: [] };
    }
    throw error;
  }

  const projectsPayload = await requestJson("/api/digital-den/projects");

  return {
    actor,
    enabled: true,
    projects: projectsPayload.projects || [],
    quotations: quotationsPayload.quotations || [],
  };
}

function managerCreateForm(context) {
  const projectOptions = context.projects.map(project =>
    `<option value="${escapeHtml(project.projectId)}">${escapeHtml(project.title || project.projectId)}</option>`
  ).join("");
  return `<section class="card panel" style="margin-bottom:18px">
    <div class="panel-header"><div><h2>Create quotation</h2><p>Draft a client quotation with scope, deliverables, price and deadline. Real payment execution remains disabled.</p></div></div>
    <form id="quotation-create-form" class="list" style="gap:12px">
      <label for="quotation-project"><strong>Project</strong><select id="quotation-project" name="projectId" required aria-label="Select project for quotation">${projectOptions || "<option value=''>No projects available</option>"}</select></label>
      <label for="quotation-scope"><strong>Scope</strong><textarea id="quotation-scope" name="scope" rows="4" maxlength="12000" required placeholder="What will be delivered"></textarea></label>
      <label for="quotation-deliverables"><strong>Deliverables</strong><textarea id="quotation-deliverables" name="deliverables" rows="3" maxlength="12000" required placeholder="Concrete outputs"></textarea></label>
      <label for="quotation-price"><strong>Price</strong><input id="quotation-price" name="price" type="number" min="0" step="0.01" required></label>
      <label for="quotation-currency"><strong>Currency</strong><input id="quotation-currency" name="currency" value="GBP" maxlength="3" required></label>
      <label for="quotation-revisions"><strong>Included revisions</strong><input id="quotation-revisions" name="includedRevisions" type="number" min="0" max="100" value="1"></label>
      <label for="quotation-deadline"><strong>Delivery deadline</strong><input id="quotation-deadline" name="deliveryDeadline" type="datetime-local"></label>
      <div><button class="button primary" type="submit" aria-label="Create quotation draft">Create quotation draft</button></div>
      <div id="quotation-create-status" class="notice" role="status" aria-live="polite" hidden></div>
    </form>
  </section>`;
}

function issueForm(quotation) {
  if (quotation.status !== "draft") return "";
  return `<form class="quotation-action-form list" style="gap:10px;margin-top:12px" data-quotation-id="${escapeHtml(quotation.quotationId)}" data-version="${escapeHtml(quotation.version)}" data-action="issue">
    <button class="button primary" type="submit" aria-label="Issue quotation to client">Issue quotation to client</button>
  </form>`;
}

function clientResponseForms(quotation) {
  if (quotation.status !== "issued") return "";
  return `<div class="list" style="gap:10px;margin-top:12px">
    <form class="quotation-action-form" data-quotation-id="${escapeHtml(quotation.quotationId)}" data-version="${escapeHtml(quotation.version)}" data-action="accept">
      <button class="button primary" type="submit" aria-label="Accept quotation">Accept quotation</button>
    </form>
    <form class="quotation-action-form" data-quotation-id="${escapeHtml(quotation.quotationId)}" data-version="${escapeHtml(quotation.version)}" data-action="decline">
      <button class="button secondary" type="submit" aria-label="Decline quotation">Decline quotation</button>
    </form>
  </div>`;
}

function quotationCard(quotation, role) {
  return `<article class="card panel" style="margin-bottom:16px">
    <div class="panel-header">
      <div>
        <h3>${escapeHtml(quotation.quotationReference)}</h3>
        <p>Project ${escapeHtml(quotation.projectId)} · Version ${escapeHtml(quotation.quotationVersion)}</p>
      </div>
      ${badge(quotation.clientVisibleStatus || quotation.status)}
    </div>
    <div class="list">
      <div class="list-row"><span><strong>Scope</strong><small>${escapeHtml(quotation.scope)}</small></span></div>
      <div class="list-row"><span><strong>Deliverables</strong><small>${escapeHtml(quotation.deliverables)}</small></span></div>
      <div class="list-row"><span><strong>Price</strong><small>${money(quotation.price, quotation.currency)}</small></span><span><strong>Revisions</strong><small>${escapeHtml(quotation.includedRevisions)}</small></span></div>
      <div class="list-row"><span><strong>Deadline</strong><small>${dateLabel(quotation.deliveryDeadline)}</small></span><span><strong>Issued</strong><small>${dateLabel(quotation.issuedAt)}</small></span></div>
    </div>
    ${role === "manager" ? issueForm(quotation) : clientResponseForms(quotation)}
    <div class="notice quotation-status" hidden role="status" aria-live="polite"></div>
  </article>`;
}

function pageMarkup(context) {
  const role = context.actor.role;
  const visible = role === "client"
    ? context.quotations.filter(item => item.status === "issued" || item.status === "accepted" || item.status === "declined")
    : context.quotations;
  const cards = visible.length
    ? visible.map(item => quotationCard(item, role)).join("")
    : `<section class="card panel"><div class="empty-state"><strong>No quotations yet</strong><span>${role === "manager" ? "Create a draft quotation for a project." : "Issued quotations for your projects will appear here."}</span></div></section>`;
  return `${role === "manager" ? managerCreateForm(context) : ""}
    <section class="card panel" style="margin-bottom:18px">
      <div class="panel-header"><div><h2>${role === "manager" ? "Quotations" : "Your quotations"}</h2><p>${role === "manager" ? "Prepare and issue client quotations. Real payment execution remains disabled." : "Review and respond to issued quotations for your projects."}</p></div></div>
    </section>
    ${cards}`;
}

function unavailableMarkup(message) {
  return `<section class="card panel"><div class="empty-state"><strong>Quotations unavailable</strong><span>${escapeHtml(message)}</span></div></section>`;
}

async function mutate(form) {
  const action = form.dataset.action;
  const body = {
    action,
    quotationId: form.dataset.quotationId,
    expectedVersion: Number(form.dataset.version),
    idempotencyKey: idempotencyKey(action),
  };
  return requestJson("/api/digital-den/quotations/manage", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

function bind(slot, content) {
  content.querySelector("#quotation-create-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = form.querySelector("#quotation-create-status");
    status.hidden = false;
    status.textContent = "Creating quotation draft…";
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      await requestJson("/api/digital-den/quotations/manage", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          price: Number(data.price),
          includedRevisions: Number(data.includedRevisions || 0),
          deliveryDeadline: data.deliveryDeadline ? new Date(data.deliveryDeadline).toISOString() : null,
          idempotencyKey: idempotencyKey("create"),
        }),
      });
      status.textContent = "Quotation draft created.";
      delete slot.dataset.quotationReady;
      await renderSlot(true);
    } catch (error) {
      status.textContent = error.message;
    }
  });

  content.querySelectorAll(".quotation-action-form").forEach(form => {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const card = form.closest("article");
      const status = card?.querySelector(".quotation-status");
      if (status) {
        status.hidden = false;
        status.textContent = "Saving quotation action…";
      }
      try {
        await mutate(form);
        if (status) status.textContent = "Quotation updated.";
        delete slot.dataset.quotationReady;
        await renderSlot(true);
      } catch (error) {
        if (status) {
          status.textContent = error.code === "VERSION_CONFLICT"
            ? "This quotation changed before your action completed. Refresh and try again."
            : error.message;
        }
      }
    });
  });
}

async function renderSlot(force = false) {
  const slot = document.querySelector(SLOT_SELECTOR);
  if (!slot || busy) return;
  if (!force && slot.dataset.quotationReady === "true") return;
  busy = true;
  slot.dataset.quotationReady = "true";
  slot.innerHTML = unavailableMarkup("Checking quotation capability…");
  try {
    const context = await loadContext();
    if (context.actor.role === "team_member") {
      slot.innerHTML = unavailableMarkup("Team Members cannot access quotations.");
      return;
    }
    if (!context.enabled || !quotationsCapabilityEnabled(context.actor)) {
      slot.innerHTML = unavailableMarkup("Quotation lifecycle is disabled for this environment or the capability check failed closed.");
      return;
    }
    slot.innerHTML = pageMarkup(context);
    bind(slot, slot);
  } catch (error) {
    slot.innerHTML = unavailableMarkup(error.message);
  } finally {
    busy = false;
  }
}

window.addEventListener("hashchange", () => {
  document.querySelectorAll(SLOT_SELECTOR).forEach(slot => delete slot.dataset.quotationReady);
  renderSlot();
});
new MutationObserver(() => renderSlot()).observe(document.documentElement, { childList: true, subtree: true });
renderSlot();
