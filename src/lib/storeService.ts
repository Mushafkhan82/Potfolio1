import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  increment,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
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
} from './seedData';
import type {
  BlogPost,
  CmsPage,
  Collection,
  Customer,
  Discount,
  MediaAsset,
  NavigationMenu,
  Order,
  OrderStatus,
  Product,
  RolesConfig,
  SiteContentDoc,
  StoreSettings,
} from '../types/store';

function cleanId(raw: string): string {
  return (
    raw
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100) || `item-${Date.now()}`
  );
}

export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

async function adminApiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Admin API error (${res.status})`);
  }
  return data as T;
}

let cachedBootstrap: any | null = null;
let cachedBootstrapAt = 0;

export async function fetchAdminBootstrap(force = false) {
  if (!force && cachedBootstrap && Date.now() - cachedBootstrapAt < 2500) {
    return cachedBootstrap;
  }
  const data = await adminApiFetch('/api/admin/bootstrap');
  cachedBootstrap = data;
  cachedBootstrapAt = Date.now();
  return data;
}

function invalidateAdminBootstrap() {
  cachedBootstrap = null;
  cachedBootstrapAt = 0;
}

async function adminUpsertDoc(
  colName: string,
  id: string,
  data: Record<string, unknown>,
  merge = false
) {
  invalidateAdminBootstrap();
  return adminApiFetch('/api/admin/doc', {
    method: 'POST',
    body: JSON.stringify({ collection: colName, id, data, merge }),
  });
}

async function adminDeleteDoc(
  colName: string,
  id: string,
  storagePath?: string
) {
  invalidateAdminBootstrap();
  return adminApiFetch('/api/admin/doc', {
    method: 'DELETE',
    body: JSON.stringify({ collection: colName, id, storagePath }),
  });
}

// ======================= MEDIA STORAGE =======================

export async function uploadFileToStorage(
  file: File,
  folder = 'store-media',
  onProgress?: (pct: number) => void
): Promise<MediaAsset> {
  invalidateAdminBootstrap();
  const formData = new FormData();
  formData.append('folder', folder);
  formData.append('file', file);

  if (onProgress) onProgress(30);
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    credentials: 'same-origin',
    body: formData,
  });
  if (onProgress) onProgress(95);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.asset) {
    throw new Error(data?.error || 'Upload failed.');
  }
  if (onProgress) onProgress(100);
  return data.asset as MediaAsset;
}

export async function listMediaAssets(): Promise<MediaAsset[]> {
  const boot = await fetchAdminBootstrap();
  return (boot.media || []) as MediaAsset[];
}

export async function renameMediaAsset(id: string, name: string): Promise<void> {
  invalidateAdminBootstrap();
  await adminApiFetch('/api/admin/media/rename', {
    method: 'POST',
    body: JSON.stringify({ id, name }),
  });
}

export async function deleteMediaAsset(asset: MediaAsset): Promise<void> {
  await adminDeleteDoc('media', asset.id, asset.storagePath);
}

// ======================= PRODUCTS =======================

export async function fetchProducts(onlyActive = false): Promise<Product[]> {
  try {
    const q = onlyActive
      ? query(collection(db, 'products'), where('status', '==', 'active'))
      : query(collection(db, 'products'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ ...(d.data() as Product), id: d.id }));
    }
  } catch {
    // Fallback to server public storefront endpoint / bundled seeds
  }

  try {
    const res = await fetch('/api/public/storefront');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.products) && data.products.length > 0) {
        return data.products;
      }
    }
  } catch {
    // fallback to seeds
  }

  return onlyActive
    ? SEED_PRODUCTS.filter((p) => p.status === 'active')
    : SEED_PRODUCTS;
}

export async function fetchAllProductsAdmin(): Promise<Product[]> {
  const boot = await fetchAdminBootstrap();
  return (boot.products || []) as Product[];
}

export async function saveProduct(product: Product): Promise<void> {
  const id = cleanId(product.id || product.handle || product.title);
  const payload: Product = {
    ...product,
    id,
    handle: slugify(product.handle || product.title) || id,
    updatedAt: new Date().toISOString(),
    createdAt: product.createdAt || new Date().toISOString(),
  };
  await adminUpsertDoc('products', id, payload as unknown as Record<string, unknown>);
}

export async function deleteProduct(id: string): Promise<void> {
  await adminDeleteDoc('products', id);
}

// ======================= COLLECTIONS =======================

export async function fetchCollections(
  onlyPublished = false
): Promise<Collection[]> {
  try {
    const q = onlyPublished
      ? query(collection(db, 'collections'), where('published', '==', true))
      : query(collection(db, 'collections'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ ...(d.data() as Collection), id: d.id }));
    }
  } catch {
    // fallback
  }
  try {
    const res = await fetch('/api/public/storefront');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.collections) && data.collections.length > 0) {
        return data.collections;
      }
    }
  } catch {
    // fallback
  }
  return SEED_COLLECTIONS;
}

export async function saveCollection(col: Collection): Promise<void> {
  const id = cleanId(col.id || col.handle || col.title);
  const payload: Collection = {
    ...col,
    id,
    handle: slugify(col.handle || col.title) || id,
    updatedAt: new Date().toISOString(),
  };
  await adminUpsertDoc('collections', id, payload as unknown as Record<string, unknown>);
}

export async function deleteCollection(id: string): Promise<void> {
  await adminDeleteDoc('collections', id);
}

// ======================= ORDERS & TRACKING =======================

export async function createStorefrontOrder(
  orderInput: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  const now = new Date().toISOString();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `MK-${new Date().getFullYear().toString().slice(-2)}${String(
    new Date().getMonth() + 1
  ).padStart(2, '0')}-${suffix}`;
  const id = cleanId(orderNumber);

  const order: Order = {
    ...orderInput,
    id,
    orderNumber,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'orders', id), order);

    await setDoc(doc(db, 'order_tracking', id), {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      trackingNumber: '',
      courierName: '',
      currency: order.currency,
      total: order.total,
      itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
      updatedAt: now,
    });

    const customerKey = cleanId(order.customerEmail);
    const customerRef = doc(db, 'customers', customerKey);
    await setDoc(
      customerRef,
      {
        id: customerKey,
        uid: order.customerUid || '',
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        city: order.shippingAddress.city,
        country: order.shippingAddress.country,
        ordersCount: increment(1),
        totalSpent: increment(order.total),
        notes: '',
        lastOrderAt: now,
        createdAt: now,
      },
      { merge: true }
    ).catch(() => {});

    return order;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `orders/${id}`);
  }
}

export async function fetchOrdersAdmin(): Promise<Order[]> {
  const boot = await fetchAdminBootstrap();
  return (boot.orders || []) as Order[];
}

export async function fetchCustomerOrders(uid: string): Promise<Order[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'orders'), where('customerUid', '==', uid))
    );
    return snap.docs.map((d) => ({ ...(d.data() as Order), id: d.id }));
  } catch {
    return [];
  }
}

export async function updateOrderAdmin(
  orderId: string,
  patch: Partial<Order>
): Promise<void> {
  const now = new Date().toISOString();
  await adminUpsertDoc(
    'orders',
    orderId,
    { ...(patch as Record<string, unknown>), updatedAt: now },
    true
  );

  const trackingPatch: Record<string, unknown> = { updatedAt: now };
  if (patch.status !== undefined) trackingPatch.status = patch.status;
  if (patch.paymentStatus !== undefined)
    trackingPatch.paymentStatus = patch.paymentStatus;
  if (patch.trackingNumber !== undefined)
    trackingPatch.trackingNumber = patch.trackingNumber;
  if (patch.courierName !== undefined)
    trackingPatch.courierName = patch.courierName;
  await adminUpsertDoc('order_tracking', orderId, trackingPatch, true).catch(
    () => {}
  );
}

export async function lookupOrderTracking(
  orderNumber: string
): Promise<{
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  trackingNumber?: string;
  courierName?: string;
  currency: string;
  total: number;
  itemCount: number;
  updatedAt: string;
} | null> {
  const id = cleanId(orderNumber);
  try {
    const snap = await getDoc(doc(db, 'order_tracking', id));
    return snap.exists() ? (snap.data() as any) : null;
  } catch {
    return null;
  }
}

// ======================= CUSTOMERS =======================

export async function fetchCustomersAdmin(): Promise<Customer[]> {
  const boot = await fetchAdminBootstrap();
  return (boot.customers || []) as Customer[];
}

export async function updateCustomerNotes(
  customerId: string,
  notes: string
): Promise<void> {
  await adminUpsertDoc('customers', customerId, { notes }, true);
}

// ======================= DISCOUNTS =======================

export async function fetchDiscountsAdmin(): Promise<Discount[]> {
  const boot = await fetchAdminBootstrap();
  return (boot.discounts || []) as Discount[];
}

export async function saveDiscount(discount: Discount): Promise<void> {
  const code = discount.code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');
  if (!code) throw new Error('Discount code is required.');
  await adminUpsertDoc('discounts', code, {
    ...(discount as unknown as Record<string, unknown>),
    id: code,
    code,
  });
}

export async function deleteDiscount(code: string): Promise<void> {
  await adminDeleteDoc('discounts', code);
}

export async function validateDiscountCode(
  codeRaw: string,
  subtotalPKR: number
): Promise<{ valid: boolean; discount?: Discount; error?: string }> {
  const code = codeRaw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');
  if (!code) return { valid: false, error: 'Enter a promo code.' };

  let found: Discount | undefined;
  try {
    const snap = await getDoc(doc(db, 'discounts', code));
    if (snap.exists()) {
      found = { ...(snap.data() as Discount), id: snap.id };
    }
  } catch {
    found = SEED_DISCOUNTS.find((d) => d.code === code && d.active);
  }
  if (!found) {
    found = SEED_DISCOUNTS.find((d) => d.code === code && d.active);
  }
  if (!found || !found.active) {
    return { valid: false, error: 'Invalid or inactive discount code.' };
  }
  const now = Date.now();
  if (found.startsAt && new Date(found.startsAt).getTime() > now) {
    return { valid: false, error: 'This code is not active yet.' };
  }
  if (found.endsAt && new Date(`${found.endsAt}T23:59:59`).getTime() < now) {
    return { valid: false, error: 'This discount code has expired.' };
  }
  if (found.usageLimit > 0 && found.usedCount >= found.usageLimit) {
    return { valid: false, error: 'This discount code has reached its usage limit.' };
  }
  if (found.minOrderAmount > 0 && subtotalPKR < found.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order of Rs ${found.minOrderAmount.toLocaleString('en-US')} required.`,
    };
  }
  return { valid: true, discount: found };
}

