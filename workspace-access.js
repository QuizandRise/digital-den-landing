const API_BASE = document.body.dataset.apiBase;
const form = document.querySelector('#request-form');
const email = document.querySelector('#email');
const button = document.querySelector('#request-button');
const status = document.querySelector('#status');
const intro = document.querySelector('#intro');
const openPanel = document.querySelector('#open-workspace-panel');
const openButton = document.querySelector('#open-workspace-button');
const signOutButton = document.querySelector('#sign-out-device-button');

function intendedView() {
  const params = new URLSearchParams(location.search);
  const returnTo = params.get('returnTo') || sessionStorage.getItem('dd.returnTo') || '';
  if (returnTo.startsWith('/dashboard-next/') || returnTo.startsWith('./dashboard-next/') || returnTo.startsWith('#') || returnTo.startsWith('/dashboard-next')) {
    return returnTo;
  }
  return './dashboard-next/#overview';
}

function show(message, type = '') {
  status.hidden = false;
  status.textContent = message;
  status.className = `notice ${type}`.trim();
}

function friendlyAuthMessage(payload, fallback) {
  const code = payload?.error?.code;
  const message = payload?.error?.message || fallback;
  if (code === 'UNAUTHENTICATED' || /401|403|forbidden|unauthorised|unauthorized/i.test(String(message))) {
    return 'Your secure link has ended. Enter your project email and we will send a new access link.';
  }
  return message;
}

async function requestAccess(address) {
  const response = await fetch(`${API_BASE}/api/digital-den/access/request`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: address }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(friendlyAuthMessage(payload, 'Unable to request access right now.'));
  return payload;
}

async function consumeAccess(token) {
  const response = await fetch(`${API_BASE}/api/digital-den/access/consume`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, returnTo: intendedView() }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(friendlyAuthMessage(payload, 'This access link is invalid or expired.'));
  return payload;
}

async function probeSession() {
  const response = await fetch(`${API_BASE}/api/digital-den/session`, {
    credentials: 'include',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (response.status === 401) {
    await fetch(`${API_BASE}/api/digital-den/session`, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refresh' }),
    }).catch(() => null);
    const retry = await fetch(`${API_BASE}/api/digital-den/session`, {
      credentials: 'include',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!retry.ok) return null;
    return retry.json().catch(() => null);
  }
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

async function consumeFromFragment() {
  const params = new URLSearchParams(location.hash.slice(1));
  const token = params.get('access');
  if (!token) return false;

  history.replaceState(null, '', `${location.pathname}${location.search}`);
  form.classList.add('hidden');
  intro.textContent = 'Verifying your secure access link…';
  show('Please wait while we open your workspace.');

  try {
    const payload = await consumeAccess(token);
    sessionStorage.removeItem('dd.returnTo');
    show('Access confirmed. Opening your workspace…', 'success');
    location.assign(payload.redirectTo || intendedView());
  } catch (error) {
    intro.textContent = 'Your secure link could not be verified.';
    form.classList.remove('hidden');
    show(error.message, 'error');
  }
  return true;
}

async function showOpenWorkspaceIfAuthenticated() {
  const session = await probeSession();
  if (!session?.actor) return;
  form.classList.add('hidden');
  if (openPanel) openPanel.hidden = false;
  intro.textContent = 'You already have a trusted session on this device.';
  if (openButton) {
    openButton.addEventListener('click', () => {
      location.assign(intendedView());
    });
  }
  if (signOutButton) {
    signOutButton.addEventListener('click', async () => {
      await fetch(`${API_BASE}/api/digital-den/session`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
      });
      location.reload();
    });
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  button.disabled = true;
  show('Requesting a secure access link…');
  try {
    const payload = await requestAccess(email.value);
    show(payload.message || 'If a matching project exists, a secure link has been sent.', 'success');
    form.reset();
  } catch (error) {
    show(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

const consumed = await consumeFromFragment();
if (!consumed) await showOpenWorkspaceIfAuthenticated();
