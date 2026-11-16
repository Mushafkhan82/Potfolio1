import type { Express, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { requireAdminSession, getClientIp } from './adminAuth';
import {
  getAdminFirestore,
  getAdminStorageBucket,
  isFirebaseAdminConfigured,
  markFirestoreAdminFailed,
} from './firebaseAdmin';
import { fetchPublicStorefrontFromRest } from './firestorePublicRest';
import {
  SEED_COLLECTIONS,
  SEED_DISCOUNTS,
  SEED_NAVIGATION,
  SEED_PAGES,
  SEED_POSTS,
  SEED_PRODUCTS,
  SEED_ROLES,
  SEED_SETTINGS,
  SEED_SITE_CONTENT,
} from '../src/lib/seedData';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_COLLECTIONS = new Set([
  'products',
  'collections',
  'orders',
  'order_tracking',
  'customers',
  'discounts',
  'pages',
  'posts',
  'navigation',
  'media',
  'siteContent',
  'settings',
  'quote_requests',
  'enquiries',
  'reviewSubmissions',
  'client_reviews',
]);

const ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

const DocUpsertSchema = z.object({
  collection: z.string().refine((c) => ALLOWED_COLLECTIONS.has(c), 'Invalid collection'),
  id: z.string().regex(ID_REGEX, 'Invalid document ID'),
  data: z.record(z.string(), z.unknown()),
  merge: z.boolean().optional(),
});

const DocDeleteSchema = z.object({
  collection: z.string().refine((c) => ALLOWED_COLLECTIONS.has(c), 'Invalid collection'),
  id: z.string().regex(ID_REGEX, 'Invalid document ID'),
  storagePath: z.string().max(500).optional(),
});

const SitePublishSchema = z.object({
  content: z.record(z.string(), z.unknown()),
});

const MediaRenameSchema = z.object({
  id: z.string().regex(ID_REGEX),
  name: z.string().min(1).max(180),
});

// Local disk fallback store when FIREBASE_SERVICE_ACCOUNT_JSON is not set
const FALLBACK_DIR = path.resolve(process.cwd(), '.data');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'admin-store.json');
const LOCAL_UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

type FallbackStore = Record<string, Record<string, any>>;

function readFallbackStore(): FallbackStore {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      return JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8')) as FallbackStore;
    }
  } catch {
    // ignore corrupt fallback file
  }
  return {};
}

function writeFallbackStore(store: FallbackStore): void {
  try {
    fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.warn('[adminRoutes] Failed writing local fallback store:', err);
  }
}

// Per-IP sliding window rate limiter for public endpoints
const publicRateBuckets = new Map<string, number[]>();
export function rateLimitMiddleware(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: () => void) => {
    const ip = getClientIp(req);
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const recent = (publicRateBuckets.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= maxRequests) {
      res.status(429).json({
        error: 'Rate limit exceeded. Please wait a moment before trying again.',
      });
      return;
    }
    recent.push(now);
    publicRateBuckets.set(key, recent);
    next();
  };
}

interface DetectedMedia {
  kind: 'image' | 'video';
  mime: string;
  ext: string;
  optimizableRaster: boolean;
}

