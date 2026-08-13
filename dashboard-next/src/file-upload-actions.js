const API_BASE = globalThis.location?.origin ?? "";
const FALLBACK_MAX_BYTES = 10 * 1024 * 1024;
const FALLBACK_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const EXTENSIONS = {
  "image/jpeg": ".jpg,.jpeg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "application/zip": ".zip",
  "application/x-zip-compressed": ".zip",
};

let context = null;
let limits = null;

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

function megabytes(bytes) {
  return Math.max(1, Math.round(Number(bytes) / (1024 * 1024)));
}

async function loadLimits() {
  if (limits) return limits;
  try {
    const payload = await requestJson("/api/digital-den/files/limits");
    limits = {
      maxBytes: Number(payload.limits?.maxBytes) || FALLBACK_MAX_BYTES,
      allowedTypes: Array.isArray(payload.limits?.allowedTypes) && payload.limits.allowedTypes.length
        ? payload.limits.allowedTypes
        : FALLBACK_TYPES,
      note: payload.limits?.note || "Files remain quarantined until security scanning is complete.",
    };
  } catch {
    limits = {
      maxBytes: FALLBACK_MAX_BYTES,
      allowedTypes: FALLBACK_TYPES,
      note: "Maximum 10 MB until the server reports the authorised limit. Files remain quarantined until security scanning is complete.",
    };
  }
  return limits;
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

function acceptList(types) {
  return types.flatMap(type => String(EXTENSIONS[type] || "").split(",")).filter(Boolean).join(",");
}

function uploadMarkup(projects, fileLimits) {
  const options = projects.map(project =>
    `<option value="${escapeHtml(project.projectId)}">${escapeHtml(project.title || project.projectId)}</option>`
  ).join("");
  const mb = megabytes(fileLimits.maxBytes);

  return `<section id="file-upload-panel" class="card panel" style="margin-bottom:18px">
    <div class="panel-header"><div><h2>Upload a project file</h2><p>Authorised limit: ${mb} MB. ${escapeHtml(fileLimits.note)} Secrets, private keys, executables and database dumps are not accepted.</p></div></div>
    <form id="file-upload-form" class="list" style="gap:12px">
      <label><strong>Project</strong><select id="file-project" required>${options}</select></label>
      <label><strong>File</strong><input id="file-input" type="file" required accept="${escapeHtml(acceptList(fileLimits.allowedTypes))}"></label>
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
  let fileLimits;
  try {
    [loaded, fileLimits] = await Promise.all([loadContext(), loadLimits()]);
  } catch {
    slot.dataset.ready = "false";
    return;
  }
  if (!loaded.actor || !["manager", "team_member", "client"].includes(loaded.actor.role) || !loaded.projects.length) return;

  slot.innerHTML = uploadMarkup(loaded.projects, fileLimits);
  const form = content.querySelector("#file-upload-form");
  const input = content.querySelector("#file-input");
  const button = content.querySelector("#file-upload-button");
  const status = content.querySelector("#file-upload-status");
  const allowed = new Set(fileLimits.allowedTypes);

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const file = input.files?.[0];
    if (!file) return;

    status.hidden = false;
    if (!allowed.has(file.type)) {
      status.textContent = "This file type is not allowed.";
      return;
    }
    if (file.size < 1 || file.size > fileLimits.maxBytes) {
      status.textContent = `The file must be ${megabytes(fileLimits.maxBytes)} MB or smaller.`;
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
