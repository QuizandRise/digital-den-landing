const API_BASE = globalThis.location?.origin ?? "";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

let context = null;

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
    const message = payload?.error?.message || `File request failed (${response.status})`;
    const correlationId = response.headers.get("x-correlation-id") || payload?.error?.correlationId;
    throw new Error(correlationId ? `${message}; correlationId=${correlationId}` : message);
  }
  return payload;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char]));
}

async function loadContext() {
  if (context) return context;
  const [sessionPayload, projectsPayload] = await Promise.all([
    requestJson("/api/digital-den/session"),
    requestJson("/api/digital-den/projects"),
  ]);
  context = {
    actor: sessionPayload.actor || null,
    projects: projectsPayload.projects || [],
  };
  return context;
}

function uploadMarkup(projects) {
  const options = projects.map(project =>
    `<option value="${escapeHtml(project.projectId)}">${escapeHtml(project.title || project.projectId)}</option>`
  ).join("");

  return `<section id="file-upload-panel" class="card panel" style="margin-bottom:18px">
    <div class="panel-header"><div><h2>Upload a project file</h2><p>PDF, JPG, PNG, WEBP, DOCX, XLSX or PPTX. Maximum 10 MB. New files remain quarantined until security scanning is complete.</p></div></div>
    <form id="file-upload-form" class="list" style="gap:12px">
      <label><strong>Project</strong><select id="file-project" required>${options}</select></label>
      <label><strong>File</strong><input id="file-input" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.pptx"></label>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <button id="file-upload-button" class="button primary" type="submit">Upload securely</button>
        <span id="file-upload-status" class="notice" hidden></span>
      </div>
    </form>
  </section>`;
}

async function prepareUpload(projectId, file) {
  return requestJson("/api/digital-den/files/upload", {
    method: "POST",
    headers: { "X-Digital-Den-Intent": "project-file-upload" },
    body: JSON.stringify({
      action: "prepare",
      projectId,
      originalName: file.name,
      mediaType: file.type,
      sizeBytes: file.size,
    }),
  });
}

async function uploadToCloudinary(upload, file) {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", upload.apiKey);
  form.append("timestamp", String(upload.timestamp));
  form.append("signature", upload.signature);
  form.append("public_id", upload.publicId);
  form.append("type", upload.type);
  form.append("overwrite", "false");
  form.append("unique_filename", "false");

  const response = await fetch(upload.uploadUrl, { method: "POST", body: form });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || "Secure storage rejected the file.");
  return payload;
}

async function completeUpload(upload, cloudinary) {
  return requestJson("/api/digital-den/files/upload", {
    method: "POST",
    headers: { "X-Digital-Den-Intent": "project-file-upload" },
    body: JSON.stringify({
      action: "complete",
      uploadToken: upload.uploadToken,
      assetId: cloudinary.asset_id,
      publicId: cloudinary.public_id,
      signature: cloudinary.signature,
      resourceType: cloudinary.resource_type,
      type: cloudinary.type,
      version: cloudinary.version,
      bytes: cloudinary.bytes,
    }),
  });
}

async function injectUploadPanel() {
  if (location.hash !== "#files") return;
  const content = document.querySelector("#workspace-content");
  const slot = content?.querySelector("#file-upload-slot");
  if (!slot || slot.dataset.ready === "true") return;
  slot.dataset.ready = "true";

  let loaded;
  try {
    loaded = await loadContext();
  } catch {
    slot.dataset.ready = "false";
    return;
  }
  if (!loaded.actor || !["manager", "team_member", "client"].includes(loaded.actor.role) || !loaded.projects.length) return;

  slot.innerHTML = uploadMarkup(loaded.projects);
  const form = content.querySelector("#file-upload-form");
  const input = content.querySelector("#file-input");
  const button = content.querySelector("#file-upload-button");
  const status = content.querySelector("#file-upload-status");

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const file = input.files?.[0];
    if (!file) return;

    status.hidden = false;
    if (!ALLOWED_TYPES.has(file.type)) {
      status.textContent = "This file type is not allowed.";
      return;
    }
    if (file.size < 1 || file.size > MAX_BYTES) {
      status.textContent = "The file must be 10 MB or smaller.";
      return;
    }

    button.disabled = true;
    status.textContent = "Preparing secure upload…";
    try {
      const prepared = await prepareUpload(content.querySelector("#file-project").value, file);
      status.textContent = "Uploading to secure storage…";
      const cloudinary = await uploadToCloudinary(prepared.upload, file);
      status.textContent = "Registering file and applying quarantine…";
      await completeUpload(prepared.upload, cloudinary);
      status.textContent = "File uploaded successfully. It is quarantined until security scanning is complete.";
      form.reset();
      setTimeout(() => globalThis.location.reload(), 900);
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}

const observer = new MutationObserver(injectUploadPanel);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("hashchange", injectUploadPanel);
injectUploadPanel();
