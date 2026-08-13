import { deliveriesCapabilityEnabled } from "./launch-readiness-capability.js";

const API_BASE = globalThis.location?.origin ?? "";
const INTENT = "delivery-lifecycle";
const SLOT_SELECTOR = "#delivery-lifecycle-slot";

let busy = false;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char]));
}

function dateLabel(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

function badge(value) {
  const text = String(value || "submitted").replaceAll("_", " ");
  const tone = /correction|revision|held/.test(String(value)) ? "amber"
    : /approved|client_approved/.test(String(value)) ? "green"
      : /submitted|resubmitted/.test(String(value)) ? "cyan" : "neutral";
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
    const message = payload?.error?.message || `Delivery request failed (${response.status})`;
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
  if (!deliveriesCapabilityEnabled(actor)) {
    return { actor, enabled: false, projects: [], submissionsByProject: {} };
  }

  const projectsPayload = await requestJson("/api/digital-den/projects");
  const projects = projectsPayload.projects || [];
  const submissionsByProject = {};

  for (const project of projects) {
    try {
      const payload = await requestJson(`/api/digital-den/deliveries/manage?projectId=${encodeURIComponent(project.projectId)}`);
      submissionsByProject[project.projectId] = payload.submissions || [];
    } catch (error) {
      if (error.status === 404 || error.status === 403) {
        return { actor, enabled: false, projects: [], submissionsByProject: {} };
      }
      throw error;
    }
  }

  return { actor, enabled: true, projects, submissionsByProject };
}

function submitForm(context) {
  if (!["manager", "team_member"].includes(context.actor.role)) return "";
  const projectOptions = context.projects.map(project =>
    `<option value="${escapeHtml(project.projectId)}">${escapeHtml(project.title || project.projectId)}</option>`
  ).join("");
  return `<section class="card panel" style="margin-bottom:18px">
    <div class="panel-header"><div><h2>Submit delivery</h2><p>Submit delivery notes and optional file identifiers for manager review.</p></div></div>
    <form id="delivery-submit-form" class="list" style="gap:12px">
      <label for="delivery-project"><strong>Project</strong><select id="delivery-project" name="projectId" required aria-label="Select project for delivery submission">${projectOptions || "<option value=''>No projects available</option>"}</select></label>
      <label for="delivery-notes"><strong>Delivery notes</strong><textarea id="delivery-notes" name="submissionNotes" rows="4" maxlength="8000" required placeholder="Describe what was delivered"></textarea></label>
      <label for="delivery-files"><strong>Submitted file ids</strong><input id="delivery-files" name="submittedFilesText" type="text" placeholder="Optional comma-separated file ids"></label>
      <div><button class="button primary" type="submit" aria-label="Submit delivery for review">Submit delivery</button></div>
      <div id="delivery-submit-status" class="notice" role="status" aria-live="polite" hidden></div>
    </form>
  </section>`;
}

function managerReviewForms(submission) {
  if (!["submitted", "resubmitted"].includes(submission.status)) return "";
  return `<div class="list" style="gap:10px;margin-top:12px">
    <form class="delivery-action-form list" style="gap:10px" data-submission-id="${escapeHtml(submission.submissionId)}" data-version="${escapeHtml(submission.version)}" data-action="request_internal_correction">
      <label for="delivery-correction-reason-${escapeHtml(submission.submissionId)}"><strong>Internal correction reason</strong><input id="delivery-correction-reason-${escapeHtml(submission.submissionId)}" name="reason" required maxlength="4000"></label>
      <button class="button secondary" type="submit" aria-label="Request internal correction">Request internal correction</button>
    </form>
    <form class="delivery-action-form" data-submission-id="${escapeHtml(submission.submissionId)}" data-version="${escapeHtml(submission.version)}" data-action="approve_for_client">
      <button class="button primary" type="submit" aria-label="Approve delivery for client review">Approve for client review</button>
    </form>
  </div>`;
}

function clientReviewForms(submission) {
  if (!["manager_approved_for_client", "resubmitted"].includes(submission.status)) return "";
  return `<div class="list" style="gap:10px;margin-top:12px">
    <form class="delivery-action-form" data-submission-id="${escapeHtml(submission.submissionId)}" data-version="${escapeHtml(submission.version)}" data-action="approve">
      <button class="button primary" type="submit" aria-label="Approve delivery">Approve delivery</button>
    </form>
    <form class="delivery-action-form list" style="gap:10px" data-submission-id="${escapeHtml(submission.submissionId)}" data-version="${escapeHtml(submission.version)}" data-action="request_included_revision">
      <label for="delivery-revision-reason-${escapeHtml(submission.submissionId)}"><strong>Included revision reason</strong><input id="delivery-revision-reason-${escapeHtml(submission.submissionId)}" name="reason" required maxlength="4000"></label>
      <button class="button secondary" type="submit" aria-label="Request included revision">Request included revision</button>
    </form>
    <form class="delivery-action-form list" style="gap:10px" data-submission-id="${escapeHtml(submission.submissionId)}" data-version="${escapeHtml(submission.version)}" data-action="request_paid_change">
      <label for="delivery-paid-change-reason-${escapeHtml(submission.submissionId)}"><strong>Paid change reason</strong><input id="delivery-paid-change-reason-${escapeHtml(submission.submissionId)}" name="reason" required maxlength="4000"></label>
      <button class="button secondary" type="submit" aria-label="Request paid change">Request paid change</button>
    </form>
  </div>`;
}

function submissionCard(submission, role) {
  const files = Array.isArray(submission.submittedFiles) && submission.submittedFiles.length
    ? submission.submittedFiles.join(", ")
    : "—";
  return `<article class="card panel" style="margin-bottom:16px">
    <div class="panel-header">
      <div>
        <h3>${escapeHtml(submission.submissionReference)}</h3>
        <p>Project ${escapeHtml(submission.projectId)} · Version ${escapeHtml(submission.submissionVersion)}</p>
      </div>
      ${badge(submission.status)}
    </div>
    <div class="list">
      <div class="list-row"><span><strong>Notes</strong><small>${escapeHtml(submission.submissionNotes || "—")}</small></span></div>
      <div class="list-row"><span><strong>Package</strong><small>${escapeHtml(submission.packageTitle || submission.submissionReference)}</small></span></div>
      <div class="list-row"><span><strong>Summary</strong><small>${escapeHtml(submission.packageSummary || "—")}</small></span></div>
      <div class="list-row"><span><strong>Completion report</strong><small>${escapeHtml(submission.completionReport || "—")}</small></span></div>
      <div class="list-row"><span><strong>Known limitations</strong><small>${escapeHtml(submission.knownLimitations || "—")}</small></span></div>
      <div class="list-row"><span><strong>Files</strong><small>${escapeHtml(files)}</small></span><span><strong>Submitted</strong><small>${dateLabel(submission.submittedAt)}</small></span></div>
    </div>
    ${role === "manager" ? managerReviewForms(submission) : role === "client" ? clientReviewForms(submission) : ""}
    <div class="notice delivery-status" hidden role="status" aria-live="polite"></div>
  </article>`;
}

function pageMarkup(context) {
  const role = context.actor.role;
  const allSubmissions = Object.values(context.submissionsByProject).flat();
  const pendingReview = role === "manager"
    ? allSubmissions.filter(item => ["submitted", "resubmitted"].includes(item.status))
    : role === "client"
      ? allSubmissions.filter(item => ["manager_approved_for_client", "resubmitted"].includes(item.status))
      : allSubmissions;

  const cards = pendingReview.length
    ? pendingReview.map(item => submissionCard(item, role)).join("")
    : `<section class="card panel"><div class="empty-state"><strong>No delivery actions pending</strong><span>${role === "manager" ? "Submissions awaiting manager review will appear here." : role === "client" ? "Deliveries approved for your review will appear here." : "Submit delivery notes when work is ready for review."}</span></div></section>`;

  const history = allSubmissions.length && pendingReview.length !== allSubmissions.length
    ? `<section class="card panel" style="margin-top:18px"><div class="panel-header"><div><h3>Recent submissions</h3></div></div>${allSubmissions.slice(0, 5).map(item => submissionCard(item, role)).join("")}</section>`
    : "";

  return `${submitForm(context)}
    <section class="card panel" style="margin-bottom:18px">
      <div class="panel-header"><div><h2>Delivery lifecycle</h2><p>Review and approve delivery submissions. No payment execution is enabled from this workspace.</p></div></div>
    </section>
    ${cards}
    ${history}`;
}

function unavailableMarkup(message) {
  return `<section class="card panel"><div class="empty-state"><strong>Deliveries unavailable</strong><span>${escapeHtml(message)}</span></div></section>`;
}

function parseFileIds(text) {
  return String(text || "").split(",").map(part => part.trim()).filter(Boolean);
}

function bind(slot) {
  slot.querySelector("#delivery-submit-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = form.querySelector("#delivery-submit-status");
    status.hidden = false;
    status.textContent = "Submitting delivery…";
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      await requestJson("/api/digital-den/deliveries/manage", {
        method: "POST",
        body: JSON.stringify({
          projectId: data.projectId,
          submissionNotes: data.submissionNotes,
          submittedFiles: parseFileIds(data.submittedFilesText),
          idempotencyKey: idempotencyKey("submit"),
        }),
      });
      status.textContent = "Delivery submitted for manager review.";
      delete slot.dataset.deliveryReady;
      await renderSlot(true);
    } catch (error) {
      status.textContent = error.message;
    }
  });

  slot.querySelectorAll(".delivery-action-form").forEach(form => {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const card = form.closest("article");
      const status = card?.querySelector(".delivery-status");
      if (status) {
        status.hidden = false;
        status.textContent = "Saving delivery action…";
      }
      try {
        const data = Object.fromEntries(new FormData(form).entries());
        const decision = form.dataset.action;
        await requestJson("/api/digital-den/deliveries/manage", {
          method: "PATCH",
          body: JSON.stringify({
            submissionId: form.dataset.submissionId,
            expectedVersion: Number(form.dataset.version),
            decision,
            reason: data.reason || "",
            idempotencyKey: idempotencyKey(decision),
          }),
        });
        if (status) status.textContent = "Delivery updated.";
        delete slot.dataset.deliveryReady;
        await renderSlot(true);
      } catch (error) {
        if (status) {
          status.textContent = error.code === "VERSION_CONFLICT"
            ? "This submission changed before your action completed. Refresh and try again."
            : error.message;
        }
      }
    });
  });
}

async function renderSlot(force = false) {
  const slot = document.querySelector(SLOT_SELECTOR);
  if (!slot || busy) return;
  if (!force && slot.dataset.deliveryReady === "true") return;
  busy = true;
  slot.dataset.deliveryReady = "true";
  slot.innerHTML = unavailableMarkup("Checking delivery capability…");
  try {
    const context = await loadContext();
    if (!context.enabled || !deliveriesCapabilityEnabled(context.actor)) {
      slot.innerHTML = unavailableMarkup("Delivery lifecycle is disabled for this environment or the capability check failed closed.");
      return;
    }
    slot.innerHTML = pageMarkup(context);
    bind(slot);
  } catch (error) {
    slot.innerHTML = unavailableMarkup(error.message);
  } finally {
    busy = false;
  }
}

window.addEventListener("hashchange", () => {
  document.querySelectorAll(SLOT_SELECTOR).forEach(slot => delete slot.dataset.deliveryReady);
  renderSlot();
});
new MutationObserver(() => renderSlot()).observe(document.documentElement, { childList: true, subtree: true });
renderSlot();
