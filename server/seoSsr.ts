import fs from 'fs';
import path from 'path';
import type { Request } from 'express';
import { getAdminFirestore, markFirestoreAdminFailed } from './firebaseAdmin';
import { fetchPublicStorefrontFromRest } from './firestorePublicRest';
import {
  SEED_COLLECTIONS,
  SEED_PAGES,
  SEED_POSTS,
  SEED_PRODUCTS,
  SEED_SETTINGS,
  SEED_SITE_CONTENT,
} from '../src/lib/seedData';
import { FAQ_ITEMS, PROJECTS, SERVICES, SITE_META } from '../src/data/studioData';
import type {
  BlogPost,
  CmsPage,
  Collection,
  Product,
  SiteContentDoc,
  StoreSettings,
} from '../src/types/store';

interface PublicSeoSnapshot {
  fetchedAt: number;
  products: Product[];
  collections: Collection[];
  pages: CmsPage[];
  posts: BlogPost[];
  siteContent: SiteContentDoc;
  settings: StoreSettings;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedSnapshot: PublicSeoSnapshot | null = null;
const FALLBACK_FILE = path.resolve(process.cwd(), '.data', 'admin-store.json');

export function invalidateSeoCache(): void {
  cachedSnapshot = null;
}

function readLocalFallback(): Record<string, any> {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      return JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'));
    }
  } catch {
    // ignore corrupt local fallback
  }
  return {};
}

export async function getPublicSeoSnapshot(): Promise<PublicSeoSnapshot> {
  if (cachedSnapshot && Date.now() - cachedSnapshot.fetchedAt < CACHE_TTL_MS) {
    return cachedSnapshot;
  }

  const fb = readLocalFallback();
  const fbProducts = Object.values(fb.products || {}) as Product[];
  const fbCollections = Object.values(fb.collections || {}) as Collection[];
  const fbPages = Object.values(fb.pages || {}) as CmsPage[];
  const fbPosts = Object.values(fb.posts || {}) as BlogPost[];

  const db = getAdminFirestore();
  if (db) {
    try {
      const [prodSnap, colSnap, pageSnap, postSnap, siteSnap, setSnap] =
        await Promise.all([
          db.collection('products').where('status', '==', 'active').get(),
          db.collection('collections').where('published', '==', true).get(),
          db.collection('pages').where('published', '==', true).get(),
          db.collection('posts').where('published', '==', true).get(),
          db.collection('siteContent').doc('published').get(),
          db.collection('settings').doc('public').get(),
        ]);

      cachedSnapshot = {
        fetchedAt: Date.now(),
        products: prodSnap.empty
          ? (fbProducts.length ? fbProducts : SEED_PRODUCTS).filter((p) => p.status === 'active')
          : (prodSnap.docs.map((d) => ({ ...d.data(), id: d.id })) as Product[]),
        collections: colSnap.empty
          ? (fbCollections.length ? fbCollections : SEED_COLLECTIONS).filter((c) => c.published)
          : (colSnap.docs.map((d) => ({ ...d.data(), id: d.id })) as Collection[]),
        pages: pageSnap.empty
          ? (fbPages.length ? fbPages : SEED_PAGES).filter((p) => p.published)
          : (pageSnap.docs.map((d) => ({ ...d.data(), id: d.id })) as CmsPage[]),
        posts: postSnap.empty
          ? (fbPosts.length ? fbPosts : SEED_POSTS).filter((p) => p.published)
          : (postSnap.docs.map((d) => ({ ...d.data(), id: d.id })) as BlogPost[]),
        siteContent: siteSnap.exists
          ? ({ ...SEED_SITE_CONTENT, ...siteSnap.data() } as SiteContentDoc)
          : fb.siteContent?.published || SEED_SITE_CONTENT,
        settings: setSnap.exists
          ? ({ ...SEED_SETTINGS, ...setSnap.data() } as StoreSettings)
          : fb.settings?.public
            ? { ...SEED_SETTINGS, ...fb.settings.public }
            : SEED_SETTINGS,
      };
      return cachedSnapshot;
    } catch (err) {
      if (!markFirestoreAdminFailed(err)) {
        console.info('[seoSsr] Switching to public REST/fallback snapshot.');
      }
    }
  }

  const rest = await fetchPublicStorefrontFromRest();
  if (rest?.ok) {
    cachedSnapshot = {
      fetchedAt: Date.now(),
      products: (rest.products.length
        ? (rest.products as Product[])
        : fbProducts.length
          ? fbProducts
          : SEED_PRODUCTS
      ).filter((p) => p.status === 'active'),
      collections: (rest.collections.length
        ? (rest.collections as Collection[])
        : fbCollections.length
          ? fbCollections
          : SEED_COLLECTIONS
      ).filter((c) => c.published),
      pages: (rest.pages.length
        ? (rest.pages as CmsPage[])
        : fbPages.length
          ? fbPages
          : SEED_PAGES
      ).filter((p) => p.published),
      posts: (rest.posts.length
        ? (rest.posts as BlogPost[])
        : fbPosts.length
          ? fbPosts
          : SEED_POSTS
      ).filter((p) => p.published),
      siteContent: rest.siteContent
        ? ({ ...SEED_SITE_CONTENT, ...rest.siteContent } as SiteContentDoc)
        : fb.siteContent?.published || SEED_SITE_CONTENT,
      settings: rest.settings
        ? ({ ...SEED_SETTINGS, ...rest.settings } as StoreSettings)
        : fb.settings?.public
          ? { ...SEED_SETTINGS, ...fb.settings.public }
          : SEED_SETTINGS,
    };
    return cachedSnapshot;
  }

  cachedSnapshot = {
    fetchedAt: Date.now(),
    products: (fbProducts.length ? fbProducts : SEED_PRODUCTS).filter(
      (p) => p.status === 'active'
    ),
    collections: (fbCollections.length ? fbCollections : SEED_COLLECTIONS).filter(
      (c) => c.published
    ),
    pages: (fbPages.length ? fbPages : SEED_PAGES).filter((p) => p.published),
    posts: (fbPosts.length ? fbPosts : SEED_POSTS).filter((p) => p.published),
    siteContent: fb.siteContent?.published || SEED_SITE_CONTENT,
    settings: fb.settings?.public
      ? { ...SEED_SETTINGS, ...fb.settings.public }
      : SEED_SETTINGS,
  };

  return cachedSnapshot;
}

