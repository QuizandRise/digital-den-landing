const API_BASE = globalThis.location?.origin ?? "";
const MAX_LENGTH = 2000;

let actor = null;
let projects = [];
let initialised = false;

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `Messaging request failed (${response.status})`;
    const correlationId = response.headers.get("x-correlation-id") || payload?.error?.correlationId;
    throw new Error(correlationId ? `${message}; correlationId=${correlationId}` : message);
  }
  return payload;
}

async function loadContext() {
  if (initialised) return;
  const [sessionPayload, projectsPayload] = await Promise.all([
    requestJson("/api/digital-den/session"),
    requestJson("/api/digital-den/projects"),
  ]);
  actor = sessionPayload.actor || null;
  const visibleProjects = projectsPayload.projects || [];
  if (actor?.role === "team_member") {
    const approved = new Set(actor.messagingProjectScopes || []);
    projects = visibleProjects.filter(project => approved.has(String(project.projectId)));
  } else {
    projects = visibleProjects;
  }
  initialised = true;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char]));
}

function composerMarkup() {
  const options = projects.map(project =>
    `<option value="${escapeHtml(project.projectId)}">${escapeHtml(project.title || project.projectId)}</option>`
  ).join("");

  return `<section id="message-composer" class="card panel" style="margin-bottom:18px">
    <div class="panel-header"><div><h2>Send a project message</h2><p>Messages remain inside Digital Den. Contact details, external links and off-platform payment requests are blocked.</p></div></div>
    <form id="message-form" class="list" style="gap:12px">
      <label><strong>Project</strong><select id="message-project" required>${options}</select></label>
      <label><strong>Message</strong><textarea id="message-body" rows="5" maxlength="${MAX_LENGTH}" required placeholder="Write your project message…" style="width:100%;resize:vertical"></textarea></label>
      <div class="meta"><span id="message-count">0</span> / ${MAX_LENGTH} characters</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <button id="message-send" class="button primary" type="submit">Send message</button>
        <span id="message-status" class="notice" hidden></span>
      </div>
    </form>
  </section>`;
}

function noPermissionMarkup() {
  return `<section id="message-composer" class="card panel" style="margin-bottom:18px"><div class="empty-state"><strong>Messaging permission has not been granted</strong><span>A Manager must approve client messaging for one of your assigned projects.</span></div></section>`;
}

async function injectComposer() {
  if (location.hash !== "#messages") return;
  const content = document.querySelector("#workspace-content");
  if (!content || content.querySelector("#message-composer")) return;

  try {
    await loadContext();
  } catch {
    return;
  }

  if (!actor || !["client", "manager", "team_member"].includes(actor.role)) return;
  if (!projects.length) {
    if (actor.role === "team_member") content.insertAdjacentHTML("afterbegin", noPermissionMarkup());
    return;
  }

  content.insertAdjacentHTML("afterbegin", composerMarkup());

  const form = content.querySelector("#message-form");
  const body = content.querySelector("#message-body");
  const count = content.querySelector("#message-count");
  const send = content.querySelector("#message-send");
  const status = content.querySelector("#message-status");

  body.addEventListener("input", () => { count.textContent = String(body.value.length); });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    send.disabled = true;
    status.hidden = false;
    status.textContent = "Sending message…";

    try {
      await requestJson("/api/digital-den/messages/send", {
        method: "POST",
        body: JSON.stringify({
          projectId: content.querySelector("#message-project").value,
          message: body.value,
        }),
      });
      body.value = "";
      count.textContent = "0";
      status.textContent = "Message sent successfully. Refreshing the conversation…";
      setTimeout(() => globalThis.location.reload(), 500);
    } catch (error) {
      status.textContent = error.message;
    } finally {
      send.disabled = false;
    }
  });
}

const observer = new MutationObserver(() => { injectComposer(); });
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("hashchange", injectComposer);
injectComposer();
