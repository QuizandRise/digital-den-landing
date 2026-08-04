const API_BASE = globalThis.location?.origin ?? "";
let loading = false;

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

function badge(value) {
  return `<span class="badge">${escapeHtml(String(value || "unknown").replaceAll("_", " "))}</span>`;
}

function fileActions(file, role) {
  const review = role === "manager"
    ? `<button class="button secondary" type="button" data-file-review="approved" data-file-id="${escapeHtml(file.fileId)}" ${file.malwareScanState !== "clean" ? "disabled" : ""}>Approve</button>
       <button class="button secondary" type="button" data-file-review="rejected" data-file-id="${escapeHtml(file.fileId)}">Reject</button>`
    : "";
  const download = file.downloadState === "available"
    ? `<button class="button primary" type="button" data-file-download="${escapeHtml(file.fileId)}">Download</button>`
    : "";
  return `${review}${download}` || `<span class="meta">No action available</span>`;
}

function panelMarkup(files, role) {
  const rows = files.length ? files.map(file => `<tr>
    <td><strong>${escapeHtml(file.name)}</strong><small style="display:block">${escapeHtml(file.mediaType)}</small></td>
    <td>${escapeHtml(file.projectId)}</td>
    <td>${badge(file.malwareScanState)}</td>
    <td>${badge(file.reviewState || "pending")}</td>
    <td>${badge(file.downloadState)}</td>
    <td><div style="display:flex;gap:8px;flex-wrap:wrap">${fileActions(file, role)}</div></td>
  </tr>`).join("") : `<tr><td colspan="6"><div class="empty-state"><strong>No project files</strong><span>Uploaded files will appear here after registration.</span></div></td></tr>`;

  return `<section id="file-security-panel" class="card panel" style="margin-bottom:18px">
    <div class="panel-header"><div><h2>File security and delivery</h2><p>Downloads require both a clean malware scan and Manager approval. Download links expire after five minutes.</p></div></div>
    <div id="file-security-status" class="notice" hidden></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>File</th><th>Project</th><th>Scan</th><th>Review</th><th>Download</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div>
  </section>`;
}

async function loadPanel() {
  if (location.hash !== "#files") return;
  const content = document.querySelector("#workspace-content");
  const slot = content?.querySelector("#file-security-slot");
  if (!slot || slot.dataset.ready === "true" || loading) return;
  loading = true;
  slot.dataset.ready = "true";

  try {
    const [sessionPayload, filesPayload] = await Promise.all([
      requestJson("/api/digital-den/session"),
      requestJson("/api/digital-den/files"),
    ]);
    const role = sessionPayload.actor?.role;
    if (!role) return;
    slot.innerHTML = panelMarkup(filesPayload.files || [], role);
  } catch {
    slot.dataset.ready = "false";
  } finally {
    loading = false;
  }
}

async function reviewFile(fileId, decision, button) {
  const status = document.querySelector("#file-security-status");
  button.disabled = true;
  status.hidden = false;
  status.textContent = `${decision === "approved" ? "Approving" : "Rejecting"} file…`;
  try {
    await requestJson("/api/digital-den/files/review", {
      method: "PATCH",
      headers: { "X-Digital-Den-Intent": "project-file-review" },
      body: JSON.stringify({ fileId, decision }),
    });
    status.textContent = "File review saved successfully. Refreshing…";
    setTimeout(() => globalThis.location.reload(), 600);
  } catch (error) {
    status.textContent = error.message;
    button.disabled = false;
  }
}

async function downloadFile(fileId, button) {
  const status = document.querySelector("#file-security-status");
  button.disabled = true;
  status.hidden = false;
  status.textContent = "Preparing a private download link…";
  try {
    const payload = await requestJson(`/api/digital-den/files/download?fileId=${encodeURIComponent(fileId)}`);
    status.textContent = `Download link ready until ${new Date(payload.expiresAt).toLocaleTimeString()}.`;
    globalThis.location.assign(payload.downloadUrl);
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

document.addEventListener("click", event => {
  const reviewButton = event.target.closest("[data-file-review]");
  if (reviewButton) {
    reviewFile(reviewButton.dataset.fileId, reviewButton.dataset.fileReview, reviewButton);
    return;
  }
  const downloadButton = event.target.closest("[data-file-download]");
  if (downloadButton) downloadFile(downloadButton.dataset.fileDownload, downloadButton);
});

const observer = new MutationObserver(() => {
  loadPanel();
});
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("hashchange", loadPanel);
loadPanel();