export function resolveRequestOrigin(req: Request): string {
  const rawConfigured = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (rawConfigured) {
    return rawConfigured.startsWith('http://') || rawConfigured.startsWith('https://')
      ? rawConfigured
      : `https://${rawConfigured}`;
  }
  const proto =
    (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim() ||
    req.protocol ||
    'https';
  const host = req.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/-->/g, '--\\>');
}

function absoluteMediaUrl(rawUrl: string | undefined, origin: string): string {
  const src = (rawUrl || '/og-image.png').trim();
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return `${origin}${src.startsWith('/') ? src : `/${src}`}`;
}

const STATIC_ROUTE_META: Record<
  string,
  { title: string; description: string; h1: string; summary: string; noIndex?: boolean }
> = {
  '/': {
    title: 'Mushaf Khan | Independent Web Developer & Creative Partner',
    description:
      'High-speed React websites, UI/UX design, video editing, 3D visuals, local SEO architecture, AI automation, and studio editions store.',
    h1: 'I build digital work that gets customers through the door.',
    summary:
      'Multi-disciplinary digital studio by Mushaf Khan: React web apps, UI/UX systems, 3D visuals, SEO, AI workflows, and digital templates.',
  },
  '/about': {
    title: 'About Mushaf Khan | Digital Partner & Engineer',
    description:
      'Learn how Mushaf Khan works directly with founders and local businesses to ship fast custom websites, 3D visuals, and SEO in 14 days.',
    h1: 'Direct senior execution without agency bureaucracy.',
    summary:
      'One creative partner uniting engineering, UI/UX design, motion, 3D rendering, SEO, and AI automation.',
  },
  '/services': {
    title: 'Services | Web Apps, UI/UX, 3D, Video, SEO & AI',
    description:
      'Explore all 8 specialized disciplines at Mushaf Khan Digital Studio: web development, UI/UX, video editing, motion, 3D/Blender, SEO, social media, and AI automation.',
    h1: 'Eight integrated studio disciplines.',
    summary:
      'From production React engineering to Blender 3D visualization, conversion SEO, and automated AI workflows.',
  },
  '/work': {
    title: 'Portfolio & Case Studies | Mushaf Khan Studio',
    description:
      'Browse measured case studies across hospitality, health clinics, e-commerce brands, 3D visualization, SEO campaigns, and AI automation.',
    h1: 'Selected portfolio & measured client outcomes.',
    summary:
      'Verified conversion lifts, sub-second load speeds, and direct booking systems across 14+ studio projects.',
  },
  '/pricing': {
    title: 'Transparent Pricing | 14-Day Fixed-Scope Sprints',
    description:
      'Clear milestone-based pricing for custom websites, UI/UX redesigns, local SEO packages, 3D assets, and AI automation builds.',
    h1: 'Clear fixed pricing with zero agency bloat.',
    summary:
      'Scoped 14-day build sprints with direct communication and transparent deliverables in USD or PKR.',
  },
  '/process': {
    title: '14-Day Delivery Process | Mushaf Khan Studio',
    description:
      'See how projects move from a 30-minute kickoff call and mobile prototype to a high-speed production launch in 14 days.',
    h1: 'From kickoff brief to live production launch in 14 days.',
    summary:
      'Four structured milestones built around speed, mobile ergonomics, and zero handoff friction.',
  },
  '/skills': {
    title: 'Technical Stack & Creative Capabilities | Mushaf Khan',
    description:
      'React 19, TypeScript, Next.js, Node.js, Three.js, Blender 3D, Tailwind CSS, technical SEO, and Gemini AI automation workflows.',
    h1: 'Technical stack & creative tooling.',
    summary:
      'Full-stack JavaScript, real-time 3D WebGL, Blender visualization, motion design, and production AI agents.',
  },
  '/book': {
    title: 'Book a Strategy Call | Mushaf Khan Studio',
    description:
      'Schedule a direct 30-minute project scoping call to plan your website, redesign, 3D visual campaign, or automation sprint.',
    h1: 'Book a direct 30-minute scoping session.',
    summary:
      'Discuss goals, timelines, and exact fixed pricing directly with Mushaf Khan.',
  },
  '/contact': {
    title: 'Start a Project | Contact Mushaf Khan Studio',
    description:
      'Send a project brief or inquiry directly to Mushaf Khan. Fast 24-hour response for web, UI/UX, 3D, SEO, and AI automation projects.',
    h1: 'Start a project directly.',
    summary:
      'Share your project scope, target launch window, and budget for a same-day response.',
  },
  '/shop': {
    title: 'Studio Editions & Digital Kits Store | Mushaf Khan',
    description:
      'Shop handcrafted studio desk gear, UI design systems, Blender shader packs, and cinema LUTs from Mushaf Khan Digital Studio.',
    h1: 'Studio Store & Digital Editions.',
    summary:
      'Curated hardware essentials, React UI kits, cinema color LUTs, and Blender shader packs.',
  },
  '/collections': {
    title: 'Store Collections | Mushaf Khan Studio',
    description:
      'Browse curated collections: Studio Hardware, Digital Kits, and Atelier Apparel built by Mushaf Khan Digital Studio.',
    h1: 'Curated studio collections.',
    summary: 'Explore physical workspace hardware, digital templates, and studio apparel.',
  },
  '/track-order': {
    title: 'Track Your Order | Mushaf Khan Store',
    description:
      'Check live fulfillment and courier tracking status for your Mushaf Khan Studio Store order.',
    h1: 'Track your studio order.',
    summary: 'Enter your order number to view live fulfillment progress.',
  },
  '/blog': {
    title: 'Studio Journal & Guides | Mushaf Khan',
    description:
      'Field notes on web performance, local SEO, conversion rate optimization, 3D motion, and AI automation systems.',
    h1: 'Studio Journal & Engineering Notes.',
    summary:
      'Practical playbooks on site speed, search rankings, interactive 3D, and design systems.',
  },
  '/privacy': {
    title: 'Privacy Policy | Mushaf Khan Studio',
    description: 'Privacy practices and data handling standards for Mushaf Khan Digital Studio.',
    h1: 'Privacy Policy.',
    summary: 'How inquiries, orders, and analytics cookies are handled.',
  },
  '/terms': {
    title: 'Terms of Service | Mushaf Khan Studio',
    description: 'Terms of service, project licensing, and store policies for Mushaf Khan Studio.',
    h1: 'Terms of Service.',
    summary: 'Client sprint terms, digital product licensing, and store conditions.',
  },
  '/checkout': {
    title: 'Checkout | Mushaf Khan Studio Store',
    description: 'Complete your order securely at Mushaf Khan Studio Store.',
    h1: 'Store Checkout.',
    summary: 'Review your bag and confirm shipping & payment.',
    noIndex: true,
  },
  '/wishlist': {
    title: 'Saved Wishlist | Mushaf Khan Studio Store',
    description: 'View your saved products and digital kits.',
    h1: 'Saved Wishlist.',
    summary: 'Products saved for later.',
    noIndex: true,
  },
};