function detectMediaTypeByMagicBytes(buf: Buffer): DetectedMedia | null {
  if (!buf || buf.length < 12) return null;

  // Explicitly block text/XML/SVG/HTML payloads even if spoofed with image/* mimetype
  const headText = buf.subarray(0, 256).toString('utf8').trimStart().toLowerCase();
  if (
    headText.startsWith('<svg') ||
    headText.startsWith('<?xml') ||
    headText.startsWith('<!doctype') ||
    headText.startsWith('<html') ||
    headText.startsWith('<script')
  ) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { kind: 'image', mime: 'image/jpeg', ext: '.jpg', optimizableRaster: true };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return { kind: 'image', mime: 'image/png', ext: '.png', optimizableRaster: true };
  }

  // GIF87a / GIF89a
  const ascii6 = buf.subarray(0, 6).toString('ascii');
  if (ascii6 === 'GIF87a' || ascii6 === 'GIF89a') {
    return { kind: 'image', mime: 'image/gif', ext: '.gif', optimizableRaster: false };
  }

  // WebP: RIFF....WEBP
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { kind: 'image', mime: 'image/webp', ext: '.webp', optimizableRaster: true };
  }

  // ISO Base Media File Format (ftyp at offset 4): AVIF, MP4, MOV
  if (buf.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = buf.subarray(8, 12).toString('ascii');
    if (brand === 'avif' || brand === 'avis') {
      return { kind: 'image', mime: 'image/avif', ext: '.avif', optimizableRaster: true };
    }
    if (brand === 'qt  ') {
      return { kind: 'video', mime: 'video/quicktime', ext: '.mov', optimizableRaster: false };
    }
    if (
      brand === 'isom' ||
      brand === 'iso2' ||
      brand === 'mp41' ||
      brand === 'mp42' ||
      brand === 'M4V ' ||
      brand === 'avc1'
    ) {
      return { kind: 'video', mime: 'video/mp4', ext: '.mp4', optimizableRaster: false };
    }
  }

  // WebM / Matroska EBML header: 1A 45 DF A3
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return { kind: 'video', mime: 'video/webm', ext: '.webm', optimizableRaster: false };
  }

  return null;
}

const ALLOWED_UPLOAD_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter(_req, file, cb) {
    const mime = (file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (mime.includes('svg') || ext === '.svg' || ext === '.svgz') {
      cb(
        new Error(
          'SVG uploads are blocked for security reasons. Please upload PNG, JPG, WebP, AVIF, GIF, MP4, or WebM.'
        )
      );
      return;
    }
    if (ALLOWED_UPLOAD_MIMES.has(mime)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Unsupported file type. Allowed formats: JPG, PNG, WebP, AVIF, GIF, MP4, WebM, MOV (max 25MB).'
        )
      );
    }
  },
});

let cacheInvalidationHook: (() => void) | null = null;
export function onPublicContentMutated(cb: () => void) {
  cacheInvalidationHook = cb;
}

function triggerCacheInvalidation() {
  cacheInvalidationHook?.();
}

