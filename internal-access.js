(() => {
  'use strict';

  const API_BASE = document.body?.dataset?.apiBase || '';
  const form = document.querySelector('#request-form');
  const email = document.querySelector('#email');
  const button = document.querySelector('#request-button');
  const status = document.querySelector('#status');
  const intro = document.querySelector('#intro');

  if (!form || !email || !button || !status || !intro) {
    console.error('Digital Den internal access form failed to initialise');
    return;
  }

  function show(message, type = '') {
    status.textContent = message;
    status.className = `notice ${type}`.trim();
  }

  async function postJson(path, body) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || `Request failed (${response.status}).`);
      }
      return payload;
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error('The access service did not respond. Please try again.');
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function requestAccess(address) {
    return postJson('/api/digital-den/internal-access/request', { email: address });
  }

  function consumeAccess(token) {
    return postJson('/api/digital-den/internal-access/consume', { token });
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
      show(error?.message || 'This access link is invalid or expired.', 'error');
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;

    const address = email.value.trim();
    if (!address || !email.checkValidity()) {
      email.reportValidity();
      return;
    }

    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Requesting secure link…';
    show('Requesting a secure access link…');

    try {
      const payload = await requestAccess(address);
      show(payload.message || 'If an authorised account exists, a secure link has been sent.', 'success');
      form.reset();
    } catch (error) {
      show(error?.message || 'Unable to request access right now.', 'error');
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });

  consumeFromFragment().catch(error => {
    console.error('Digital Den access-link consumption failed', error);
    form.classList.remove('hidden');
    show('Unable to verify this access link. Please request a new one.', 'error');
  });
})();