export interface ResolvedRouteSeo {
  statusCode: number;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogType: string;
  ogImage: string;
  h1: string;
  summary: string;
  jsonLd: unknown[];
}

export async function resolveRouteSeo(req: Request): Promise<ResolvedRouteSeo> {
  const origin = resolveRequestOrigin(req);
  const rawPath = req.path || '/';
  const pathname = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : '/';
  const canonical = `${origin}${pathname === '/' ? '' : pathname}` || `${origin}/`;
  const snapshot = await getPublicSeoSnapshot();
  const pageOverride = snapshot.siteContent?.pageSeo?.[pathname];

  const baseOrganization = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: snapshot.settings.storeName || SITE_META.siteName,
    url: origin,
    image: absoluteMediaUrl(SITE_META.ogImage, origin),
    founder: {
      '@type': 'Person',
      name: 'Mushaf Khan',
      jobTitle: SITE_META.jobTitle,
    },
    areaServed: 'Worldwide',
  };

  const jsonLd: unknown[] = [baseOrganization];

  let statusCode = 200;
  let title = snapshot.settings.defaultSeoTitle || SITE_META.defaultTitle;
  let description =
    snapshot.settings.defaultMetaDescription || SITE_META.defaultDescription;
  let robots = 'index, follow';
  let ogType = 'website';
  let ogImage = absoluteMediaUrl(SITE_META.ogImage, origin);
  let h1 = 'Mushaf Khan | Digital Studio & Store';
  let summary = description;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    title = 'Admin Dashboard | Mushaf Khan Studio';
    description = 'Private administration workspace for Mushaf Khan Digital Studio.';
    robots = 'noindex, nofollow';
    h1 = 'Studio Admin Access';
    summary = 'Authenticated dashboard for store and site management.';
  } else if (pathname.startsWith('/order-confirmation/')) {
    title = 'Order Confirmed | Mushaf Khan Studio Store';
    description = 'Order confirmation details for Mushaf Khan Studio Store.';
    robots = 'noindex, nofollow';
    h1 = 'Order Confirmation';
    summary = 'Thank you for your order at Mushaf Khan Studio Store.';
  } else if (STATIC_ROUTE_META[pathname]) {
    const meta = STATIC_ROUTE_META[pathname];
    title = meta.title;
    description = meta.description;
    h1 = meta.h1;
    summary = meta.summary;
    if (meta.noIndex) robots = 'noindex, nofollow';

    if (pathname === '/') {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      });
    }
  } else if (pathname.startsWith('/services/')) {
    const slug = pathname.replace('/services/', '');
    const svc = SERVICES.find((s) => s.slug === slug);
    if (svc) {
      title = `${svc.name} | Mushaf Khan Studio`;
      description = `${svc.headline} — ${svc.description}`.slice(0, 158);
      h1 = svc.name;
      summary = svc.headline;
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
          { '@type': 'ListItem', position: 2, name: 'Services', item: `${origin}/services` },
          { '@type': 'ListItem', position: 3, name: svc.name, item: canonical },
        ],
      });
    } else {
      statusCode = 404;
    }
  } else if (pathname.startsWith('/work/')) {
    const slug = pathname.replace('/work/', '');
    const proj = PROJECTS.find((p) => p.id === slug);
    if (proj) {
      title = `${proj.name} — Case Study | Mushaf Khan Studio`;
      description = proj.outcome.slice(0, 158);
      h1 = proj.name;
      summary = `${proj.serviceType} · ${proj.outcome}`;
      if (proj.heroImage || proj.desktopShot) {
        ogImage = absoluteMediaUrl(proj.heroImage || proj.desktopShot, origin);
      }
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
          { '@type': 'ListItem', position: 2, name: 'Work', item: `${origin}/work` },
          { '@type': 'ListItem', position: 3, name: proj.name, item: canonical },
        ],
      });
    } else {
      statusCode = 404;
    }
  } else if (pathname.startsWith('/product/')) {
    const handle = pathname.replace('/product/', '');
    const prod = snapshot.products.find((p) => p.handle === handle || p.id === handle);
    if (prod) {
      title = prod.seoTitle || `${prod.title} | Mushaf Khan Store`;
      description = (prod.metaDescription || prod.description || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 158);
      h1 = prod.title;
      summary = description || prod.title;
      ogType = 'product';
      if (prod.media?.[0]?.url) {
        ogImage = absoluteMediaUrl(prod.media[0].url, origin);
      }
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: prod.title,
        image: ogImage,
        description,
        sku: prod.sku,
        offers: {
          '@type': 'Offer',
          url: canonical,
          priceCurrency: 'PKR',
          price: String(prod.price || 0),
          availability:
            !prod.trackInventory || prod.stockQuantity > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
        },
      });
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
          { '@type': 'ListItem', position: 2, name: 'Shop', item: `${origin}/shop` },
          { '@type': 'ListItem', position: 3, name: prod.title, item: canonical },
        ],
      });
    } else {
      statusCode = 404;
    }
  } else if (pathname.startsWith('/collections/')) {
    const slug = pathname.replace('/collections/', '');
    const col = snapshot.collections.find((c) => c.handle === slug || c.id === slug);
    if (col) {
      title = `${col.title} | Mushaf Khan Store`;
      description = (col.description || `Explore ${col.title} from Mushaf Khan Store.`).slice(
        0,
        158
      );
      h1 = col.title;
      summary = description;
      if (col.imageUrl) ogImage = absoluteMediaUrl(col.imageUrl, origin);
    } else {
      statusCode = 404;
    }
  } else if (pathname.startsWith('/blog/')) {
    const slug = pathname.replace('/blog/', '');
    const post = snapshot.posts.find((p) => p.slug === slug || p.id === slug);
    if (post) {
      title = post.seoTitle || `${post.title} | Mushaf Khan Journal`;
      description = (post.metaDescription || post.excerpt || post.title).slice(0, 158);
      h1 = post.title;
      summary = post.excerpt || description;
      ogType = 'article';
      if (post.coverImage) ogImage = absoluteMediaUrl(post.coverImage, origin);
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description,
        image: ogImage,
        author: { '@type': 'Person', name: post.author || 'Mushaf Khan' },
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        mainEntityOfPage: canonical,
      });
    } else {
      statusCode = 404;
    }
  } else if (pathname.startsWith('/pages/')) {
    const slug = pathname.replace('/pages/', '');
    const pg = snapshot.pages.find((p) => p.slug === slug || p.id === slug);
    if (pg) {
      title = pg.seoTitle || `${pg.title} | Mushaf Khan Studio`;
      description = (pg.metaDescription || `${pg.title} — Mushaf Khan Studio`).slice(0, 158);
      h1 = pg.title;
      summary = description;
    } else {
      statusCode = 404;
    }
  } else {
    statusCode = 404;
  }

  if (statusCode === 404) {
    title = 'Page Not Found | Mushaf Khan Studio';
    description = 'The requested page could not be found on Mushaf Khan Digital Studio.';
    robots = 'noindex, follow';
    h1 = 'Page Not Found';
    summary = 'Explore the portfolio, services, or store catalog.';
  }

  // Apply explicit Admin Page SEO override when present on live 200 routes
  if (statusCode === 200 && pageOverride) {
    if (pageOverride.title?.trim()) title = pageOverride.title.trim();
    if (pageOverride.description?.trim()) description = pageOverride.description.trim();
    if (pageOverride.ogImage?.trim()) {
      ogImage = absoluteMediaUrl(pageOverride.ogImage.trim(), origin);
    }
  }

  return {
    statusCode,
    title,
    description,
    canonical,
    robots,
    ogType,
    ogImage,
    h1,
    summary,
    jsonLd,
  };
}

