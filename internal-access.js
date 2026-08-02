const API_BASE = document.body.dataset.apiBase;
const form = document.querySelector('#request-form');
const email = document.querySelector('#email');
const button = document.querySelector('#request-button');
const status = document.querySelector('#status');
const intro = document.querySelector('#intro');

function show(message, type = '') {
  status.textContent = message;
  status.className = `notice ${type}`.trim();
}

async function requestAccess(address) {
  const response = await fetch(`${API_BASE}/api/digital-den/internal-access/request`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: address }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || 'Unable to request access right now.');
  return payload;
}

async function consumeAccess(token) {
  const response = await fetch(`${API_BASE}/api/digital-den/internal-access/consume`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || 'This access link is invalid or expired.');
  return payload;
}

async function consumeFromFragment() {
  const params = new URLSearchParams(location.hash.slice(1));
  const token = params.get('access');
  if (!token) return;

  history.replaceState(null, '', location.pathname);
  form.classList.add('hidden');
  intro.textContent = 'Verifying your secure internal access link…';
  show('Please wait while we open your workspace.');

  try {
    const payload = await consumeAccess(token);
    const label = payload.role === 'manager' ? 'Manager Workspace' : 'Team Workspace';
    show(`Access confirmed. Opening ${label}…`, 'success');
    location.assign(payload.redirectTo || './dashboard-next/#overview');
  } catch (error) {
    intro.textContent = 'Your secure link could not be verified.';
    form.classList.remove('hidden');
    show(error.message, 'error');
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  button.disabled = true;
  show('Requesting a secure access link…');
  try {
    const payload = await requestAccess(email.value);
    show(payload.message || 'If an authorised account exists, a secure link has been sent.', 'success');
    form.reset();
  } catch (error) {
    show(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

consumeFromFragment();
