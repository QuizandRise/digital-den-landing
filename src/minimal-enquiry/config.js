import { createPrivateKey } from 'node:crypto';
import { FORBIDDEN_HOST_MARKERS } from './constants.js';
import { validMailbox, HAS_CONTROL } from './validate.js';
import { validOrigin } from './cors.js';

// Production release approved by owner following controlled Gmail send-only OAuth
// verification, alias/inbox checks, privacy notice and independent Vercel WAF controls.
// Retain fail-closed validation and explicit owner-managed mailbox retention.
export const RELEASE_APPROVED = true;
export const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

// Deploy-time SERVER environment only: never browser variables, credential files,
// shell auto-export, or Keychain access. Provision through an owner-managed secret
// store after separate release review; do not paste values into logs or this repo.
// DD_ENQUIRY_MAIL_PROVIDER=google_workspace
// DD_ENQUIRY_GOOGLE_AUTH_MODE=oauth_refresh_token (or service_account)
// OAuth requires DD_ENQUIRY_GOOGLE_OAUTH_CLIENT_ID, _OAUTH_CLIENT_SECRET,
// _OAUTH_REFRESH_TOKEN (all with the DD_ENQUIRY_GOOGLE prefix).
// Set DD_ENQUIRY_GOOGLE_OAUTH_SCOPE to GMAIL_SEND_SCOPE exactly.
// Set DD_ENQUIRY_FROM_ADDRESS and DD_ENQUIRY_GOOGLE_APPROVED_ALIAS to
// dd@quizandrise.com; DD_ENQUIRY_GOOGLE_DELEGATED_USER to ceo@quizandrise.com.
// DD_ENQUIRY_GOOGLE_OAUTH_MAILBOX_CONFIRMED=true acknowledges that the grant
// belongs to ceo@quizandrise.com (OAuth cannot impersonate a configured subject).
// DD_ENQUIRY_GOOGLE_SEND_AS_CONFIRMED=true acknowledges provider-verified alias
// approval. gmail.send cannot inspect mailbox identity or send-as settings.
// Keep the existing inbox/origin/privacy/retention controls and both release gates.
export function googleAuthConfigError({ google, fromAddress } = {}) {
  if (!google || !['service_account', 'oauth_refresh_token'].includes(google.authMode)) return 'invalid_auth_mode';
  if (google.authMode === 'oauth_refresh_token') {
    if (google.clientEmail || google.privateKey) return 'mixed_auth_config';
    if (fromAddress !== 'dd@quizandrise.com' || google.approvedAlias !== fromAddress ||
        google.delegatedUser !== 'ceo@quizandrise.com') return 'invalid_identity';
    const opaque = value => typeof value === 'string' && /^[\x21-\x7e]{1,4096}$/.test(value);
    if (typeof google.oauthClientId !== 'string' ||
        !/^[A-Za-z0-9_-]{1,256}\.apps\.googleusercontent\.com$/.test(google.oauthClientId) ||
        !opaque(google.oauthClientSecret) || !opaque(google.oauthRefreshToken)) return 'invalid_oauth_config';
    if (google.oauthScope !== GMAIL_SEND_SCOPE) return 'invalid_oauth_scope';
    if (google.oauthMailboxConfirmed !== 'true' || google.sendAsConfirmed !== 'true') return 'provider_approval_required';
    return null;
  }
  if ([google.oauthClientId, google.oauthClientSecret, google.oauthRefreshToken, google.oauthScope,
    google.oauthMailboxConfirmed, google.sendAsConfirmed].some(value => value !== undefined && value !== '')) return 'mixed_auth_config';
  if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9-]+\.iam\.gserviceaccount\.com$/.test(google.clientEmail)) return 'invalid_identity';
  try {
    const key = createPrivateKey(google.privateKey);
    if (!/^-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(google.privateKey) || key.asymmetricKeyType !== 'rsa' || key.asymmetricKeyDetails.modulusLength < 2048) return 'invalid_key';
  } catch { return 'invalid_key'; }
  return null;
}

