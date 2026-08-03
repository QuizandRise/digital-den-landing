const content = document.querySelector('#workspace-content');
const title = document.querySelector('#view-title');
const description = document.querySelector('#view-description');

function isAssignedWorkRoute() {
  return location.hash.slice(1) === 'assigned_work';
}

function normaliseStatus(value) {
  return String(value || 'Assigned').trim().replaceAll('_', ' ');
}

function enhanceAssignedWork() {
  if (!isAssignedWorkRoute() || !content) return;

  const panel = content.querySelector('.card.panel');
  const cards = [...content.querySelectorAll('.project-card')];
  if (!panel || !cards.length) return;
  if (panel.dataset.assignedWorkReady === 'true') return;

  panel.dataset.assignedWorkReady = 'true';
  title.textContent = 'Assigned Work';
  description.textContent = 'Project workstreams assigned to your verified team account.';

  const intro = panel.querySelector('.panel-header');
  if (intro) {
    intro.innerHTML = `<div><p class="eyebrow">Team delivery workspace</p><h2>Your assigned workstreams</h2><p>Open a workstream to review the project context, files and approved communication channels. Task-level actions will be connected in a later controlled release.</p></div><span class="pill neutral">${cards.length} assigned</span>`;
  }

  cards.forEach((card, index) => {
    if (card.dataset.assignedWorkCard === 'true') return;
    card.dataset.assignedWorkCard = 'true';
    card.classList.add('assigned-work-card');

    const heading = card.querySelector('h3')?.textContent?.trim() || `Assigned work ${index + 1}`;
    const metaRows = card.querySelectorAll('.meta');
    const identity = metaRows[0]?.textContent?.trim() || 'Assigned project';
    const update = metaRows[metaRows.length - 1]?.textContent?.trim() || 'No recent update recorded';
    const status = normaliseStatus(card.querySelector('.badge')?.textContent);
    const progress = card.querySelector('.progress')?.getAttribute('aria-label') || 'Progress not recorded';

    const details = document.createElement('div');
    details.className = 'assigned-work-details';
    details.innerHTML = `
      <div><small>Workstream</small><strong>${identity}</strong></div>
      <div><small>Status</small><strong>${status}</strong></div>
      <div><small>Progress</small><strong>${progress}</strong></div>
      <div><small>Last update</small><strong>${update}</strong></div>
    `;

    const actions = document.createElement('div');
    actions.className = 'assigned-work-actions';
    actions.innerHTML = `
      <button class="button primary" type="button" data-open-assigned-work aria-label="Open workspace for ${heading.replaceAll('"', '&quot;')}">Open workspace</button>
      <span class="assigned-work-readonly-note">Read-only workstream view</span>
    `;

    card.append(details, actions);
  });
}

content?.addEventListener('click', event => {
  const button = event.target.closest('[data-open-assigned-work]');
  if (!button) return;
  const card = button.closest('.project-card');
  if (!card) return;
  card.click();
});

window.addEventListener('hashchange', () => window.setTimeout(enhanceAssignedWork, 0));
window.addEventListener('load', () => window.setTimeout(enhanceAssignedWork, 900));
[250, 600, 1200, 2200].forEach(delay => window.setTimeout(enhanceAssignedWork, delay));
