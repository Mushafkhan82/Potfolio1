import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type UserCredential,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

export const authPersistenceReady =
  typeof window !== 'undefined'
    ? setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn('Auth persistence setup warning:', err);
      })
    : Promise.resolve();

export function isRunningInPreviewIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export async function signInWithGooglePopup(): Promise<UserCredential | null> {
  await authPersistenceReady;
  try {
    return await signInWithPopup(auth, googleAuthProvider);
  } catch (err: any) {
    const code = String(err?.code || '');
    const shouldRedirectFallback =
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment' ||
      code === 'auth/web-storage-unsupported' ||
      (isRunningInPreviewIframe() &&
        code !== 'auth/popup-closed-by-user' &&
        code !== 'auth/cancelled-popup-request');

    if (shouldRedirectFallback) {
      await signInWithRedirect(auth, googleAuthProvider);
      return null;
    }
    throw err;
  }
}

export async function resolveGoogleRedirectResult(): Promise<UserCredential | null> {
  await authPersistenceReady;
  return getRedirectResult(auth);
}

export async function signInWithAdminEmailPassword(
  email: string,
  password: string
): Promise<UserCredential> {
  await authPersistenceReady;
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function sendAdminPasswordReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email.trim());
}

export function formatFirebaseAuthError(error: unknown): string {
  const code = String((error as any)?.code || '');
  const message = String((error as any)?.message || '');

  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Incorrect email or password. Please check your credentials or click "Forgot password?".';
  }
  if (code === 'auth/user-not-found') {
    return 'No admin account found for this email address.';
  }
  if (code === 'auth/invalid-email' || code === 'auth/missing-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/missing-password') {
    return 'Please enter your password.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many failed attempts. Please wait a few minutes before trying again.';
  }
  if (code === 'auth/user-disabled') {
    return 'This account has been disabled in Firebase Authentication.';
  }
  if (
    code === 'auth/network-request-failed' ||
    message.toLowerCase().includes('network')
  ) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request'
  ) {
    return 'Google sign-in popup was closed before completing.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Popup was blocked by the browser. Redirecting to Google Sign-In...';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized in Firebase Console > Authentication > Settings > Authorized domains.';
  }
  return message || 'Sign-in failed. Please try again.';
}

export async function signOutAdmin() {
  return signOut(auth);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    return true;
  }
}