// ======================= PAGES & BLOG =======================

export async function fetchCmsPages(onlyPublished = false): Promise<CmsPage[]> {
  try {
    const q = onlyPublished
      ? query(collection(db, 'pages'), where('published', '==', true))
      : query(collection(db, 'pages'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ ...(d.data() as CmsPage), id: d.id }));
    }
  } catch {
    // fallback
  }
  try {
    const res = await fetch('/api/public/storefront');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.pages) && data.pages.length > 0) return data.pages;
    }
  } catch {
    // fallback
  }
  return SEED_PAGES;
}

export async function saveCmsPage(page: CmsPage): Promise<void> {
  const id = cleanId(page.id || page.slug || page.title);
  await adminUpsertDoc('pages', id, {
    ...(page as unknown as Record<string, unknown>),
    id,
    slug: slugify(page.slug || page.title) || id,
  });
}

export async function deleteCmsPage(id: string): Promise<void> {
  await adminDeleteDoc('pages', id);
}

export async function fetchBlogPosts(onlyPublished = false): Promise<BlogPost[]> {
  try {
    const q = onlyPublished
      ? query(collection(db, 'posts'), where('published', '==', true))
      : query(collection(db, 'posts'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ ...(d.data() as BlogPost), id: d.id }));
    }
  } catch {
    // fallback
  }
  try {
    const res = await fetch('/api/public/storefront');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.posts) && data.posts.length > 0) return data.posts;
    }
  } catch {
    // fallback
  }
  return SEED_POSTS;
}

