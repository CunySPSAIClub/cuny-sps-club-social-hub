import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { getGoogleClientId } from './authConfig.ts';

export const SESSION_COOKIE_NAME = 'cuny_sps_hub_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const SESSION_SIGNING_SECRET =
  process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

const revokedJtis = new Set<string>();

export interface VerifiedSessionPayload {
  userId: string;
  iat: number;
  exp: number;
  jti: string;
}

export function issueUserSessionToken(userId: string): {
  token: string;
  expiresAt: string;
  jti: string;
} {
  const now = Date.now();
  const exp = now + SESSION_TTL_MS;
  const jti = crypto.randomBytes(16).toString('hex');
  const payloadObj: VerifiedSessionPayload = {
    userId,
    iat: now,
    exp,
    jti,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', SESSION_SIGNING_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return {
    token: `${payloadB64}.${sigB64}`,
    expiresAt: new Date(exp).toISOString(),
    jti,
  };
}

export function verifyUserSessionToken(
  token: string | undefined | null
): VerifiedSessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SIGNING_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sigB64, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    ) as Partial<VerifiedSessionPayload>;
    if (
      typeof parsed.userId !== 'string' ||
      !parsed.userId ||
      typeof parsed.exp !== 'number' ||
      typeof parsed.jti !== 'string'
    ) {
      return null;
    }
    if (parsed.exp <= Date.now()) return null;
    if (revokedJtis.has(parsed.jti)) return null;
    return parsed as VerifiedSessionPayload;
  } catch {
    return null;
  }
}

export function revokeUserSessionToken(token: string | undefined | null): void {
  const verified = verifyUserSessionToken(token);
  if (!verified) return;
  revokedJtis.add(verified.jti);
  if (revokedJtis.size > 2000) {
    const first = revokedJtis.values().next().value;
    if (first) revokedJtis.delete(first);
  }
}

export function parseCookieHeader(cookieHeader: string | undefined | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return cookies;
  for (const part of cookieHeader.split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(val);
    } catch {
      cookies[key] = val;
    }
  }
  return cookies;
}

export function extractSessionCookie(req: Request): string | null {
  const cookies = parseCookieHeader(req.header('cookie'));
  return cookies[SESSION_COOKIE_NAME] || null;
}

function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const proto = (req.header('x-forwarded-proto') || '').split(',')[0].trim().toLowerCase();
  return proto === 'https';
}

export function buildSessionSetCookieHeader(token: string, secureContext: boolean): string {
  const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${maxAgeSec}`,
  ];
  if (secureContext) {
    // Required for HTTPS iframe previews (AI Studio) and cross-site embedded contexts
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }
  return parts.join('; ');
}

export function buildClearSessionCookieHeader(secureContext: boolean): string {
  const parts = [`${SESSION_COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'Max-Age=0'];
  if (secureContext) {
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }
  return parts.join('; ');
}

export function setSessionCookie(req: Request, res: Response, userId: string): void {
  const { token } = issueUserSessionToken(userId);
  const header = buildSessionSetCookieHeader(token, isHttpsRequest(req));
  res.setHeader('Set-Cookie', header);
}

export function clearSessionCookie(req: Request, res: Response): void {
  const existing = extractSessionCookie(req);
  if (existing) {
    revokeUserSessionToken(existing);
  }
  const header = buildClearSessionCookieHeader(isHttpsRequest(req));
  res.setHeader('Set-Cookie', header);
}

/**
 * CSRF protection for cookie-authenticated mutating requests:
 * Requires either X-Requested-With header or an Origin matching Host / X-Forwarded-Host.
 */
export function verifyCsrfForMutation(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }
  const xrw = (req.header('x-requested-with') || '').trim();
  if (xrw.length > 0) {
    return true;
  }
  const origin = (req.header('origin') || '').trim();
  if (origin) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      const forwardedHost = (req.header('x-forwarded-host') || '')
        .split(',')[0]
        .trim()
        .toLowerCase();
      const host = (req.header('host') || '').trim().toLowerCase();
      if (originHost && (originHost === forwardedHost || originHost === host)) {
        return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}

export interface VerifiedGoogleProfile {
  sub: string;
  email: string;
  name: string;
  givenName: string;
  familyName: string;
  picture?: string;
}

/**
 * Verifies a Google Identity Services ID token with Google's official tokeninfo endpoint.
 */
export async function verifyGoogleIdToken(
  idToken: string
): Promise<{ ok: true; profile: VerifiedGoogleProfile } | { ok: false; error: string }> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    return {
      ok: false,
      error:
        'Google Sign-In is not configured yet. Set GOOGLE_CLIENT_ID in environment settings first.',
    };
  }
  const cleanToken = (idToken || '').trim();
  if (!cleanToken || cleanToken.length < 40) {
    return { ok: false, error: 'Missing or invalid Google sign-in token.' };
  }

  try {
    const endpoint = new URL('https://oauth2.googleapis.com/tokeninfo');
    endpoint.searchParams.set('id_token', cleanToken);
    const response = await fetch(endpoint.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      return { ok: false, error: 'Google could not verify your sign-in token. Please try again.' };
    }
    const data = (await response.json()) as {
      aud?: string;
      iss?: string;
      sub?: string;
      email?: string;
      email_verified?: string | boolean;
      exp?: string;
      name?: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
    };

    if (data.aud !== clientId) {
      return { ok: false, error: 'Google token audience mismatch.' };
    }
    if (data.iss !== 'accounts.google.com' && data.iss !== 'https://accounts.google.com') {
      return { ok: false, error: 'Unexpected Google token issuer.' };
    }
    const emailVerified = data.email_verified === true || data.email_verified === 'true';
    if (!emailVerified || !data.email || !data.sub) {
      return { ok: false, error: 'A verified Google email address is required.' };
    }
    const expSec = Number(data.exp);
    if (!Number.isFinite(expSec) || expSec * 1000 <= Date.now()) {
      return { ok: false, error: 'Your Google sign-in token has expired. Please try again.' };
    }

    const fullName = (data.name || `${data.given_name || ''} ${data.family_name || ''}`).trim() || data.email.split('@')[0];
    return {
      ok: true,
      profile: {
        sub: data.sub,
        email: data.email.trim().toLowerCase(),
        name: fullName,
        givenName: (data.given_name || fullName.split(' ')[0] || 'Student').trim(),
        familyName: (data.family_name || fullName.split(' ').slice(1).join(' ') || '').trim(),
        picture: typeof data.picture === 'string' && data.picture.startsWith('https://') ? data.picture : undefined,
      },
    };
  } catch {
    return { ok: false, error: 'Could not contact Google Sign-In verification service.' };
  }
}