export function injectSsrHtml(templateHtml: string, seo: ResolvedRouteSeo): string {
  const safeTitle = escapeHtml(seo.title);
  const safeDesc = escapeHtml(seo.description);
  const safeCanon = escapeHtml(seo.canonical);
  const safeImg = escapeHtml(seo.ogImage);
  const safeRobots = escapeHtml(seo.robots);
  const safeOgType = escapeHtml(seo.ogType);

  const ldScripts = seo.jsonLd
    .map((obj) => `<script type="application/ld+json">${safeJsonLd(obj)}</script>`)
    .join('\n    ');

  const injectedHead = `
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    <meta name="robots" content="${safeRobots}" />
    <link rel="canonical" href="${safeCanon}" />
    <meta property="og:type" content="${safeOgType}" />
    <meta property="og:site_name" content="Mushaf Khan | Digital Studio" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:url" content="${safeCanon}" />
    <meta property="og:image" content="${safeImg}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${safeImg}" />
    ${ldScripts}
  `;

  // Strip the static title + og/twitter/description tags before injecting dynamic route meta
  let html = templateHtml
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta[^>]+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']robots["'][^>]*>/gi, '')
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi, '');

  html = html.replace('</head>', `${injectedHead}\n  </head>`);

  const ssrFallbackInner = `<div id="root"><div class="ssr-shell" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden"><h1>${escapeHtml(seo.h1)}</h1><p>${escapeHtml(seo.summary)}</p></div></div>`;
  html = html.replace('<div id="root"></div>', ssrFallbackInner);

  return html;
}