export async function saveBlogPost(post: BlogPost): Promise<void> {
  const id = cleanId(post.id || post.slug || post.title);
  await adminUpsertDoc('posts', id, {
    ...(post as unknown as Record<string, unknown>),
    id,
    slug: slugify(post.slug || post.title) || id,
  });
}

export async function deleteBlogPost(id: string): Promise<void> {
  await adminDeleteDoc('posts', id);
}

// ======================= NAVIGATION & SITE CONTENT =======================

export async function fetchNavigationMenus(): Promise<NavigationMenu[]> {
  try {
    const snap = await getDocs(collection(db, 'navigation'));
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        ...(d.data() as NavigationMenu),
        id: d.id,
      }));
    }
  } catch {
    // fallback
  }
  try {
    const res = await fetch('/api/public/storefront');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.navigation) && data.navigation.length > 0) {
        return data.navigation;
      }
    }
  } catch {
    // fallback
  }
  return SEED_NAVIGATION;
}

export async function saveNavigationMenu(menu: NavigationMenu): Promise<void> {
  const id = cleanId(menu.id);
  await adminUpsertDoc('navigation', id, {
    ...(menu as unknown as Record<string, unknown>),
    id,
  });
}

export async function fetchSiteContent(
  target: 'published' | 'draft' = 'published'
): Promise<SiteContentDoc> {
  if (target === 'draft') {
    try {
      const boot = await fetchAdminBootstrap();
      if (boot?.draftSiteContent) {
        return { ...(boot.draftSiteContent as SiteContentDoc), id: 'draft' };
      }
    } catch {
      // fall through
    }
  }
  try {
    const snap = await getDoc(doc(db, 'siteContent', target));
    if (snap.exists()) {
      return { ...(snap.data() as SiteContentDoc), id: target };
    }
  } catch {
    // fallback
  }
  if (target === 'published') {
    try {
      const res = await fetch('/api/public/storefront');
      if (res.ok) {
        const data = await res.json();
        if (data?.siteContent) {
          return { ...(data.siteContent as SiteContentDoc), id: 'published' };
        }
      }
    } catch {
      // fallback
    }
  }
  return { ...SEED_SITE_CONTENT, id: target };
}

