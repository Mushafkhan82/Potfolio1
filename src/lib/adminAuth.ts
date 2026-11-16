export interface AdminSessionStatus {
  configured: boolean;
  authenticated: boolean;
  expiresAt: string | null;
  rememberDevice: boolean;
  hasSessionSecret?: boolean;
  passwordConfigured?: boolean;
  sessionSecretMissingInProd?: boolean;
  statusMessage?: string | null;
}

export async function fetchAdminSession(): Promise<AdminSessionStatus> {
  const res = await fetch('/api/admin/session', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    return {
      configured: false,
      authenticated: false,
      expiresAt: null,
      rememberDevice: false,
    };
  }
  return (await res.json()) as AdminSessionStatus;
}

export async function loginAdminWithPassword(
  password: string,
  rememberDevice: boolean
): Promise<{ ok: true; expiresAt: string } | { ok: false; error: string; status: number }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, rememberDevice }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: data?.error || 'Unable to sign in. Please verify your studio password.',
    };
  }

  return {
    ok: true,
    expiresAt: data?.expiresAt || '',
  };
}

export async function logoutAdminSession(): Promise<void> {
  await fetch('/api/admin/logout', {
    method: 'POST',
    credentials: 'same-origin',
  }).catch(() => {});
}

export async function logoutAllAdminSessions(): Promise<void> {
  await fetch('/api/admin/logout-all', {
    method: 'POST',
    credentials: 'same-origin',
  }).catch(() => {});
}
