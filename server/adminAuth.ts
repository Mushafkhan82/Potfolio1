import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { getAdminFirestore, markFirestoreAdminFailed } from './firebaseAdmin';

export const ADMIN_COOKIE_NAME = 'mk_admin_session';

const SHORT_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_ATTEMPTS_PER_IP = 5;
const GLOBAL_MAX_ATTEMPTS = 30;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const FAILED_LOGIN_DELAY_MS = 700;

// Ephemeral fallback secret ONLY permitted in non-production development
const EPHEMERAL_SESSION_SECRET = crypto.randomBytes(32).toString('hex');
let warnedEphemeralSecret = false;
let warnedMissingProdSecret = false;

interface RateLimitEntry {
  failures: number;
  resetAt: number;
}

const loginAttemptsByIp = new Map<string, RateLimitEntry>();
let globalLoginAttempts: RateLimitEntry = {
  failures: 0,
  resetAt: Date.now() + WINDOW_MS,
};

let currentTokenVersion = 1;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function hasConfiguredSessionSecret(): boolean {
  return Boolean((process.env.ADMIN_SESSION_SECRET || '').trim());
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean((process.env.ADMIN_PASSWORD || '').trim());
}

export function isAdminAuthReady(): boolean {
  if (!isAdminPasswordConfigured()) return false;
  if (isProductionRuntime() && !hasConfiguredSessionSecret()) return false;
  return true;
}

export function getAdminConfigStatusMessage(): string | null {
  if (!isAdminPasswordConfigured()) {
    return 'Admin access is locked because ADMIN_PASSWORD is not set in server environment secrets.';
  }
  if (isProductionRuntime() && !hasConfiguredSessionSecret()) {
    return 'Admin login is disabled in production because ADMIN_SESSION_SECRET is missing in environment secrets.';
  }
  return null;
}

function getSessionSecret(): string {
  const configured = (process.env.ADMIN_SESSION_SECRET || '').trim();
  if (configured) return configured;

  if (isProductionRuntime()) {
    if (!warnedMissingProdSecret) {
      warnedMissingProdSecret = true;
      console.error(
        '[adminAuth] SECURITY REFUSAL: ADMIN_SESSION_SECRET is missing in production. Admin login is disabled.'
      );
    }
    throw new Error('ADMIN_SESSION_SECRET is required in production.');
  }

  if (!warnedEphemeralSecret) {
    warnedEphemeralSecret = true;
    console.warn(
      '[adminAuth] ADMIN_SESSION_SECRET is not set; using an ephemeral development secret.'
    );
  }
  return EPHEMERAL_SESSION_SECRET;
}