export async function saveSiteContentDraft(content: SiteContentDoc): Promise<void> {
  await adminUpsertDoc('siteContent', 'draft', {
    ...(content as unknown as Record<string, unknown>),
    id: 'draft',
  });
}

export async function publishSiteContent(content: SiteContentDoc): Promise<void> {
  invalidateAdminBootstrap();
  await adminApiFetch('/api/admin/publish', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// ======================= SETTINGS & ROLES =======================

export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'public'));
    if (snap.exists()) {
      return { ...SEED_SETTINGS, ...(snap.data() as Partial<StoreSettings>) };
    }
  } catch {
    // fallback
  }
  try {
    const res = await fetch('/api/public/storefront');
    if (res.ok) {
      const data = await res.json();
      if (data?.settings) {
        return { ...SEED_SETTINGS, ...(data.settings as Partial<StoreSettings>) };
      }
    }
  } catch {
    // fallback
  }
  return SEED_SETTINGS;
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  await adminUpsertDoc('settings', 'public', {
    ...(settings as unknown as Record<string, unknown>),
    id: 'public',
  });
}

export async function fetchRolesConfig(): Promise<RolesConfig> {
  try {
    const boot = await fetchAdminBootstrap();
    if (boot?.roles) return { ...SEED_ROLES, ...(boot.roles as Partial<RolesConfig>) };
  } catch {
    // fallback
  }
  return SEED_ROLES;
}

export async function saveRolesConfig(roles: RolesConfig): Promise<void> {
  await adminUpsertDoc(
    'settings',
    'roles',
    roles as unknown as Record<string, unknown>
  );
}

// ======================= LEGACY PORTFOLIO INQUIRIES =======================

export async function fetchLegacyInquiries(): Promise<any[]> {
  try {
    const boot = await fetchAdminBootstrap();
    return boot.inquiries || [];
  } catch {
    return [];
  }
}

export async function toggleInquiryStatus(
  id: string,
  source: string,
  nextHandled: boolean
): Promise<void> {
  const col = source === 'quote_requests' ? 'quote_requests' : 'enquiries';
  const patch =
    col === 'quote_requests'
      ? { status: nextHandled ? 'accepted' : 'submitted' }
      : { handled: nextHandled };
  await adminUpsertDoc(col, id, patch, true);
}

// ======================= INITIAL FIRESTORE SEEDER =======================

export async function seedStoreDataIfEmpty(force = false): Promise<{
  seededProducts: number;
  seededCollections: number;
}> {
  invalidateAdminBootstrap();
  const data = await adminApiFetch<{
    seededProducts?: number;
    seededCollections?: number;
  }>('/api/admin/seed', {
    method: 'POST',
    body: JSON.stringify({ force }),
  });
  return {
    seededProducts: data.seededProducts || 0,
    seededCollections: data.seededCollections || 0,
  };
}
