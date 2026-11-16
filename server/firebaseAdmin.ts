import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

interface FirebaseAppletConfig {
  projectId: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
}

function loadAppletConfig(): FirebaseAppletConfig {
  try {
    const raw = fs.readFileSync(
      path.resolve(process.cwd(), 'firebase-applet-config.json'),
      'utf8'
    );
    return JSON.parse(raw) as FirebaseAppletConfig;
  } catch {
    return {
      projectId: 'gen-lang-client-0757841907',
      firestoreDatabaseId:
        'ai-studio-instantlaunch-3f4ae3d7-fa72-4a1a-a140-c22763478c7b',
      storageBucket: 'gen-lang-client-0757841907.firebasestorage.app',
    };
  }
}

const appletConfig = loadAppletConfig();
const TARGET_DATABASE_ID =
  (process.env.FIREBASE_DATABASE_ID || '').trim() ||
  appletConfig.firestoreDatabaseId ||
  'ai-studio-instantlaunch-3f4ae3d7-fa72-4a1a-a140-c22763478c7b';
const TARGET_BUCKET =
  (process.env.FIREBASE_STORAGE_BUCKET || '').trim() ||
  appletConfig.storageBucket ||
  'gen-lang-client-0757841907.firebasestorage.app';

let initialized = false;
let initError: string | null = null;
let authDisabledReason: string | null = null;
let cachedDb: Firestore | null = null;

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function normalizeServiceAccount(parsed: any): ServiceAccount | null {
  if (!parsed || typeof parsed !== 'object') {
    initError = 'FIREBASE_SERVICE_ACCOUNT_JSON did not decode to an object';
    return null;
  }

  const projectId =
    typeof parsed.project_id === 'string'
      ? parsed.project_id.trim()
      : typeof parsed.projectId === 'string'
        ? parsed.projectId.trim()
        : '';
  const clientEmail =
    typeof parsed.client_email === 'string'
      ? parsed.client_email.trim()
      : typeof parsed.clientEmail === 'string'
        ? parsed.clientEmail.trim()
        : '';
  const rawPrivateKey =
    typeof parsed.private_key === 'string'
      ? parsed.private_key
      : typeof parsed.privateKey === 'string'
        ? parsed.privateKey
        : '';

  const privateKey = rawPrivateKey
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .trim();

  if (!projectId || !clientEmail || !privateKey.includes('PRIVATE KEY')) {
    initError =
      'FIREBASE_SERVICE_ACCOUNT_JSON is missing required project_id, client_email, or private_key';
    return null;
  }

  return {
    ...parsed,
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  } as ServiceAccount;
}

function parseServiceAccount(): ServiceAccount | null {
  const raw = stripWrappingQuotes(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '');
  if (!raw) return null;

  try {
    if (raw.startsWith('{')) {
      return normalizeServiceAccount(JSON.parse(raw));
    }
    const decoded = stripWrappingQuotes(
      Buffer.from(raw, 'base64').toString('utf8')
    );
    if (!decoded.startsWith('{')) {
      initError = 'FIREBASE_SERVICE_ACCOUNT_JSON is neither valid JSON nor base64 JSON';
      return null;
    }
    return normalizeServiceAccount(JSON.parse(decoded));
  } catch (err: any) {
    initError = `Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${err?.message || 'parse error'}`;
    return null;
  }
}

export function isFirestoreAuthError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as any).code;
  const msg = String((err as any).message || '').toLowerCase();
  return (
    code === 16 ||
    code === '16' ||
    code === 'UNAUTHENTICATED' ||
    msg.includes('16 unauthenticated') ||
    msg.includes('unauthenticated') ||
    msg.includes('invalid authentication credentials') ||
    msg.includes('invalid_grant') ||
    msg.includes('decoder routines') ||
    msg.includes('could not load the default credentials')
  );
}

export function markFirestoreAdminFailed(err: unknown): boolean {
  if (!isFirestoreAuthError(err)) return false;
  if (!authDisabledReason) {
    authDisabledReason =
      'Firebase Admin service account credentials were rejected by Google Auth (16 UNAUTHENTICATED); using public Firestore REST & local store fallback.';
    initError = authDisabledReason;
  }
  cachedDb = null;
  return true;
}

function ensureInitialized(): boolean {
  if (authDisabledReason) return false;
  if (initialized) return cachedDb !== null;
  initialized = true;

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) {
    return false;
  }

  try {
    const existingApps = getApps();
    const app = existingApps.length
      ? getApp()
      : initializeApp({
          credential: cert(serviceAccount),
          projectId:
            (serviceAccount as any).project_id || appletConfig.projectId,
          storageBucket: TARGET_BUCKET,
        });

    cachedDb = TARGET_DATABASE_ID
      ? getFirestore(app, TARGET_DATABASE_ID)
      : getFirestore(app);
    return true;
  } catch (err: any) {
    initError = err?.message || 'Failed to initialize firebase-admin';
    cachedDb = null;
    return false;
  }
}

export function isFirebaseAdminConfigured(): boolean {
  if (authDisabledReason) return false;
  return ensureInitialized();
}

export function getAdminFirestore(): Firestore | null {
  if (authDisabledReason) return null;
  ensureInitialized();
  return cachedDb;
}

export function getAdminStorageBucket() {
  if (authDisabledReason || !ensureInitialized()) return null;
  try {
    return getStorage().bucket(TARGET_BUCKET);
  } catch {
    return null;
  }
}

export function getFirebaseAdminDiagnostics() {
  const ready = isFirebaseAdminConfigured();
  return {
    configured: ready,
    projectId: appletConfig.projectId,
    databaseId: TARGET_DATABASE_ID,
    storageBucket: TARGET_BUCKET,
    error: initError,
  };
}

export async function verifyFirebaseAdminOnStartup(): Promise<void> {
  const db = getAdminFirestore();
  if (!db) return;
  try {
    await db.collection('settings').doc('public').get();
    console.log('[firebase-admin] Connected to Firestore Admin SDK.');
  } catch (err: any) {
    if (markFirestoreAdminFailed(err)) {
      console.info(
        '[firebase-admin] Service account credentials unavailable or expired; falling back cleanly to public Firestore REST + local persistence.'
      );
    }
  }
}

export async function pingFirestoreAdmin(): Promise<{
  ok: boolean;
  mode: 'firebase-admin' | 'public-rest-fallback' | 'unconfigured';
  latencyMs?: number;
  error?: string;
}> {
  if (authDisabledReason) {
    return {
      ok: false,
      mode: 'public-rest-fallback',
      error: authDisabledReason,
    };
  }
  const db = getAdminFirestore();
  if (!db) {
    return {
      ok: false,
      mode: 'unconfigured',
      error: initError || 'FIREBASE_SERVICE_ACCOUNT_JSON not configured',
    };
  }
  const start = Date.now();
  try {
    await db.collection('settings').doc('public').get();
    return { ok: true, mode: 'firebase-admin', latencyMs: Date.now() - start };
  } catch (err: any) {
    const authFailed = markFirestoreAdminFailed(err);
    return {
      ok: false,
      mode: authFailed ? 'public-rest-fallback' : 'firebase-admin',
      latencyMs: Date.now() - start,
      error: authFailed
        ? authDisabledReason || 'Firebase Admin credentials rejected'
        : err?.message || 'Firestore ping failed',
    };
  }
}
