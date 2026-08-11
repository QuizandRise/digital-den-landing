import { projectLifecycleCapabilityEnabled } from "./launch-readiness-capability.js";

const API_BASE = globalThis.location?.origin ?? "";
const INTENT = "project-lifecycle";
const LIFECYCLE_SLOT = "#project-lifecycle-slot";
const PAYMENT_SLOT = "#project-payment-projection-slot";

let busy = false;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char]));
}

function money(value, currency = "GBP") {
  return `${escapeHtml(currency)} ${Number(value || 0).toFixed(2)}`;
}

function badge(value) {
  const text = String(value || "unknown").replaceAll("_", " ");
  const tone = /awaiting|processing/.test(String(value)) ? "amber"
    : /funded|approved|completed/.test(String(value)) ? "green"
      : /failed|refund/.test(String(value)) ? "red" : "cyan";
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
    const message = payload?.error?.message || `Project lifecycle request failed (${response.status})`;
    const correlationId = response.headers.get("x-correlation-id") || payload?.error?.correlationId;
    const error = new Error(correlationId ? `${message}; correlationId=${correlationId}` : message);
    error.status = response.status;
    error.code = payload?.error?.code;
    throw error;
  }
  return payload;
}

async function loadContext() {
  const sessionPayload = await requestJson("/api/digital-den/session");
  const actor = sessionPayload.actor;
  if (!projectLifecycleCapabilityEnabled(actor)) {
    return { actor, enabled: false, projects: [] };
  }

  const payload = await requestJson("/api/digital-den/projects/manage").catch(error => {
    if (error.status === 404 || error.status === 403) return { projects: [] };
    throw error;
  });

  return { actor, enabled: true, projects: payload.projects || [] };
}

function paymentProjectionPanel(payment) {
  if (!payment || payment.clientPaymentStatus === undefined) {
    return `<div class="notice">Payment projection is unavailable for this role.</div>`;
  }
  return `<div class="financial-grid">
    <div class="financial-field"><small>Client payment status</small><strong>${escapeHtml(String(payment.clientPaymentStatus).replaceAll("_", " "))}</strong></div>
    <div class="financial-field"><small>Amount</small><strong>${money(payment.amount, payment.currency)}</strong></div>
    <div class="financial-field"><small>Amount paid (projection)</small><strong>${money(payment.amountPaidByClient, payment.currency)}</strong></div>
    <div class="financial-field"><small>Settlement status</small><strong>${escapeHtml(payment.settlementStatus || "not_started")}</strong></div>
    <div class="financial-field"><small>Real payment execution</small><strong>${payment.realPaymentExecutionEnabled ? "Enabled" : "Disabled"}</strong></div>
  </div>
  <div class="notice" role="status" aria-live="polite">${escapeHtml(payment.note || "Real payment execution remains disabled. Status is a projection only.")}</div>`;
}

function transitionForm(project) {
  const transitions = Array.isArray(project.permittedTransitions) ? project.permittedTransitions : [];
  if (!transitions.length) return "";
  const options = transitions.map(status =>
    `<option value="${escapeHtml(status)}">${escapeHtml(String(status).replaceAll("_", " "))}</option>`
  ).join("");
  return `<form class="lifecycle-transition-form list" style="gap:10px;margin-top:12px" data-project-id="${escapeHtml(project.projectId)}" data-version="${escapeHtml(project.version)}">
    <label for="lifecycle-status-${escapeHtml(project.projectId)}"><strong>Transition to</strong><select id="lifecycle-status-${escapeHtml(project.projectId)}" name="status" required aria-label="Select project status transition">${options}</select></label>
    <label for="lifecycle-reason-${escapeHtml(project.projectId)}"><strong>Reason</strong><input id="lifecycle-reason-${escapeHtml(project.projectId)}" name="reason" maxlength="2000" placeholder="Optional audit note"></label>
    <button class="button secondary" type="submit" aria-label="Apply project status transition">Apply status transition</button>
  </form>`;
}

function shadowFundedForm(project, role) {
  if (role !== "manager") return "";
  const payment = project.payment || {};
  return `<form class="lifecycle-payment-form list" style="gap:10px;margin-top:12px" data-project-id="${escapeHtml(project.projectId)}" data-version="${escapeHtml(project.version)}" data-action="mark_funded_shadow">
    <label for="lifecycle-funded-amount-${escapeHtml(project.projectId)}"><strong>Shadow funded amount</strong><input id="lifecycle-funded-amount-${escapeHtml(project.projectId)}" name="amountPaidByClient" type="number" min="0" step="0.01" value="${escapeHtml(payment.amount ?? project.clientCommercialAmount ?? 0)}"></label>
    <button class="button secondary" type="submit" aria-label="Mark project funded shadow projection">Mark funded (shadow only)</button>
    <small>No real charge or payout is executed. This records an internal projection only.</small>
  </form>`;
}

function projectCard(project, role) {
  return `<article class="card panel" style="margin-bottom:16px">
    <div class="panel-header">
      <div>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.projectId)} · ${escapeHtml(project.serviceCategory || "Service")}</p>
      </div>
      ${badge(project.status)}
    </div>
    <div class="list">
      <div class="list-row"><span><strong>Progress</strong><small>${escapeHtml(project.progressPercent)}%</small></span><span><strong>Normalized</strong><small>${escapeHtml(project.normalizedStatus || project.status)}</small></span></div>
    </div>
    ${paymentProjectionPanel(project.payment)}
    ${role === "manager" ? transitionForm(project) : ""}
    ${shadowFundedForm(project, role)}
    <div class="notice lifecycle-status" hidden role="status" aria-live="polite"></div>
  </article>`;
}

