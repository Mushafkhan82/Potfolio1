import fs from 'fs';
import path from 'path';

interface AppletRestConfig {
  projectId: string;
  firestoreDatabaseId: string;
  apiKey: string;
}

let cachedConfig: AppletRestConfig | null = null;

function getRestConfig(): AppletRestConfig | null {
  if (cachedConfig) return cachedConfig;
  try {
    const raw = fs.readFileSync(
      path.resolve(process.cwd(), 'firebase-applet-config.json'),
      'utf8'
    );
    const parsed = JSON.parse(raw) as Partial<AppletRestConfig>;
    if (!parsed.projectId || !parsed.firestoreDatabaseId || !parsed.apiKey) {
      return null;
    }
    cachedConfig = {
      projectId: parsed.projectId,
      firestoreDatabaseId: parsed.firestoreDatabaseId,
      apiKey: parsed.apiKey,
    };
    return cachedConfig;
  } catch {
    return null;
  }
}

function getBaseDocumentsUrl(cfg: AppletRestConfig): string {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(cfg.projectId)}/databases/${encodeURIComponent(cfg.firestoreDatabaseId)}/documents`;
}

function decodeFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return null;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    const arr = Array.isArray(val.arrayValue?.values)
      ? val.arrayValue.values
      : [];
    return arr.map(decodeFirestoreValue);
  }
  if ('mapValue' in val) {
    const out: Record<string, any> = {};
    const fields = val.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = decodeFirestoreValue(v);
    }
    return out;
  }
  return null;
}

function decodeFirestoreDocument(doc: any): Record<string, any> | null {
  if (!doc || typeof doc !== 'object' || !doc.name) return null;
  const id = String(doc.name).split('/').pop() || '';
  const out: Record<string, any> = {};
  const fields = doc.fields || {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = decodeFirestoreValue(v);
  }
  return { ...out, id: out.id || id };
}

export async function fetchPublicDocRest(
  collection: string,
  docId: string
): Promise<Record<string, any> | null> {
  const cfg = getRestConfig();
  if (!cfg) return null;

  try {
    const url = `${getBaseDocumentsUrl(cfg)}/${encodeURIComponent(collection)}/${encodeURIComponent(docId)}?key=${encodeURIComponent(cfg.apiKey)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (!res.ok) return null;
    const json = await res.json();
    return decodeFirestoreDocument(json);
  } catch {
    return null;
  }
}

export async function runPublicQueryRest(
  collection: string,
  filter?: { field: string; value: string | boolean }
): Promise<Record<string, any>[] | null> {
  const cfg = getRestConfig();
  if (!cfg) return null;

  const structuredQuery: Record<string, any> = {
    from: [{ collectionId: collection }],
  };

  if (filter) {
    const typedValue =
      typeof filter.value === 'boolean'
        ? { booleanValue: filter.value }
        : { stringValue: filter.value };
    structuredQuery.where = {
      fieldFilter: {
        field: { fieldPath: filter.field },
        op: 'EQUAL',
        value: typedValue,
      },
    };
  }

  try {
    const url = `${getBaseDocumentsUrl(cfg)}:runQuery?key=${encodeURIComponent(cfg.apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as any[];
    if (!Array.isArray(rows)) return null;
    return rows
      .map((row) => (row?.document ? decodeFirestoreDocument(row.document) : null))
      .filter((doc): doc is Record<string, any> => Boolean(doc));
  } catch {
    return null;
  }
}

export interface PublicRestSnapshot {
  ok: boolean;
  products: Record<string, any>[];
  collections: Record<string, any>[];
  pages: Record<string, any>[];
  posts: Record<string, any>[];
  navigation: Record<string, any>[];
  siteContent: Record<string, any> | null;
  settings: Record<string, any> | null;
}

export async function fetchPublicStorefrontFromRest(): Promise<PublicRestSnapshot | null> {
  const cfg = getRestConfig();
  if (!cfg) return null;

  try {
    const [products, collections, pages, posts, navigation, siteContent, settings] =
      await Promise.all([
        runPublicQueryRest('products', { field: 'status', value: 'active' }),
        runPublicQueryRest('collections', { field: 'published', value: true }),
        runPublicQueryRest('pages', { field: 'published', value: true }),
        runPublicQueryRest('posts', { field: 'published', value: true }),
        runPublicQueryRest('navigation'),
        fetchPublicDocRest('siteContent', 'published'),
        fetchPublicDocRest('settings', 'public'),
      ]);

    const anySucceeded = Boolean(
      products ||
        collections ||
        pages ||
        posts ||
        navigation ||
        siteContent ||
        settings
    );
    if (!anySucceeded) return null;

    return {
      ok: true,
      products: products || [],
      collections: collections || [],
      pages: pages || [],
      posts: posts || [],
      navigation: navigation || [],
      siteContent,
      settings,
    };
  } catch {
    return null;
  }
}