export async function generateDynamicSitemapXml(req: Request): Promise<string> {
  const origin = resolveRequestOrigin(req);
  const snapshot = await getPublicSeoSnapshot();
  const today = new Date().toISOString().slice(0, 10);

  const paths = new Set<string>([
    '/',
    '/work',
    '/services',
    '/shop',
    '/collections',
    '/track-order',
    '/blog',
    '/about',
    '/process',
    '/skills',
    '/pricing',
    '/book',
    '/contact',
    '/privacy',
    '/terms',
    ...SERVICES.map((s) => `/services/${s.slug}`),
    ...PROJECTS.map((p) => `/work/${p.id}`),
    ...snapshot.collections.map((c) => `/collections/${c.handle}`),
    ...snapshot.products.map((p) => `/product/${p.handle}`),
    ...snapshot.posts.map((p) => `/blog/${p.slug}`),
    ...snapshot.pages.map((p) => `/pages/${p.slug}`),
  ]);

  const urlNodes = Array.from(paths)
    .map((routePath) => {
      const loc = `${origin}${routePath === '/' ? '/' : routePath}`;
      const priority =
        routePath === '/'
          ? '1.0'
          : routePath === '/shop' || routePath === '/work' || routePath === '/services'
            ? '0.9'
            : '0.7';
      return `<url><loc>${escapeHtml(loc)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlNodes}</urlset>`;
}

export function generateRobotsTxt(req: Request): string {
  const origin = resolveRequestOrigin(req);
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /checkout',
    'Disallow: /wishlist',
    'Disallow: /order-confirmation/',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}