function sha256Digest(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

function constantTimeMatch(a: string, b: string): boolean {
  const hashA = sha256Digest(a);
  const hashB = sha256Digest(b);
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Derive client IP strictly from Express's trusted `req.ip` (server sets `trust proxy = 1`)
 * rather than trusting raw spoofable `X-Forwarded-For` headers directly.
 */
export function getClientIp(req: Request): string {
  return (req.ip || req.socket?.remoteAddress || 'unknown').trim();
}

function parseCookies(req: Request): Record<string, string> {
  const raw = req.headers.cookie || '';
  const out: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

export interface AdminSessionPayload {
  sub: 'studio-admin';
  ver: number;
  iat: number;
  exp: number;
  rememberDevice: boolean;
}

function signSessionToken(payload: AdminSessionPayload): string {
  const secret = getSessionSecret();
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token?: string | null): AdminSessionPayload | null {
  if (!isAdminAuthReady()) return null;
  if (!token || typeof token !== 'string') return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const encoded = token.slice(0, dotIdx);
  const providedSig = token.slice(dotIdx + 1);
  if (!encoded || !providedSig) return null;

  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return null;
  }

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');

  if (!constantTimeMatch(providedSig, expectedSig)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as AdminSessionPayload;
    if (payload.sub !== 'studio-admin') return null;
    if (typeof payload.exp !== 'number' || Date.now() >= payload.exp) return null;
    if (typeof payload.ver !== 'number' || payload.ver !== currentTokenVersion) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function readAdminSession(req: Request): AdminSessionPayload | null {
  if (!isAdminAuthReady()) return null;
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[ADMIN_COOKIE_NAME]);
}

function isRequestSecure(req: Request): boolean {
  if (req.secure) return true;
  const proto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  return proto === 'https';
}

function buildCookieHeader(
  req: Request,
  value: string,
  maxAgeSeconds: number
): string {
  const parts = [
    `${ADMIN_COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ];
  if (isRequestSecure(req)) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

/**
 * Load persisted admin session tokenVersion from Firestore (`settings/adminSession`)
 * on startup so "Logout all devices" revocations survive server restarts.
 */
export async function initAdminSessionVersion(): Promise<void> {
  if (isProductionRuntime() && !hasConfiguredSessionSecret()) {
    console.error(
      '[adminAuth] Refusing to start admin login: ADMIN_SESSION_SECRET is missing in NODE_ENV=production.'
    );
  }

  const db = getAdminFirestore();
  if (!db) {
    console.warn(
      '[adminAuth] Firestore unavailable on startup; keeping in-memory admin tokenVersion (logout-all will not persist across restarts).'
    );
    return;
  }

  try {
    const snap = await db.collection('settings').doc('adminSession').get();
    const persistedVer = snap.exists ? snap.data()?.tokenVersion : null;
    if (typeof persistedVer === 'number' && persistedVer >= 1) {
      currentTokenVersion = Math.floor(persistedVer);
    } else {
      await db.collection('settings').doc('adminSession').set(
        {
          tokenVersion: currentTokenVersion,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    markFirestoreAdminFailed(err);
    console.warn(
      '[adminAuth] Could not load settings/adminSession from Firestore; keeping in-memory tokenVersion.'
    );
  }
}

export function requireAdminSession(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const unavailableMsg = getAdminConfigStatusMessage();
  if (unavailableMsg) {
    res.status(503).json({ error: unavailableMsg });
    return;
  }
  const session = readAdminSession(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized: admin session required.' });
    return;
  }
  (req as Request & { adminSession?: AdminSessionPayload }).adminSession = session;
  next();
}

export function handleAdminSessionStatus(req: Request, res: Response): void {
  const configured = isAdminAuthReady();
  const passwordConfigured = isAdminPasswordConfigured();
  const hasSessionSecret = hasConfiguredSessionSecret();
  const sessionSecretMissingInProd = isProductionRuntime() && !hasSessionSecret;
  const session = readAdminSession(req);

  res.json({
    configured,
    passwordConfigured,
    hasSessionSecret,
    sessionSecretMissingInProd,
    statusMessage: getAdminConfigStatusMessage(),
    authenticated: Boolean(session),
    expiresAt: session ? new Date(session.exp).toISOString() : null,
    rememberDevice: session?.rememberDevice ?? false,
  });
}

export async function handleAdminLogin(req: Request, res: Response): Promise<void> {
  const unavailableMsg = getAdminConfigStatusMessage();
  if (unavailableMsg) {
    res.status(503).json({ error: unavailableMsg });
    return;
  }

  const configuredPassword = (process.env.ADMIN_PASSWORD || '').trim();
  const ip = getClientIp(req);
  const now = Date.now();

  // Reset expired windows
  if (globalLoginAttempts.resetAt <= now) {
    globalLoginAttempts = { failures: 0, resetAt: now + WINDOW_MS };
  }
  const ipEntry = loginAttemptsByIp.get(ip);
  if (ipEntry && ipEntry.resetAt <= now) {
    loginAttemptsByIp.delete(ip);
  }

  // Enforce global failed-attempt limit across all IPs
  if (globalLoginAttempts.failures >= GLOBAL_MAX_ATTEMPTS) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((globalLoginAttempts.resetAt - now) / 1000)
    );
    await delay(FAILED_LOGIN_DELAY_MS);
    console.warn('[adminAuth] Blocked login due to global lockout threshold', {
      ts: new Date(now).toISOString(),
      ip,
      globalFailures: globalLoginAttempts.failures,
    });
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({
      error: `Too many failed login attempts across all devices. Admin login is locked for ${Math.ceil(retryAfterSec / 60)} minute(s).`,
      retryAfterSeconds: retryAfterSec,
    });
    return;
  }

  // Enforce per-IP failed-attempt limit
  const currentIpEntry = loginAttemptsByIp.get(ip);
  if (currentIpEntry && currentIpEntry.failures >= MAX_ATTEMPTS_PER_IP) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((currentIpEntry.resetAt - now) / 1000)
    );
    await delay(FAILED_LOGIN_DELAY_MS);
    console.warn('[adminAuth] Blocked login due to per-IP lockout threshold', {
      ts: new Date(now).toISOString(),
      ip,
      ipFailures: currentIpEntry.failures,
    });
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({
      error: `Too many failed login attempts from this address. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`,
      retryAfterSeconds: retryAfterSec,
    });
    return;
  }

  const password =
    typeof req.body?.password === 'string' ? req.body.password : '';
  const rememberDevice = Boolean(req.body?.rememberDevice);

  if (!password || !constantTimeMatch(password, configuredPassword)) {
    const nextIpFailures = (currentIpEntry?.failures || 0) + 1;
    const ipResetAt = currentIpEntry?.resetAt || now + WINDOW_MS;
    loginAttemptsByIp.set(ip, { failures: nextIpFailures, resetAt: ipResetAt });

    globalLoginAttempts.failures += 1;
    if (globalLoginAttempts.failures >= GLOBAL_MAX_ATTEMPTS) {
      globalLoginAttempts.resetAt = now + WINDOW_MS;
    }

    // Never log the attempted password
    console.warn('[adminAuth] Failed admin login attempt', {
      ts: new Date(now).toISOString(),
      ip,
      ipFailures: nextIpFailures,
      globalFailures: globalLoginAttempts.failures,
      reason: password ? 'invalid_password' : 'empty_password',
      userAgent: String(req.headers['user-agent'] || '').slice(0, 120),
    });

    await delay(FAILED_LOGIN_DELAY_MS);

    if (globalLoginAttempts.failures >= GLOBAL_MAX_ATTEMPTS) {
      const retryAfterSec = Math.ceil(WINDOW_MS / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        error:
          'Too many failed login attempts. Admin login is locked globally for 15 minutes.',
        retryAfterSeconds: retryAfterSec,
      });
      return;
    }

    const remaining = Math.max(0, MAX_ATTEMPTS_PER_IP - nextIpFailures);
    res.status(401).json({
      error:
        remaining > 0
          ? `Incorrect studio password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`
          : 'Too many failed login attempts. This address is locked for 15 minutes.',
    });
    return;
  }

  // Successful login resets per-IP counter
  loginAttemptsByIp.delete(ip);

  const ttlMs = rememberDevice ? REMEMBER_TTL_MS : SHORT_TTL_MS;
  const payload: AdminSessionPayload = {
    sub: 'studio-admin',
    ver: currentTokenVersion,
    iat: now,
    exp: now + ttlMs,
    rememberDevice,
  };

  let token: string;
  try {
    token = signSessionToken(payload);
  } catch (err: any) {
    res.status(503).json({
      error:
        err?.message ||
        'Admin session signing is unavailable because ADMIN_SESSION_SECRET is missing.',
    });
    return;
  }

  res.setHeader('Set-Cookie', buildCookieHeader(req, token, ttlMs / 1000));
  res.json({
    authenticated: true,
    expiresAt: new Date(payload.exp).toISOString(),
    rememberDevice,
  });
}

export function handleAdminLogout(req: Request, res: Response): void {
  res.setHeader('Set-Cookie', buildCookieHeader(req, '', 0));
  res.json({ ok: true, authenticated: false });
}

export async function handleAdminLogoutAll(
  req: Request,
  res: Response
): Promise<void> {
  const session = readAdminSession(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  currentTokenVersion += 1;
  const nowIso = new Date().toISOString();
  let persisted: 'firestore' | 'memory' = 'memory';

  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection('settings').doc('adminSession').set(
        {
          tokenVersion: currentTokenVersion,
          revokedAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true }
      );
      persisted = 'firestore';
    } catch (err) {
      markFirestoreAdminFailed(err);
      console.warn(
        '[adminAuth] Firestore write failed during logout-all; incremented in-memory tokenVersion only (will reset on server restart).'
      );
    }
  } else {
    console.warn(
      '[adminAuth] Firestore unavailable during logout-all; incremented in-memory tokenVersion only (will reset on server restart).'
    );
  }

  res.setHeader('Set-Cookie', buildCookieHeader(req, '', 0));
  res.json({
    ok: true,
    authenticated: false,
    tokenVersion: currentTokenVersion,
    revokedAt: nowIso,
    persisted,
  });
}