// Explicit registration is a local allowlist, not evidence of Gmail send-as permission.
// Do not trim, split or normalise identity values: only exact addresses are accepted.
export function validSenderIdentity({ fromAddress, google } = {}) {
  const strictMailbox = value => validMailbox(value) && !HAS_CONTROL.test(value) &&
    value.split('@')[1].split('.').every(label => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label));
  if (!google || !strictMailbox(fromAddress) || !strictMailbox(google.delegatedUser)) return false;
  const alias = google.approvedAlias ?? '';
  if (alias === '') return fromAddress === google.delegatedUser;
  return alias === 'dd@quizandrise.com' && fromAddress === alias &&
    google.delegatedUser === 'ceo@quizandrise.com';
}

export function loadEnquiryConfig(env = process.env, { injectedTestMailer = false } = {}) {
  const blocked = (reason = 'incomplete_config') => ({ ok: false, reason, message: 'Enquiry intake is unavailable pending owner release review.', missing: [], config: null });
  if (Object.entries(env).some(([key, value]) => key.startsWith('DD_ENQUIRY_') && value !== undefined && typeof value !== 'string')) return blocked('invalid_config');
  const provider = env.DD_ENQUIRY_MAIL_PROVIDER;
  const localTest = injectedTestMailer && provider === 'mock' && env.NODE_ENV !== 'production' && !env.VERCEL && !env.VERCEL_ENV;
  const config = {
    provider, inboxTo: env.DD_ENQUIRY_INBOX_TO || '', fromAddress: env.DD_ENQUIRY_FROM_ADDRESS || '',
    fromName: env.DD_ENQUIRY_FROM_NAME || 'Digital Den Enquiries',
    allowedOrigins: (env.DD_ENQUIRY_ALLOWED_ORIGINS || '').split(','),
    google: {
      authMode: env.DD_ENQUIRY_GOOGLE_AUTH_MODE || '',
      oauthClientId: env.DD_ENQUIRY_GOOGLE_OAUTH_CLIENT_ID || '',
      oauthClientSecret: env.DD_ENQUIRY_GOOGLE_OAUTH_CLIENT_SECRET || '',
      oauthRefreshToken: env.DD_ENQUIRY_GOOGLE_OAUTH_REFRESH_TOKEN || '',
      oauthScope: env.DD_ENQUIRY_GOOGLE_OAUTH_SCOPE || '',
      oauthMailboxConfirmed: env.DD_ENQUIRY_GOOGLE_OAUTH_MAILBOX_CONFIRMED || '',
      sendAsConfirmed: env.DD_ENQUIRY_GOOGLE_SEND_AS_CONFIRMED || '',
      clientEmail: env.DD_ENQUIRY_GOOGLE_CLIENT_EMAIL || '',
      privateKey: (env.DD_ENQUIRY_GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      delegatedUser: env.DD_ENQUIRY_GOOGLE_DELEGATED_USER || '',
      approvedAlias: env.DD_ENQUIRY_GOOGLE_APPROVED_ALIAS ?? '',
    },
  };
  const checked = [config.inboxTo, config.fromAddress, config.fromName, config.google.clientEmail, config.google.delegatedUser, config.google.approvedAlias, ...config.allowedOrigins].join(' ').toLowerCase();
  if (FORBIDDEN_HOST_MARKERS.some(marker => checked.includes(marker))) return blocked('forbidden_dependency');
  if (env.DD_ENQUIRY_ENABLED !== 'true' || (!localTest && provider !== 'google_workspace')) return blocked();
  if (!validMailbox(config.inboxTo) || !validMailbox(config.fromAddress) || !config.fromName || config.fromName.length > 160 || HAS_CONTROL.test(config.fromName) || !config.allowedOrigins.length || !config.allowedOrigins.every(validOrigin)) return blocked('invalid_config');
  // Injected mocks exercise the same sender checks whenever an identity is supplied.
  if ((!localTest || config.google.delegatedUser || config.google.approvedAlias !== '') && !validSenderIdentity(config)) return blocked('invalid_identity');
  if (!localTest) {
    const authError = googleAuthConfigError(config);
    if (authError) return blocked(authError);
    if (!RELEASE_APPROVED) return blocked('release_not_approved');
  }
  return { ok: true, config, missing: [], reason: null };
}