function lifecycleMarkup(context) {
  const role = context.actor.role;
  const cards = context.projects.length
    ? context.projects.map(project => projectCard(project, role)).join("")
    : `<section class="card panel"><div class="empty-state"><strong>No lifecycle projects</strong><span>Projects with lifecycle controls will appear here when capability is enabled.</span></div></section>`;
  return `<section class="card panel" style="margin-bottom:18px">
    <div class="panel-header"><div><h2>Project lifecycle</h2><p>Status transitions and payment projection. Real payment execution remains disabled.</p></div><span class="pill neutral">shadow only</span></div>
  </section>${cards}`;
}

function paymentBillingMarkup(context) {
  const projectsWithPayment = context.projects.filter(project => project.payment?.clientPaymentStatus);
  if (!projectsWithPayment.length) {
    return `<section class="card panel"><div class="empty-state"><strong>No payment projection available</strong><span>Payment projection fields appear when project lifecycle is enabled and projects include payment data.</span></div></section>`;
  }
  return `<section class="card panel"><div class="panel-header"><div><h2>Payment projection</h2><p>Read-only payment status from your projects. No payment execution is enabled.</p></div></div>
    ${projectsWithPayment.map(project => `<article style="margin-bottom:16px"><h3>${escapeHtml(project.title)}</h3>${paymentProjectionPanel(project.payment)}</article>`).join("")}
  </section>`;
}

function unavailableMarkup(message) {
  return `<section class="card panel"><div class="empty-state"><strong>Project lifecycle unavailable</strong><span>${escapeHtml(message)}</span></div></section>`;
}

function bindForms(container) {
  container.querySelectorAll(".lifecycle-transition-form").forEach(form => {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const card = form.closest("article");
      const status = card?.querySelector(".lifecycle-status");
      if (status) {
        status.hidden = false;
        status.textContent = "Applying status transition…";
      }
      try {
        const data = Object.fromEntries(new FormData(form).entries());
        await requestJson("/api/digital-den/projects/manage", {
          method: "PATCH",
          body: JSON.stringify({
            projectId: form.dataset.projectId,
            expectedVersion: Number(form.dataset.version),
            status: data.status,
            reason: data.reason || "",
            idempotencyKey: idempotencyKey("transition"),
          }),
        });
        if (status) status.textContent = "Project status updated.";
        await refreshAll(true);
      } catch (error) {
        if (status) {
          status.textContent = error.code === "VERSION_CONFLICT"
            ? "This project changed before your action completed. Refresh and try again."
            : error.message;
        }
      }
    });
  });

  container.querySelectorAll(".lifecycle-payment-form").forEach(form => {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const card = form.closest("article");
      const status = card?.querySelector(".lifecycle-status");
      if (status) {
        status.hidden = false;
        status.textContent = "Recording shadow funded projection…";
      }
      try {
        const data = Object.fromEntries(new FormData(form).entries());
        await requestJson("/api/digital-den/projects/manage", {
          method: "PATCH",
          body: JSON.stringify({
            projectId: form.dataset.projectId,
            expectedVersion: Number(form.dataset.version),
            action: "mark_funded_shadow",
            amountPaidByClient: Number(data.amountPaidByClient),
            idempotencyKey: idempotencyKey("mark_funded_shadow"),
          }),
        });
        if (status) status.textContent = "Shadow funded projection recorded. No payment was executed.";
        await refreshAll(true);
      } catch (error) {
        if (status) status.textContent = error.message;
      }
    });
  });
}

async function renderInto(selector, markupFactory, datasetKey, force = false) {
  const slot = document.querySelector(selector);
  if (!slot) return;
  if (!force && slot.dataset[datasetKey] === "true") return;
  slot.dataset[datasetKey] = "true";
  slot.innerHTML = unavailableMarkup("Checking project lifecycle capability…");
  try {
    const context = await loadContext();
    if (!context.enabled || !projectLifecycleCapabilityEnabled(context.actor)) {
      slot.innerHTML = unavailableMarkup("Project lifecycle is disabled for this environment or the capability check failed closed.");
      return;
    }
    slot.innerHTML = markupFactory(context);
    bindForms(slot);
  } catch (error) {
    slot.innerHTML = unavailableMarkup(error.message);
  }
}

async function refreshAll(force = false) {
  if (busy) return;
  busy = true;
  try {
    document.querySelectorAll(LIFECYCLE_SLOT).forEach(slot => delete slot.dataset.lifecycleReady);
    document.querySelectorAll(PAYMENT_SLOT).forEach(slot => delete slot.dataset.paymentReady);
    await Promise.all([
      renderInto(LIFECYCLE_SLOT, lifecycleMarkup, "lifecycleReady", force),
      renderInto(PAYMENT_SLOT, paymentBillingMarkup, "paymentReady", force),
    ]);
  } finally {
    busy = false;
  }
}

window.addEventListener("hashchange", () => refreshAll());
new MutationObserver(() => refreshAll()).observe(document.documentElement, { childList: true, subtree: true });
refreshAll();
