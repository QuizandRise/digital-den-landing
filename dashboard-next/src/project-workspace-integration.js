import { isProjectWorkspaceRoute, renderProjectWorkspace, projectWorkspaceTitle } from "./project-workspace.js";

const content = document.querySelector("#workspace-content");
const title = document.querySelector("#view-title");
const description = document.querySelector("#view-description");

function projectIdFromCard(card) {
  const meta = card.querySelector(".meta")?.textContent || "";
  return meta.split("·")[0]?.trim() || null;
}

function enhanceProjectCards() {
  document.querySelectorAll(".project-card:not([data-project-workspace-ready])").forEach(card => {
    const projectId = projectIdFromCard(card);
    if (!projectId) return;
    card.dataset.projectWorkspaceReady = "true";
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Open project workspace for ${projectId}`);
    card.addEventListener("click", () => {
      location.hash = `project/${encodeURIComponent(projectId)}`;
    });
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        location.hash = `project/${encodeURIComponent(projectId)}`;
      }
    });
  });
}

function readDashboardState() {
  const state = globalThis.__digitalDenDashboardState;
  if (!state || !Array.isArray(state.projects)) return null;
  return state;
}

function renderRoute() {
  enhanceProjectCards();
  if (!isProjectWorkspaceRoute()) return;
  const state = readDashboardState();
  if (!state || state.loading) return;

  const markup = renderProjectWorkspace(state);
  if (markup && content) content.innerHTML = markup;
  if (title) title.textContent = projectWorkspaceTitle(state);
  if (description) description.textContent = "A unified, role-scoped view of this project’s records and operational modules.";
}

window.addEventListener("hashchange", () => queueMicrotask(renderRoute));
const observer = new MutationObserver(() => queueMicrotask(renderRoute));
observer.observe(document.documentElement, { childList: true, subtree: true });
renderRoute();