export function registerAdminAndPublicRoutes(app: Express): void {
  // ======================= PUBLIC STOREFRONT READ & SUBMISSION ROUTES =======================

  app.get('/api/public/storefront', async (_req: Request, res: Response) => {
    const db = getAdminFirestore();
    const fallback = readFallbackStore();
    const fbProd = Object.values(fallback.products || {});
    const fbCol = Object.values(fallback.collections || {});
    const fbPages = Object.values(fallback.pages || {});
    const fbPosts = Object.values(fallback.posts || {});
    const fbNav = Object.values(fallback.navigation || {});

    if (db) {
      try {
        const [prodSnap, colSnap, pageSnap, postSnap, navSnap, siteSnap, setSnap] =
          await Promise.all([
            db.collection('products').where('status', '==', 'active').get(),
            db.collection('collections').where('published', '==', true).get(),
            db.collection('pages').where('published', '==', true).get(),
            db.collection('posts').where('published', '==', true).get(),
            db.collection('navigation').get(),
            db.collection('siteContent').doc('published').get(),
            db.collection('settings').doc('public').get(),
          ]);

        return res.json({
          source: 'firestore-admin',
          products: prodSnap.empty
            ? (fbProd.length ? fbProd : SEED_PRODUCTS).filter((p: any) => p.status === 'active')
            : prodSnap.docs.map((d) => ({ ...d.data(), id: d.id })),
          collections: colSnap.empty
            ? (fbCol.length ? fbCol : SEED_COLLECTIONS).filter((c: any) => c.published)
            : colSnap.docs.map((d) => ({ ...d.data(), id: d.id })),
          pages: pageSnap.empty
            ? (fbPages.length ? fbPages : SEED_PAGES).filter((p: any) => p.published)
            : pageSnap.docs.map((d) => ({ ...d.data(), id: d.id })),
          posts: postSnap.empty
            ? (fbPosts.length ? fbPosts : SEED_POSTS).filter((p: any) => p.published)
            : postSnap.docs.map((d) => ({ ...d.data(), id: d.id })),
          navigation: navSnap.empty
            ? fbNav.length
              ? fbNav
              : SEED_NAVIGATION
            : navSnap.docs.map((d) => ({ ...d.data(), id: d.id })),
          siteContent: siteSnap.exists
            ? siteSnap.data()
            : fallback.siteContent?.published || SEED_SITE_CONTENT,
          settings: setSnap.exists
            ? { ...SEED_SETTINGS, ...setSnap.data() }
            : fallback.settings?.public
              ? { ...SEED_SETTINGS, ...fallback.settings.public }
              : SEED_SETTINGS,
        });
      } catch (err) {
        if (!markFirestoreAdminFailed(err)) {
          console.info('[public/storefront] Admin read fallback triggered.');
        }
      }
    }

    const rest = await fetchPublicStorefrontFromRest();
    if (rest?.ok) {
      return res.json({
        source: 'firestore-public-rest',
        products: (rest.products.length
          ? rest.products
          : fbProd.length
            ? fbProd
            : SEED_PRODUCTS
        ).filter((p: any) => p.status === 'active'),
        collections: (rest.collections.length
          ? rest.collections
          : fbCol.length
            ? fbCol
            : SEED_COLLECTIONS
        ).filter((c: any) => c.published),
        pages: (rest.pages.length
          ? rest.pages
          : fbPages.length
            ? fbPages
            : SEED_PAGES
        ).filter((p: any) => p.published),
        posts: (rest.posts.length
          ? rest.posts
          : fbPosts.length
            ? fbPosts
            : SEED_POSTS
        ).filter((p: any) => p.published),
        navigation: rest.navigation.length
          ? rest.navigation
          : fbNav.length
            ? fbNav
            : SEED_NAVIGATION,
        siteContent: rest.siteContent
          ? { ...SEED_SITE_CONTENT, ...rest.siteContent }
          : fallback.siteContent?.published || SEED_SITE_CONTENT,
        settings: rest.settings
          ? { ...SEED_SETTINGS, ...rest.settings }
          : fallback.settings?.public
            ? { ...SEED_SETTINGS, ...fallback.settings.public }
            : SEED_SETTINGS,
      });
    }

    return res.json({
      source: 'seed-fallback',
      products: (fbProd.length ? fbProd : SEED_PRODUCTS).filter((p: any) => p.status === 'active'),
      collections: (fbCol.length ? fbCol : SEED_COLLECTIONS).filter((c: any) => c.published),
      pages: (fbPages.length ? fbPages : SEED_PAGES).filter((p: any) => p.published),
      posts: (fbPosts.length ? fbPosts : SEED_POSTS).filter((p: any) => p.published),
      navigation: fbNav.length ? fbNav : SEED_NAVIGATION,
      siteContent: fallback.siteContent?.published || SEED_SITE_CONTENT,
      settings: fallback.settings?.public
        ? { ...SEED_SETTINGS, ...fallback.settings.public }
        : SEED_SETTINGS,
    });
  });

  const EnquirySchema = z.object({
    name: z.string().trim().min(1).max(120),
    businessType: z.string().trim().max(120).optional().default('General'),
    budget: z.string().trim().max(80).optional().default('Unspecified'),
    message: z.string().trim().min(1).max(3000),
    email: z.string().trim().email().max(160).optional().or(z.literal('')),
    preferredChannel: z.string().trim().max(40).optional(),
    honeypot: z.string().optional(),
  });

  app.post(
    '/api/public/enquiry',
    rateLimitMiddleware(15, 60_000),
    async (req: Request, res: Response) => {
      const parsed = EnquirySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid enquiry payload.' });
      }
      if (parsed.data.honeypot && parsed.data.honeypot.trim().length > 0) {
        return res.json({ success: true, message: 'Enquiry received.' });
      }

      const id = `enq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const { honeypot: _hp, ...clean } = parsed.data;
      const docData = {
        ...clean,
        id,
        handled: false,
        createdAt: new Date().toISOString(),
      };

      let savedToFirestore = false;
      const db = getAdminFirestore();
      if (db) {
        try {
          await db.collection('enquiries').doc(id).set(docData);
          savedToFirestore = true;
        } catch (err) {
          markFirestoreAdminFailed(err);
        }
      }
      if (!savedToFirestore) {
        const fb = readFallbackStore();
        fb.enquiries = { ...(fb.enquiries || {}), [id]: docData };
        writeFallbackStore(fb);
      }
      return res.json({ success: true, message: 'Enquiry received.', id });
    }
  );

  app.post(
    '/api/public/newsletter',
    rateLimitMiddleware(15, 60_000),
    async (req: Request, res: Response) => {
      const schema = z.object({ email: z.string().trim().email().max(160) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Valid email address required.' });
      }
      const cleanEmail = parsed.data.email.toLowerCase();
      const id = `sub-${Buffer.from(cleanEmail).toString('base64url').slice(0, 64)}`;
      const docData = { email: cleanEmail, createdAt: new Date().toISOString() };
      let savedToFirestore = false;
      const db = getAdminFirestore();
      if (db) {
        try {
          await db.collection('newsletter_subscribers').doc(id).set(docData, { merge: true });
          savedToFirestore = true;
        } catch (err) {
          markFirestoreAdminFailed(err);
        }
      }
      if (!savedToFirestore) {
        const fb = readFallbackStore();
        fb.newsletter_subscribers = { ...(fb.newsletter_subscribers || {}), [id]: docData };
        writeFallbackStore(fb);
      }
      return res.json({ success: true, message: 'Subscribed to insights.' });
    }
  );

  // ======================= PROTECTED ADMIN ROUTES =======================

  app.get('/api/admin/bootstrap', requireAdminSession, async (_req: Request, res: Response) => {
    const fallback = readFallbackStore();
    const buildLocalBootstrap = () => {
      const fbProd = Object.values(fallback.products || {});
      const fbCol = Object.values(fallback.collections || {});
      const fbDisc = Object.values(fallback.discounts || {});
      const fbPages = Object.values(fallback.pages || {});
      const fbPosts = Object.values(fallback.posts || {});
      const fbNav = Object.values(fallback.navigation || {});

      return {
        firebaseAdminConfigured: false,
        orders: Object.values(fallback.orders || {}),
        products: fbProd.length ? fbProd : SEED_PRODUCTS,
        collections: fbCol.length ? fbCol : SEED_COLLECTIONS,
        customers: Object.values(fallback.customers || {}),
        discounts: fbDisc.length ? fbDisc : SEED_DISCOUNTS,
        pages: fbPages.length ? fbPages : SEED_PAGES,
        posts: fbPosts.length ? fbPosts : SEED_POSTS,
        navigation: fbNav.length ? fbNav : SEED_NAVIGATION,
        draftSiteContent: fallback.siteContent?.draft || SEED_SITE_CONTENT,
        publishedSiteContent: fallback.siteContent?.published || SEED_SITE_CONTENT,
        settings: fallback.settings?.public
          ? { ...SEED_SETTINGS, ...fallback.settings.public }
          : SEED_SETTINGS,
        roles: fallback.settings?.roles
          ? { ...SEED_ROLES, ...fallback.settings.roles }
          : SEED_ROLES,
        media: Object.values(fallback.media || {}),
        inquiries: [
          ...Object.values(fallback.quote_requests || {}).map((x: any) => ({
            ...x,
            source: 'quote_requests',
          })),
          ...Object.values(fallback.enquiries || {}).map((x: any) => ({
            ...x,
            source: 'enquiries',
          })),
        ],
      };
    };

    const db = getAdminFirestore();
    if (!db) {
      return res.json(buildLocalBootstrap());
    }

    try {
      // Probe one doc unguarded first so auth rejection immediately falls back cleanly
      await db.collection('settings').doc('public').get();

      const [
        ordSnap,
        prodSnap,
        colSnap,
        custSnap,
        discSnap,
        pageSnap,
        postSnap,
        navSnap,
        draftSnap,
        pubSnap,
        setSnap,
        rolesSnap,
        mediaSnap,
        quoteSnap,
        enqSnap,
      ] = await Promise.all([
        db.collection('orders').orderBy('createdAt', 'desc').limit(200).get().catch(() => null),
        db.collection('products').get().catch(() => null),
        db.collection('collections').get().catch(() => null),
        db.collection('customers').limit(200).get().catch(() => null),
        db.collection('discounts').get().catch(() => null),
        db.collection('pages').get().catch(() => null),
        db.collection('posts').get().catch(() => null),
        db.collection('navigation').get().catch(() => null),
        db.collection('siteContent').doc('draft').get().catch(() => null),
        db.collection('siteContent').doc('published').get().catch(() => null),
        db.collection('settings').doc('public').get().catch(() => null),
        db.collection('settings').doc('roles').get().catch(() => null),
        db.collection('media').orderBy('createdAt', 'desc').limit(200).get().catch(() => null),
        db.collection('quote_requests').limit(100).get().catch(() => null),
        db.collection('enquiries').limit(100).get().catch(() => null),
      ]);

      const inquiries: any[] = [];
      quoteSnap?.forEach((d) =>
        inquiries.push({ id: d.id, source: 'quote_requests', ...d.data() })
      );
      enqSnap?.forEach((d) =>
        inquiries.push({ id: d.id, source: 'enquiries', ...d.data() })
      );

      return res.json({
        firebaseAdminConfigured: true,
        orders: ordSnap ? ordSnap.docs.map((d) => ({ ...d.data(), id: d.id })) : [],
        products:
          prodSnap && !prodSnap.empty
            ? prodSnap.docs.map((d) => ({ ...d.data(), id: d.id }))
            : SEED_PRODUCTS,
        collections:
          colSnap && !colSnap.empty
            ? colSnap.docs.map((d) => ({ ...d.data(), id: d.id }))
            : SEED_COLLECTIONS,
        customers: custSnap ? custSnap.docs.map((d) => ({ ...d.data(), id: d.id })) : [],
        discounts:
          discSnap && !discSnap.empty
            ? discSnap.docs.map((d) => ({ ...d.data(), id: d.id }))
            : SEED_DISCOUNTS,
        pages:
          pageSnap && !pageSnap.empty
            ? pageSnap.docs.map((d) => ({ ...d.data(), id: d.id }))
            : SEED_PAGES,
        posts:
          postSnap && !postSnap.empty
            ? postSnap.docs.map((d) => ({ ...d.data(), id: d.id }))
            : SEED_POSTS,
        navigation:
          navSnap && !navSnap.empty
            ? navSnap.docs.map((d) => ({ ...d.data(), id: d.id }))
            : SEED_NAVIGATION,
        draftSiteContent: draftSnap?.exists ? draftSnap.data() : SEED_SITE_CONTENT,
        publishedSiteContent: pubSnap?.exists ? pubSnap.data() : SEED_SITE_CONTENT,
        settings: setSnap?.exists
          ? { ...SEED_SETTINGS, ...setSnap.data() }
          : SEED_SETTINGS,
        roles: rolesSnap?.exists ? { ...SEED_ROLES, ...rolesSnap.data() } : SEED_ROLES,
        media: mediaSnap ? mediaSnap.docs.map((d) => ({ ...d.data(), id: d.id })) : [],
        inquiries,
      });
    } catch (err: any) {
      if (markFirestoreAdminFailed(err)) {
        return res.json(buildLocalBootstrap());
      }
      return res.status(500).json({ error: err?.message || 'Admin bootstrap failed' });
    }
  });

  app.post('/api/admin/doc', requireAdminSession, async (req: Request, res: Response) => {
    const parsed = DocUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: parsed.error.issues.map((i) => i.message),
      });
    }
    const { collection, id, data, merge } = parsed.data;
    const now = new Date().toISOString();
    const payload = { ...data, id, updatedAt: now };

    let persisted: 'firestore' | 'local' = 'local';
    const db = getAdminFirestore();
    if (db) {
      try {
        await db.collection(collection).doc(id).set(payload, { merge: Boolean(merge) });
        persisted = 'firestore';
      } catch (err) {
        if (!markFirestoreAdminFailed(err)) throw err;
      }
    }

    if (persisted === 'local') {
      const fb = readFallbackStore();
      const existing = (fb[collection] || {})[id] || {};
      fb[collection] = {
        ...(fb[collection] || {}),
        [id]: merge ? { ...existing, ...payload } : payload,
      };
      writeFallbackStore(fb);
    }

    if (collection === 'siteContent' || collection === 'settings' || collection === 'products' || collection === 'pages' || collection === 'posts') {
      triggerCacheInvalidation();
    }
    return res.json({ ok: true, id, persisted });
  });

  app.delete('/api/admin/doc', requireAdminSession, async (req: Request, res: Response) => {
    const parsed = DocDeleteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid delete request.' });
    }
    const { collection, id, storagePath } = parsed.data;
    const db = getAdminFirestore();

    if (collection === 'media' && storagePath) {
      const bucket = getAdminStorageBucket();
      if (bucket) {
        await bucket.file(storagePath).delete().catch(() => {});
      }
      if (storagePath.startsWith('uploads/')) {
        const localFile = path.resolve(process.cwd(), 'public', storagePath);
        if (fs.existsSync(localFile)) {
          fs.unlinkSync(localFile);
        }
      }
    }

    let deletedFromFirestore = false;
    if (db) {
      try {
        await db.collection(collection).doc(id).delete();
        deletedFromFirestore = true;
      } catch (err) {
        if (!markFirestoreAdminFailed(err)) throw err;
      }
    }
    if (!deletedFromFirestore) {
      const fb = readFallbackStore();
      if (fb[collection]) {
        delete fb[collection][id];
        writeFallbackStore(fb);
      }
    }

    triggerCacheInvalidation();
    return res.json({ ok: true, id });
  });

  app.post('/api/admin/media/rename', requireAdminSession, async (req: Request, res: Response) => {
    const parsed = MediaRenameSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid media name.' });
    }
    const { id, name } = parsed.data;
    let updatedInFirestore = false;
    const db = getAdminFirestore();
    if (db) {
      try {
        await db.collection('media').doc(id).update({ name: name.trim() });
        updatedInFirestore = true;
      } catch (err) {
        if (!markFirestoreAdminFailed(err)) throw err;
      }
    }
    if (!updatedInFirestore) {
      const fb = readFallbackStore();
      if (fb.media?.[id]) {
        fb.media[id].name = name.trim();
        writeFallbackStore(fb);
      }
    }
    return res.json({ ok: true });
  });

  app.post('/api/admin/publish', requireAdminSession, async (req: Request, res: Response) => {
    const parsed = SitePublishSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid siteContent payload.' });
    }
    const now = new Date().toISOString();
    const draftPayload = { ...parsed.data.content, id: 'draft', updatedAt: now };
    const pubPayload = { ...parsed.data.content, id: 'published', updatedAt: now };

    let publishedToFirestore = false;
    const db = getAdminFirestore();
    if (db) {
      try {
        await Promise.all([
          db.collection('siteContent').doc('draft').set(draftPayload),
          db.collection('siteContent').doc('published').set(pubPayload),
        ]);
        publishedToFirestore = true;
      } catch (err) {
        if (!markFirestoreAdminFailed(err)) throw err;
      }
    }
    if (!publishedToFirestore) {
      const fb = readFallbackStore();
      fb.siteContent = {
        ...(fb.siteContent || {}),
        draft: draftPayload,
        published: pubPayload,
      };
      writeFallbackStore(fb);
    }

    triggerCacheInvalidation();
    return res.json({ ok: true, publishedAt: now });
  });

  app.post('/api/admin/seed', requireAdminSession, async (req: Request, res: Response) => {
    const force = Boolean(req.body?.force);
    const seedLocal = () => {
      const fb = readFallbackStore();
      if (force || !fb.products || Object.keys(fb.products).length === 0) {
        fb.products = Object.fromEntries(SEED_PRODUCTS.map((p) => [p.id, p]));
        fb.collections = Object.fromEntries(SEED_COLLECTIONS.map((c) => [c.id, c]));
        fb.discounts = Object.fromEntries(SEED_DISCOUNTS.map((d) => [d.id, d]));
        fb.pages = Object.fromEntries(SEED_PAGES.map((p) => [p.id, p]));
        fb.posts = Object.fromEntries(SEED_POSTS.map((p) => [p.id, p]));
        fb.navigation = Object.fromEntries(SEED_NAVIGATION.map((n) => [n.id, n]));
        fb.siteContent = {
          published: SEED_SITE_CONTENT,
          draft: { ...SEED_SITE_CONTENT, id: 'draft' },
        };
        fb.settings = { public: SEED_SETTINGS, roles: SEED_ROLES };
        writeFallbackStore(fb);
      }
      return res.json({
        ok: true,
        seededProducts: SEED_PRODUCTS.length,
        seededCollections: SEED_COLLECTIONS.length,
        mode: 'local',
      });
    };

    const db = getAdminFirestore();
    if (!db) {
      return seedLocal();
    }

    try {
      let seededProducts = 0;
      let seededCollections = 0;

      const prodSnap = await db.collection('products').limit(1).get();
      if (force || prodSnap.empty) {
        for (const p of SEED_PRODUCTS) {
          await db.collection('products').doc(p.id).set(p);
          seededProducts++;
        }
      }
      const colSnap = await db.collection('collections').limit(1).get();
      if (force || colSnap.empty) {
        for (const c of SEED_COLLECTIONS) {
          await db.collection('collections').doc(c.id).set(c);
          seededCollections++;
        }
      }
      const discSnap = await db.collection('discounts').limit(1).get();
      if (force || discSnap.empty) {
        for (const d of SEED_DISCOUNTS) {
          await db.collection('discounts').doc(d.id).set(d);
        }
      }
      const pageSnap = await db.collection('pages').limit(1).get();
      if (force || pageSnap.empty) {
        for (const p of SEED_PAGES) {
          await db.collection('pages').doc(p.id).set(p);
        }
      }
      const postSnap = await db.collection('posts').limit(1).get();
      if (force || postSnap.empty) {
        for (const p of SEED_POSTS) {
          await db.collection('posts').doc(p.id).set(p);
        }
      }
      const navSnap = await db.collection('navigation').limit(1).get();
      if (force || navSnap.empty) {
        for (const n of SEED_NAVIGATION) {
          await db.collection('navigation').doc(n.id).set(n);
        }
      }
      const pubSite = await db.collection('siteContent').doc('published').get();
      if (force || !pubSite.exists) {
        await db.collection('siteContent').doc('published').set(SEED_SITE_CONTENT);
        await db
          .collection('siteContent')
          .doc('draft')
          .set({ ...SEED_SITE_CONTENT, id: 'draft' });
      }
      const setSnap = await db.collection('settings').doc('public').get();
      if (force || !setSnap.exists) {
        await db.collection('settings').doc('public').set(SEED_SETTINGS);
      }
      const rolesSnap = await db.collection('settings').doc('roles').get();
      if (force || !rolesSnap.exists) {
        await db.collection('settings').doc('roles').set(SEED_ROLES);
      }

      triggerCacheInvalidation();
      return res.json({ ok: true, seededProducts, seededCollections, mode: 'firestore' });
    } catch (err) {
      if (markFirestoreAdminFailed(err)) {
        return seedLocal();
      }
      throw err;
    }
  });

  app.post(
    '/api/admin/upload',
    requireAdminSession,
    upload.single('file'),
    async (req: Request, res: Response) => {
      try {
        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: 'No file attached.' });
        }

        const detected = detectMediaTypeByMagicBytes(file.buffer);
        if (!detected) {
          return res.status(400).json({
            error:
              'File signature rejected. SVG/HTML files are blocked and uploads must match valid JPG, PNG, WebP, AVIF, GIF, MP4, or WebM magic bytes.',
          });
        }

        const folderRaw = typeof req.body?.folder === 'string' ? req.body.folder : 'store-media';
        const folder = folderRaw.replace(/[^a-zA-Z0-9_-]/g, '') || 'store-media';
        const baseName = file.originalname
          .replace(/\.[^.]+$/, '')
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .slice(0, 60);
        const id = `${Date.now()}-${baseName}`.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 100);

        let finalBuffer = file.buffer;
        let finalMime = detected.mime;
        let ext = detected.ext;

        // Optimize verified raster images to WebP automatically using sharp
        if (detected.kind === 'image' && detected.optimizableRaster) {
          finalBuffer = await sharp(file.buffer)
            .rotate()
            .resize({ width: 1800, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();
          finalMime = 'image/webp';
          ext = '.webp';
        }

        const storagePath = `${folder}/${id}${ext}`;
        let url = '';
        let storedInBucket = false;
        const bucket = getAdminStorageBucket();

        if (bucket && isFirebaseAdminConfigured()) {
          try {
            const gcsFile = bucket.file(storagePath);
            await gcsFile.save(finalBuffer, {
              contentType: finalMime,
              metadata: {
                cacheControl: 'public, max-age=31536000',
              },
            });
            await gcsFile.makePublic().catch(() => {});
            url = `https://storage.googleapis.com/${bucket.name}/${encodeURI(storagePath)}`;
            storedInBucket = true;
          } catch (err) {
            if (!markFirestoreAdminFailed(err)) throw err;
          }
        }

        if (!storedInBucket) {
          // Local disk storage fallback when Firebase Admin service account is unavailable
          fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
          const localName = `${id}${ext}`;
          fs.writeFileSync(path.join(LOCAL_UPLOADS_DIR, localName), finalBuffer);
          url = `/uploads/${localName}`;
        }

        const asset = {
          id,
          name: file.originalname,
          url,
          storagePath: storedInBucket ? storagePath : `uploads/${id}${ext}`,
          mimeType: finalMime,
          sizeBytes: finalBuffer.length,
          createdAt: new Date().toISOString(),
        };

        let savedMeta = false;
        const db = getAdminFirestore();
        if (db) {
          try {
            await db.collection('media').doc(id).set(asset);
            savedMeta = true;
          } catch (err) {
            if (!markFirestoreAdminFailed(err)) throw err;
          }
        }
        if (!savedMeta) {
          const fb = readFallbackStore();
          fb.media = { ...(fb.media || {}), [id]: asset };
          writeFallbackStore(fb);
        }

        return res.json({ ok: true, asset });
      } catch (err: any) {
        return res.status(500).json({ error: err?.message || 'Upload failed.' });
      }
    }
  );
}
