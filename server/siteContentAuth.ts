import crypto from 'node:crypto';

export interface StoredSiteEditorAuth {
  salt: string;
  hash: string;
  createdAt: string;
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const SESSION_SIGNING_SECRET =
  process.env.SITE_EDITOR_SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

const revokedTokens = new Set<string>();

function sha256Buffer(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

export function getEnvAdminPassword(): string {
  return (process.env.SITE_EDITOR_ADMIN_PASSWORD ?? '').trim();
}

export function getAdminAuthStatus(storedAuth?: StoredSiteEditorAuth | null): {
  configured: boolean;
  source: 'env' | 'claimed' | 'unclaimed';
} {
  if (getEnvAdminPassword().length > 0) {
    return { configured: true, source: 'env' };
  }
  if (storedAuth && storedAuth.salt && storedAuth.hash) {
    return { configured: true, source: 'claimed' };
  }
  return { configured: false, source: 'unclaimed' };
}

export function hashAdminPassword(password: string): StoredSiteEditorAuth {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return {
    salt,
    hash: derived,
    createdAt: new Date().toISOString(),
  };
}

export function verifyAdminPassword(
  candidate: string,
  storedAuth?: StoredSiteEditorAuth | null
): boolean {
  if (typeof candidate !== 'string' || candidate.length === 0) return false;
  const envPass = getEnvAdminPassword();
  if (envPass.length > 0) {
    return crypto.timingSafeEqual(sha256Buffer(candidate), sha256Buffer(envPass));
  }
  if (!storedAuth || !storedAuth.salt || !storedAuth.hash) {
    return false;
  }
  try {
    const derived = crypto.scryptSync(candidate, storedAuth.salt, 64);
    const expected = Buffer.from(storedAuth.hash, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function issueEditorSessionToken(): { token: string; expiresAt: string } {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = JSON.stringify({
    role: 'SITE_EDITOR_ADMIN',
    iat: Date.now(),
    exp,
    jti: crypto.randomBytes(12).toString('hex'),
  });
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SIGNING_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return {
    token: `${payloadB64}.${sig}`,
    expiresAt: new Date(exp).toISOString(),
  };
}

export function verifyEditorSessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;
  if (revokedTokens.has(token)) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return false;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SIGNING_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sigB64, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    if (parsed.role !== 'SITE_EDITOR_ADMIN') return false;
    if (typeof parsed.exp !== 'number' || parsed.exp <= Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export function revokeEditorSessionToken(token: string | undefined | null): void {
  if (!token || typeof token !== 'string') return;
  revokedTokens.add(token);
  if (revokedTokens.size > 500) {
    const first = revokedTokens.values().next().value;
    if (first) revokedTokens.delete(first);
  }
}

export function extractBearerToken(authHeader: string | undefined | null): string | null {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return match ? match[1].trim() : null;
}
